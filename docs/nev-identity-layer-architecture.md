# NEV identity layer — architecture

**Status**: draft for build · **Owner**: Murtaza · **Last updated**: May 2026

## Context

NEV currently runs an LP portal on Supabase (Supabase Auth via magic links, Resend as SMTP provider). No LPs have been invited yet. We're about to build a sourcing tool as a separate Next.js app, and will likely add more internal tools (memo writer, CRM-lite, intern-facing utilities) over the next 12 months.

Rather than duplicate auth and user management per tool, this doc specifies a **shared identity layer**: one Supabase project, one user table, role-based per-tool access control, single sign-on across all NEV apps via a shared parent domain, and a small admin app for managing users.

The existing LP portal Supabase project will be repurposed as the workspace's identity layer — no new project required.

## Goals

- One login per user across all NEV tools (Murtaza, Carter, LPs, interns, future hires)
- Per-tool access control: a user is granted access to specific tools, not all of them
- An admin app for inviting and managing users without touching Supabase Studio
- Zero disruption to the existing LP portal (which has no users yet — trivial migration)
- Future tools require zero net-new auth work; they declare a tool ID and check access

## Non-goals (v1)

- Multi-tenancy. NEV is the only org. No `organizations` table until there's a real second org
- Google/Microsoft OAuth. Magic links are enough for now; add OAuth later if needed
- Granular in-tool permissions ("viewer" vs "editor" within sourcing). Tool access is binary in v1
- Audit logging beyond Supabase's built-in auth logs
- Self-service password recovery (no passwords exist — magic links only)

## Architecture

```
                    ┌────────────────────────────────────┐
                    │  Supabase project (NEV workspace)  │
                    │                                    │
                    │   Auth: Supabase Auth + Resend     │
                    │                                    │
                    │   Tables: profiles, app_access,    │
                    │   invitations, tools, (LP data)    │
                    └────────────────────────────────────┘
                          ▲          ▲          ▲          ▲
                          │          │          │          │
              ┌───────────┘   ┌──────┘    ┌─────┘    └─────────┐
              │               │           │                    │
    ┌─────────┴────────┐ ┌────┴──────┐ ┌──┴─────────┐ ┌────────┴────────┐
    │ lp.nev...        │ │ sourcing  │ │ admin      │ │ auth            │
    │ Next.js (exists) │ │ .nev...   │ │ .nev...    │ │ .nev...         │
    │                  │ │ (new)     │ │ (new)      │ │ (login + cbk)   │
    └──────────────────┘ └───────────┘ └────────────┘ └─────────────────┘
                          ▲
                          │
                   (future tools join here)
```

All apps share the same Supabase project. All apps share the same session cookie via the `.neweraventures.com` parent domain. All apps consult the `profiles.app_access` array to decide whether to render their UI.

## Data model

Three changes to the existing Supabase project. Run as a single migration.

### `profiles` table additions

You likely already have a `public.profiles` table joined to `auth.users` (the standard Supabase pattern). If not, create one first. Then:

```sql
alter table public.profiles
  add column role text not null default 'lp' 
    check (role in ('admin', 'member', 'lp', 'intern')),
  add column app_access text[] not null default '{}',
  add column status text not null default 'active' 
    check (status in ('active', 'invited', 'deactivated')),
  add column invited_by uuid references public.profiles(id),
  add column invited_at timestamptz,
  add column last_seen_at timestamptz;
```

Field notes:
- `role` is the user's identity tier. Admins (Murtaza, Carter) can manage other users. Members are full NEV team. LPs are external. Interns are scoped tightly.
- `app_access` is the per-tool gate. Values are tool IDs: `lp_portal`, `sourcing`, `admin`, plus whatever future tools add. An intern might be `['sourcing']`. An LP is `['lp_portal']`. Admins typically have everything.
- `status` lets us deactivate without deleting — preserves audit trail and avoids breaking foreign keys.

### `invitations` table

```sql
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role text not null,
  app_access text[] not null default '{}',
  invited_by uuid references public.profiles(id) not null,
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  token text not null unique,
  expires_at timestamptz not null default (now() + interval '14 days')
);

create index on public.invitations (email) where accepted_at is null;
create index on public.invitations (token);
```

When an admin invites someone, we insert a row here, Supabase Auth issues a magic link, Resend delivers it. On accept, we create the profile from invitation data and mark the invitation accepted.

### `tools` table

A small lookup table so the admin app can render checkboxes dynamically without hardcoding tool IDs.

```sql
create table public.tools (
  id text primary key,
  name text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.tools (id, name, description) values
  ('lp_portal', 'LP Portal',  'Investor-facing fund updates and reporting'),
  ('sourcing',  'NEV Signal', 'Deal sourcing and signal tracking'),
  ('admin',     'Admin',      'User and access management');
```

Adding a new tool later = one insert.

### Row-Level Security

Critical to enable on every table. Defaults to deny-all when RLS is on.

```sql
alter table public.profiles enable row level security;
alter table public.invitations enable row level security;
alter table public.tools enable row level security;

-- Users can read their own profile
create policy "users read own profile" on public.profiles
  for select using (auth.uid() = id);

-- Admins can read all profiles
create policy "admins read all profiles" on public.profiles
  for select using (
    exists (select 1 from public.profiles 
            where id = auth.uid() and role = 'admin' and status = 'active')
  );

-- Admins can update profiles
create policy "admins update profiles" on public.profiles
  for update using (
    exists (select 1 from public.profiles 
            where id = auth.uid() and role = 'admin' and status = 'active')
  );

-- Only admins touch invitations
create policy "admins manage invitations" on public.invitations
  for all using (
    exists (select 1 from public.profiles 
            where id = auth.uid() and role = 'admin' and status = 'active')
  );

-- Everyone can read the tools lookup table
create policy "anyone reads tools" on public.tools
  for select using (true);
```

Per-tool data tables (sourcing signals, LP portal documents, etc.) get their own RLS policies in their respective apps. The principle: RLS enforces what middleware can't — if a user crafts a direct Supabase query bypassing the Next.js middleware, RLS still blocks them.

## Auth flow

1. User visits any app (e.g., `sourcing.neweraventures.com`).
2. If no session cookie → middleware redirects to `auth.neweraventures.com/login?next=<url>`.
3. User enters email → Supabase Auth issues magic link → Resend delivers it.
4. User clicks link → lands on `auth.neweraventures.com/callback` → session cookie is set on `.neweraventures.com` (parent domain).
5. User is redirected to the `?next=` destination.
6. Destination app reads session, looks up `profiles` row, checks `app_access`. Granted → render. Not granted → 403 page with a "request access" link that emails the admins.

Because the cookie is scoped to the parent domain, the session works across every subdomain automatically — no per-app login.

## Subdomain & cookie strategy

DNS (all CNAMEd to Vercel):
- `lp.neweraventures.com` → LP portal (existing)
- `sourcing.neweraventures.com` → sourcing tool (new)
- `admin.neweraventures.com` → admin app (new)
- `auth.neweraventures.com` → centralized auth pages (login, callback, no-access, request-access)

Supabase Dashboard → Authentication → URL Configuration:
- Site URL: `https://auth.neweraventures.com`
- Redirect URLs: `https://*.neweraventures.com/**`

Supabase client config in each Next.js app — set the cookie domain explicitly:

```ts
createServerClient(url, anonKey, {
  cookies: { ... },
  cookieOptions: {
    domain: '.neweraventures.com',
    sameSite: 'lax',
    secure: true,
  }
})
```

This is what makes the session portable across subdomains. Easy to miss; critical to get right.

## Per-app access enforcement

Each app implements one middleware file. Pattern in Next.js App Router:

```ts
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

const TOOL_ID = 'sourcing' // change per app

export async function middleware(request) {
  const supabase = createServerClient(/* env + cookie config */)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const next = encodeURIComponent(request.url)
    return NextResponse.redirect(
      `https://auth.neweraventures.com/login?next=${next}`
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('app_access, status')
    .eq('id', user.id)
    .single()

  if (profile?.status !== 'active' || !profile.app_access.includes(TOOL_ID)) {
    return NextResponse.redirect('https://auth.neweraventures.com/no-access')
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|api/public).*)'],
}
```

New tool = copy this file, change `TOOL_ID`, add an entry to the `tools` table. Done.

## Admin app spec

`admin.neweraventures.com` — gated on `role === 'admin'` (middleware checks role, not just app_access).

### Page: Users (`/`)

Table of all users. Columns: name (or email), role, app_access (colored chips per tool), status, last seen, actions.

Filters: by role, by tool access, by status.

Row actions:
- **Edit** — drawer with role select + multi-select tool checkboxes (populated from `tools` table)
- **Deactivate / Reactivate** — flip `status`
- **Resend invite** — if status is `invited`, re-trigger Supabase magic link
- **Delete** — only available for unaccepted invitations

### Page: Invite (`/invite`)

Form fields: email, role (select), app_access (multi-select from `tools` table where `active = true`), optional welcome message.

On submit:
1. Insert row into `invitations` with a generated token
2. Call `supabase.auth.admin.inviteUserByEmail(email, { data: { invitation_id } })`
3. Supabase Auth + Resend deliver the magic link
4. On callback, a Postgres trigger (or callback route handler) reads the invitation, creates the `profiles` row with the granted role and app_access, marks invitation accepted

Email template (configured in Supabase → Auth → Email Templates) should be branded "New Era Ventures" and mention which tool(s) they've been granted access to.

### Page: Audit (`/audit`) — v2

Read from Supabase auth logs and a future `audit_log` table. Skip for v1.

### Page: Tools (`/tools`) — v2

UI for adding/editing entries in the `tools` table. For v1, edit the table directly in Supabase Studio when adding a new tool — happens rarely.

## Migration plan

Trivial because the LP portal has no users yet.

1. **Schema** — run the SQL migrations above on the existing Supabase project (profiles columns + invitations + tools + RLS policies).
2. **Seed admins** — manually insert profile rows for Murtaza and Carter with `role = 'admin'` and `app_access = ['lp_portal', 'sourcing', 'admin']`. Murtaza already has an `auth.users` record from the LP portal; Carter needs an invite via the admin app (chicken-and-egg: bootstrap Murtaza via SQL, then use the admin app for everyone else).
3. **Supabase Auth config** — set Site URL and Redirect URLs as specified above.
4. **DNS** — point new subdomains to Vercel.
5. **Auth app** — deploy a minimal Next.js app at `auth.neweraventures.com` with `/login`, `/callback`, `/no-access`, `/request-access` routes. ~150 lines.
6. **Admin app** — deploy minimal version at `admin.neweraventures.com`: just `/` (user list) and `/invite`. ~300 lines including UI.
7. **LP portal** — add the access middleware. One file. Confirm the existing LP portal still works with the new session model.
8. **Sourcing tool** — start fresh with the middleware pattern from day one.

Identity layer is done after step 6. Everything after that is product work.

## Carter's onboarding

Once the admin app is live:
1. Murtaza logs into `admin.neweraventures.com`, clicks "Invite"
2. Enters Carter's email, role `admin`, app_access `['lp_portal', 'sourcing', 'admin']`
3. Resend delivers magic link, branded "Welcome to NEV — Murtaza has invited you"
4. Carter clicks → lands at `auth.neweraventures.com/callback` → session is created → profile row is auto-populated from the invitation → redirected to the admin app (or wherever the invite landed him)

## Build sequence

| Day | Work |
|-----|------|
| 1   | Schema migration + RLS policies + manual profile rows for Murtaza and Carter + Supabase URL config + DNS for new subdomains |
| 1–2 | Auth app (`auth.neweraventures.com`) — login, callback, no-access pages |
| 2   | Admin app v0 — user list + invite page only. Skip polish. |
| 2   | Add access middleware to LP portal. Verify session works across subdomains. |
| 3   | Invite Carter end-to-end. Confirm flow. |
| 3+  | Start sourcing tool build using the established middleware pattern |

Identity layer is functionally complete by end of day 3.

## Open questions

- **Email branding** — do we want fully custom HTML in the Resend templates from day 1, or use Supabase's default templates with NEV name swapped in and revisit later? Recommendation: defaults for v1, custom HTML when the LP portal goes live to LPs.
- **Auth app hosting** — `auth.neweraventures.com` could be its own Vercel project or a route prefix on one of the existing apps. Recommendation: its own tiny project. Clean separation, no coupling.
- **Domain ownership** — does NEV own `neweraventures.com`? Confirm before relying on the parent-domain cookie strategy.
- **Backup admin** — if both Murtaza and Carter lose access simultaneously, Supabase service-role key (in Vercel env) can recover. Worth documenting where that key lives.

## Out of scope (deferred to later)

- Google/Microsoft OAuth — additive, no schema change required when added
- Multi-tenancy / multiple firms — premature; revisit if NEV ever spawns a second fund entity
- In-tool roles (viewer vs editor within sourcing) — handle inside the tool with its own data model
- SOC 2 audit trail — needed if/when LPs require it
- Mobile app considerations — magic links work; native deep linking is the only complication when it arrives
