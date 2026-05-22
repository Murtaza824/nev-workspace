# New Era Ventures — LP Portal

## Product requirements document

**Owner:** Murtaza, Managing Partner
**Status:** Ready for build
**Build target:** Claude Code, Next.js + Supabase + Vercel

---

## 1. Vision

A read-only portal where New Era Ventures' limited partners log in to see how Fund I is performing, what's in the portfolio, and read founder-style updates from the GPs. The product is deliberately small in scope and unusually high in design quality. LPs should open it on their phone in the back of an Uber, see how their stake is doing in five seconds, and feel that NEV is the most considered, polished fund they're in.

The experience reads like a private Substack with a fund dashboard glued to the front. Editorial typography, monospace numbers, warm cream surfaces, generous whitespace.

### Goals

- A two-screen LP experience: dashboard + portfolio + updates feed
- Per-LP personalization on the dashboard (their commitment, their current value)
- A thin admin layer to manage data and access
- Look so good LPs forward screenshots to their friends
- Equally polished on phone and desktop

### Non-goals (do not build)

- A native mobile app — this is a responsive web app, accessed via mobile browser
- Capital calls, distributions, K-1s, wire instructions
- LP transactions of any kind
- Per-deal LP allocations
- Document vault for tax/legal docs
- Multi-fund support (Fund I only)
- Tiered LP visibility

---

## 2. Users

**Limited Partner (LP)**
Has a login. Sees fund-level performance, their personal pro-rata slice, the portfolio, and updates. Cannot edit anything. Will primarily check the portal on a phone.

**Admin (Murtaza, Carter)**
Has a login. Sees everything an LP sees, plus admin pages to manage users, portfolio companies, fund metrics, and updates. Works mostly from desktop.

---

## 3. Design language

Reference points: `neweraventures.com` plus NEV's existing internal portfolio dashboard (warm cream background, monospaced data, soft pastel category pills, forest-green markup color). The portal should feel like the natural LP-facing extension of that visual world.

### Palette

```
--bg-canvas        #FAF7F0   warm cream, full-page background
--bg-surface       #FFFFFF   cards, table rows
--bg-surface-warm  #F4F0E5   alternating rows, subtle surface
--ink-primary      #1A1F2C   body and headings
--ink-secondary    #6B6F76   labels, captions, muted data
--ink-tertiary     #A8A39A   timestamps, hairline UI
--accent-positive  #0F6E56   markup multiples, gains
--accent-negative  #993C1D   markdowns (rare, but reserve)
--border-hairline  #E5E0D5   table dividers, card borders
--pill-mint-bg     #DFF1E5   Pre-Seed
--pill-mint-ink    #1D5B3F
--pill-peach-bg    #F8E6D5   First Check
--pill-peach-ink   #8B4A1F
--pill-slate-bg    #E1E5EB   Seed
--pill-slate-ink   #3A4554
```

Dark mode is out of scope for v1.

### Typography

- **Display & long-form headings:** a refined serif. Use `Fraunces` (Google Fonts, free) at weights 400 and 500. This carries the editorial feel.
- **UI & body:** `Inter` (Google Fonts) at 400 and 500.
- **Numbers, tickers, money:** `JetBrains Mono` (Google Fonts) at 400. All currency, percentages, multiples, dates, and tabular data render in mono. This is the design signature — do not violate it.

### Scale (desktop / mobile)

```
                    desktop   mobile
display-1           48px      32px      Fraunces 500    hero numbers, login
display-2           36px      28px      Fraunces 500    page titles
heading             22px      20px      Fraunces 500    section heads, article titles
body-lg             18px      17px      Inter 400       article body
body                15px      15px      Inter 400       UI default
caption             13px      13px      Inter 400       labels, uppercase, 0.08em tracking
mono-lg             32px      26px      JetBrains 400   hero stats
mono-md             18px      16px      JetBrains 400   table cells, inline data
mono-sm             14px      13px      JetBrains 400   timestamps, secondary data
```

Body line-heights: display 1.1, headings 1.3, body 1.6 desktop / 1.65 mobile (slightly looser on small screens for readability).

### Surfaces and motion

- Hairline borders only (`1px solid var(--border-hairline)`)
- No shadows except a single soft elevation on hover for tappable cards (`0 1px 2px rgba(26,31,44,0.04)`)
- Corner radius: 6px on inputs and pills, 10px on cards, 14px on modal sheets
- All transitions 200ms ease-out. No spring animations, no bounce.
- Page transitions: subtle fade-up of 8px on mount

### Tone

- Sentence case everywhere except the small uppercase caption labels in tables
- Numbers always formatted: `$1.30M`, `1.20x`, `0.44%`, `Apr 29, 2026`
- Negative space is the design. Resist filling cards. If a screen looks empty, it's right.

---

## 4. Information architecture

```
/                        → redirect to /dashboard if authed, else /login
/login                   → email + password, plus magic link option
/dashboard               → LP home (fund snapshot + personal slice + latest update card)
/portfolio               → all 11 companies, sortable table + cost-vs-value bars
/portfolio/[slug]        → single company detail
/updates                 → list of published updates, newest first
/updates/[slug]          → single update, reads like an essay
/account                 → email, password change, sign out

/admin                   → admin home, links to four sections
/admin/users             → invite LPs, set commitments
/admin/portfolio         → CRUD portfolio companies, log valuation events
/admin/fund              → fund-level metrics (committed, deployed, NAV)
/admin/updates           → compose, edit, publish updates
```

Navigation: a single top bar. Left: NEV wordmark. Center: `Dashboard · Portfolio · Updates`. Right: avatar dropdown (Account, Sign out, and Admin link if role is admin). On mobile, see §5.

---

## 5. Responsive behavior

Mobile is a first-class target. Every LP page must work beautifully in a phone's browser — Safari on iPhone, Chrome on Android. Admin pages are desktop-first and merely need to remain usable on mobile (no broken layouts, no horizontal scroll on the page body), but admin polish is not a v1 priority.

### Breakpoints

```
default   <640px     mobile portrait (iPhone SE through Pro Max)
sm        ≥640px     mobile landscape, small tablets
md        ≥768px     tablets
lg        ≥1024px    small laptops
xl        ≥1280px    desktop default
```

Build mobile-first. Default Tailwind styles target the smallest viewport. Layer up with `sm:`, `md:`, `lg:` prefixes.

### Per-page mobile behavior

**Top navigation**
On mobile, the wordmark stays top-left. The center nav (`Dashboard · Portfolio · Updates`) collapses behind a single hamburger icon top-right. Tap opens a full-width sheet that slides down from the top with the three nav items + avatar dropdown contents. Tap anywhere outside or any item to dismiss. Navigation height shrinks from 64px desktop to 56px mobile.

**Login**
Card sits 20px from each edge on mobile rather than a fixed 380px. Input heights 48px for thumb-friendly tapping. Submit button height 52px.

**Dashboard**
- Personal slice (`YOUR POSITION · FUND I`): 3-up stat row collapses to a single vertical stack on mobile. Each stat keeps its caption + number but scales to mono-lg mobile size (26px).
- Fund snapshot (`NEV FUND I`): 4-up stat row collapses to a 2-up grid on mobile. Same number scaling.
- Latest update teaser card: stays full-width, no structural change. Article title shrinks from heading 22px to 20px.
- Vertical spacing between the three blocks reduces from 64px desktop to 40px mobile.

**Portfolio — the critical one**
The 10-column table does not work on mobile. Below the `md` breakpoint (768px), swap the table entirely for a vertical card list. Each card shows:
- Top row: company name (Inter 500, 17px) + stage pill, right-aligned
- Middle row: check size and current multiple, both mono-md. Multiple in accent-positive when >1.00.
- Bottom row: date + ownership %, both mono-sm secondary ink
- Card padding 16px, hairline border, 10px radius, vertical gap between cards 12px
- Tap anywhere on the card to route to `/portfolio/[slug]`
- A small "Sort by" dropdown above the list (default: most recent, options: largest position, highest multiple) — replaces the desktop column-header sort

The cost-vs-value bar component below the table/list stays exactly as designed. It already scales to any width: company name 100px fixed left column, bar fills the remaining width minus a 60px right column for the multiple readout.

**Portfolio company detail**
Article column shifts from max-width 720px centered to full-width with 20px side padding. Stat strip collapses from 4-up to 2-up grid. Logo shrinks from 64px to 56px. Everything else flows naturally.

**Updates index**
Already a vertical list — works at any width. Title scales display-2 → 28px mobile. Card title scales from 28px to 22px mobile. Excerpt remains 2 lines, truncated.

**Update detail**
Article column shifts from max-width 680px to full-width with 20px side padding. Title scales from display-1 48px to 32px mobile. Subtitle from heading 22px to 18px. Body stays at 17px on mobile — readability matters more than fitting more on screen. Paragraph spacing tightens from 1.5em to 1.25em on mobile. PDF download button becomes full-width on mobile.

**Account**
Two cards stack naturally on any width. No structural change.

**Admin pages**
Functional only on mobile. Tables get a horizontal scroll wrapper (`overflow-x-auto` with a sticky first column where useful). Sheets and dialogs become full-screen on mobile rather than centered modals. Don't spend polish time here.

### Touch targets

- All tappable elements minimum 44px × 44px (Apple HIG floor)
- Form inputs: 40px desktop → 48px mobile
- Buttons: 40px desktop → 48px mobile
- Table row cards on mobile: full card is tappable, with `:active` state shifting background to `--bg-surface-warm`
- Spacing between adjacent tap targets: minimum 8px

### Performance

- Use `next/image` for company logos with explicit width/height and `priority` only on logos visible above the fold
- Defer the markdown editor (`@uiw/react-md-editor`) — admin-only and heavy
- Self-host fonts via `next/font` with `display: swap`
- Test that Lighthouse mobile performance score stays above 90

### Viewport meta

In `app/layout.tsx`:

```tsx
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#FAF7F0',
};
```

Do not disable user-zoom.

---

## 6. Pages — detailed spec

### 6.1 Login (`/login`)

Full-bleed cream background. Centered card, 380px wide desktop / 20px-edge-margin mobile.
- NEV wordmark, serif, 32px, centered
- Subhead in Inter 15px secondary ink: "Limited Partner Portal"
- Email field
- Password field
- Primary button: "Sign in"
- Secondary link: "Email me a magic link instead"
- Footer microcopy: "Access by invitation only. Contact ir@neweraventures.com."

### 6.2 Dashboard (`/dashboard`)

The single most important screen. Three vertical blocks separated by generous whitespace.

**Block 1 — Personal slice (the LP's data)**
- Eyebrow caption: `YOUR POSITION · FUND I`
- Three-up stat row desktop / 1-up stack mobile (mono-lg numbers, caption labels above each):
  - Your commitment — `$250,000`, with a secondary line in mono-sm secondary ink directly beneath: `$162,500 called (65%)` — computed as `commitment × (fund.total_called / fund.total_committed)`
  - Current value — `$185,067` (computed: `commitment × (fund.total_current_value / fund.total_committed)`, see §7)
  - Multiple — `1.20x` (the fund's Gross MOIC: `total_current_value / total_deployed`. In accent-positive when ≥1.00, accent-negative when <0.95)
- Microcopy below the row in Inter 13px secondary ink: `As of May 14, 2026 · Net of fees and carry not yet applied`

**Block 2 — Fund snapshot**
- Eyebrow caption: `NEV FUND I`
- Stat row, desktop 4-up / mobile 2-up. Match the internal dashboard screenshot but add the called row:
  - Investments — `11`
  - Capital committed — `$2.11M`
  - Capital called — `$1.37M` with secondary line `65% of committed` in mono-sm secondary ink
  - Capital deployed — `$1.31M`
  - Current value — `$1.56M`
  - Gross MOIC — `1.20x` (accent-positive)
- Six stats total. Desktop: 3 across × 2 rows. Mobile: 2 across × 3 rows.

**Block 3 — Latest update teaser**
- Eyebrow caption: `LATEST FROM THE GP`
- Article title in Fraunces 22px (20px mobile)
- Date in mono-sm secondary
- Two-line excerpt in Inter 15px
- "Continue reading →" link in accent-positive
- Card has a hairline border and 10px radius. Full card is tappable.

### 6.3 Portfolio (`/portfolio`)

Two stacked components. Desktop and mobile diverge significantly on Component A.

**Component A — Desktop table (≥ md)**
Columns: Company, Stage, Date, Check, Entry val, Own %, Current val, Mult, Pro rata, Co-investors

- Company cell: name in Inter 500 plus a small external link arrow icon if the company has a website. Clicking the name routes to `/portfolio/[slug]`.
- Stage cell: pastel pill per the palette (Pre-Seed → mint, First Check → peach, Seed → slate)
- All numeric cells: JetBrains Mono, right-aligned within the cell
- Mult cell: accent-positive when >1.00, default ink when 1.00
- Pro rata cell: "Yes" → mint pill, "No" → slate pill
- Co-investors: Inter 13px secondary, truncate at 2 lines with `...`
- Row hover: background shifts to `--bg-surface-warm`
- Sticky header on scroll
- Footer row: "Totals" with summed Check and weighted Mult

**Component A — Mobile card list (< md)**
Per §5 spec. Vertical card list, three rows per card: name + stage / check + multiple / date + ownership. Sort dropdown above.

**Component B — Cost vs. current value bars (both viewports)**
Mirror the third screenshot:
- Header: "Cost vs. current value" in Fraunces 22px (20px mobile)
- Caption in Inter 13px secondary: "Each row: capital invested, then current carrying value. Markups extend past the cost line."
- One row per company, sorted by multiple descending
- Bar visualization: gray segment = cost basis, green segment = markup delta past cost
- Multiple shown to the right in mono-md, accent-positive
- Bar widths scaled to the largest company's current value
- Mobile: company label column 80px, multiple column 50px, bar fills remaining width

### 6.4 Portfolio company detail (`/portfolio/[slug]`)

Full-width article-style layout, max-width 720px centered desktop / 20px side padding mobile.

- Back link top-left: `← Portfolio`
- Company logo (64px desktop / 56px mobile, rounded 8px) above name
- Company name in display-2 (36px desktop / 28px mobile)
- One-line description (admin-entered) in body-lg secondary
- Stage pill + sector tag + website link (with arrow icon)
- Hairline divider
- Stat strip: 4-up desktop / 2-up mobile — Check size, Entry valuation, Ownership %, Current multiple
- Hairline divider
- Section: "Thesis" — heading + body-lg (admin-entered rich text)
- Section: "Valuation history" — table of valuation events. On mobile, swap for stacked rows (date + multiple on top line, note below)
- Section: "Co-investors" — pill-style list, wraps naturally

### 6.5 Updates index (`/updates`)

Feels like a Substack archive. No table. Vertical list of update cards.

- Page title: "Updates" in display-2
- Subhead: "Letters and notes from the New Era Ventures team." Inter 18px secondary (17px mobile)
- Each card:
  - Date in mono-sm secondary, uppercase
  - Title in Fraunces 28px desktop / 22px mobile
  - Two-line excerpt in Inter 16px (15px mobile)
  - Author byline: small avatar + name in Inter 13px
  - Only a bottom hairline border — no full card outline. List feels like a magazine table of contents.
- Updates sorted by published date descending

### 6.6 Update detail (`/updates/[slug]`)

The "Substack article" experience. Max-width 680px centered desktop / 20px side padding mobile.

- Back link: `← Updates`
- Eyebrow: date in mono-sm secondary, uppercase
- Title in display-1 (48px desktop / 32px mobile)
- Subtitle (optional, admin-entered) in heading secondary ink, italic
- Author byline: avatar 32px + name in Inter 15px + reading time
- Hairline divider
- Article body rendered from markdown:
  - Paragraphs: body-lg, line-height 1.75 desktop / 1.65 mobile
  - H2: Fraunces 28px (24px mobile), margin-top 2em
  - H3: Fraunces 22px (20px mobile)
  - Blockquotes: 4px accent-positive left border, italic Fraunces 20px (18px mobile)
  - Inline code: JetBrains Mono 16px (15px mobile) with subtle warm-gray background
  - Images: full-width, rounded 8px, optional caption in Inter 13px secondary centered below
- Bottom of article: "Download PDF version" button. Full-width on mobile, inline-sized on desktop.
- Footer: "← Back to updates"

### 6.7 Account (`/account`)

Minimal. Two cards stacked.
- Profile card: name, email (read-only), commitment amount (read-only, set by admin)
- Security card: change password, sign out
- No avatars to upload, no notification preferences in v1

### 6.8 Admin pages

Behind `role === 'admin'` check. Use the same design language but with denser, more functional layouts. Desktop-first.

**`/admin/users`** — table of all LPs. Columns: name, email, commitment amount, joined, status (active / pending invite). Primary action: "Invite LP" button opens a sheet (full-screen on mobile) with email + name + commitment amount fields. Submitting sends a Supabase Auth invite email.

**`/admin/portfolio`** — table of all companies with an "Add company" button. Each row links to an edit page with all fields from the data model. Separate "Log valuation event" action per company that appends to that company's valuation_events table.

**`/admin/fund`** — single form: fund name, vintage, total committed (the fund's total commitments from all LPs), total deployed (auto-summed from investments), total current value (auto-summed from latest valuations), last-updated date. Auto-summed fields are read-only displays; manual override toggle available.

**`/admin/updates`** — list of all updates (draft + published) with status badges. "New update" button opens a markdown editor (`@uiw/react-md-editor`) with title, subtitle, body, optional PDF upload, optional related-company tag. Save as draft or publish.

---

## 7. Data model

Postgres on Supabase. All tables have `id uuid primary key default gen_random_uuid()`, `created_at timestamptz default now()`, `updated_at timestamptz default now()`.

### `profiles`
Extends `auth.users` via FK on `id`.
- `id` uuid PK FK auth.users
- `full_name` text
- `email` text
- `role` text check in ('lp', 'admin') default 'lp'
- `commitment_amount` numeric — set by admin, null until set
- `committed_at` date

### `fund`
Singleton row.
- `id` uuid PK
- `name` text default 'NEV Fund I'
- `vintage` integer default 2025
- `total_committed` numeric — sum of all LP commitments
- `total_called` numeric — capital actually called from LPs to date (called may exceed deployed by reserves and fees)
- `total_deployed` numeric — capital actually invested into portfolio companies; auto-summed from `portfolio_companies.check_size`
- `total_current_value` numeric — sum of latest NEV-share valuations; auto-summed from `portfolio_companies.current_valuation` (which is denormalized from latest valuation_event.new_position_value)
- `as_of_date` date
- `last_updated` timestamptz

### `portfolio_companies`
- `id` uuid PK
- `slug` text unique
- `name` text
- `logo_url` text
- `one_liner` text
- `sector` text
- `website` text
- `stage` text check in ('Pre-Seed', 'First Check', 'Seed', 'Series A')
- `status` text check in ('active', 'exited', 'written_off') default 'active'
- `thesis` text — markdown
- `invested_date` date
- `check_size` numeric
- `entry_valuation` numeric
- `ownership_pct` numeric
- `pro_rata_rights` boolean default false
- `current_valuation` numeric — denormalized from latest valuation_event for fast reads
- `current_multiple` numeric — denormalized

### `valuation_events`
- `id` uuid PK
- `company_id` uuid FK portfolio_companies
- `event_date` date
- `event_type` text check in ('markup', 'markdown', 'exit', 'writedown', 'initial')
- `new_company_valuation` numeric — post-money valuation of the company
- `new_position_value` numeric — NEV's stake value
- `multiple` numeric
- `note` text

### `co_investors`
- `id` uuid PK
- `company_id` uuid FK portfolio_companies
- `name` text
- `order` integer — for display ordering

### `updates`
- `id` uuid PK
- `slug` text unique
- `title` text
- `subtitle` text nullable
- `body_md` text — markdown source
- `excerpt` text — auto-generated from first 200 chars of body
- `author_id` uuid FK profiles
- `related_company_id` uuid FK portfolio_companies nullable
- `pdf_url` text nullable — Supabase Storage path
- `status` text check in ('draft', 'published') default 'draft'
- `published_at` timestamptz nullable

### Computed values (application layer or Postgres views)

- **Fund Gross MOIC** = `total_current_value / total_deployed`
- **Fund call rate** = `total_called / total_committed`
- **LP called amount** = `commitment_amount × (total_called / total_committed)` — what's been pulled from this LP's account to date
- **LP current value** = `commitment_amount × (total_current_value / total_committed)` — this LP's pro-rata share of fund NAV
- **LP multiple** = same as fund Gross MOIC (since pro-rata, all LPs share the fund's overall multiple)

Display rule: numbers are stored at full precision in the database but rounded for display per the formatters in §11 (e.g., `$1,311,798.17` displays as `$1.31M`). Never display partial-cent precision.

---

## 8. Auth and access control

### Auth setup

- Supabase Auth with email + password and magic link both enabled
- Invitation-only — disable public sign-ups in Supabase dashboard
- Admin creates new LPs via `/admin/users` which calls `supabase.auth.admin.inviteUserByEmail()` server-side
- Invited LPs receive an email, set their password, land on `/dashboard`

### Row-level security policies

Enable RLS on every table. Default deny.

```sql
-- profiles: users can read their own row; admins can read all
create policy "lp reads own profile" on profiles for select
  using (auth.uid() = id);
create policy "admin reads all profiles" on profiles for select
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "admin writes profiles" on profiles for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- fund, portfolio_companies, valuation_events, co_investors:
-- readable by any authenticated user; writable by admins only
create policy "authed reads portfolio" on portfolio_companies for select
  using (auth.role() = 'authenticated');
create policy "admin writes portfolio" on portfolio_companies for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- updates: LPs see only published; admins see all
create policy "lp reads published updates" on updates for select
  using (status = 'published' or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
```

Repeat the admin-write / authed-read pattern for `fund`, `valuation_events`, `co_investors`.

---

## 9. Tech stack

- **Framework:** Next.js 14, App Router, TypeScript
- **Styling:** Tailwind CSS with custom theme matching §3 palette and type scale, mobile-first per §5
- **UI primitives:** shadcn/ui for tables, forms, dropdowns, sheets, dialogs
- **Database & auth:** Supabase (Postgres, Auth, Storage)
- **Markdown:** `react-markdown` for rendering, `@uiw/react-md-editor` for admin composition
- **Email:** Supabase's built-in email for auth flows. No transactional email beyond auth in v1.
- **Charts:** none needed in v1 — the cost-vs-value bars are pure CSS divs with width percentages
- **Hosting:** Vercel
- **Fonts:** self-host via `next/font` for Fraunces, Inter, JetBrains Mono

---

## 10. Build plan

Five phases. Don't skip ahead — each phase should be deployable and reviewable.

### Phase 1 — Foundation (half a day)

- `create-next-app` with TypeScript, Tailwind, App Router
- Set up Supabase project, get URL + anon key into `.env.local`
- Configure `next/font` for the three font families
- Build the Tailwind theme matching §3 (colors, fonts, sizes, radii) and §5 breakpoints
- Set the viewport meta per §5
- Create the root layout with the responsive top nav shell (mobile hamburger + desktop center nav, no auth wiring yet)
- Add the LP / admin route groups: `(lp)` and `(admin)`
- Deploy to Vercel as a milestone — verify the nav works on a real phone

### Phase 2 — Auth and data model (half a day)

- Run all SQL migrations to create tables in §7
- Enable RLS and apply all policies in §8
- Build `/login` page wired to Supabase Auth (test on phone — keyboards, autofill, tap targets)
- Build middleware that redirects unauthed users to `/login`
- Build the `profiles` trigger that auto-creates a profile row on signup
- Seed the database with the 11 portfolio companies from §12 and one fake LP user for testing

### Phase 3 — LP read experience (one full day)

- Build `/dashboard` with all three blocks pulling real data (desktop 3-up/4-up, mobile 1-up/2-up)
- Build `/portfolio` with desktop table and mobile card list as parallel components selected by viewport
- Build `/portfolio/[slug]` detail page (responsive)
- Build `/updates` list and `/updates/[slug]` reader (article column scales per §5)
- Build `/account` minimal page
- Pixel-polish typography, spacing, hover states across all LP pages, both viewports

### Phase 4 — Admin (half a day)

- Build `/admin/users` with invite flow
- Build `/admin/portfolio` CRUD and valuation event logging
- Build `/admin/fund` form
- Build `/admin/updates` with markdown editor and PDF upload to Supabase Storage

### Phase 5 — Polish (half a day)

- **Mobile QA pass on real devices.** Test at 375px (iPhone SE / 13 mini), 390px (iPhone 14/15), 428px (iPhone Pro Max), 768px (iPad portrait), 1024px (iPad landscape / small laptop), 1280px+ (desktop). Use Chrome DevTools device emulation as a first pass, then test on a real iPhone in Safari and a real Android in Chrome before shipping.
- Verify hamburger nav, portfolio card list, dashboard stat stacking, article column padding on every page
- Loading skeletons for every async region
- Empty states (no updates yet, no portfolio yet — though seed data prevents this)
- Favicon + meta tags + theme color
- Test the invite flow end-to-end with a real email
- Lighthouse mobile score ≥ 90 on `/dashboard`, `/portfolio`, `/updates/[slug]`

---

## 11. Notes for Claude Code

- Create the project at the user's preferred directory
- Use `app/` directory, not `pages/`
- Prefer server components for data fetching, client components only where interaction requires it
- All Supabase queries go through `lib/supabase/server.ts` and `lib/supabase/client.ts` helpers
- Co-locate component files with their pages where they're only used once; put shared primitives in `components/ui/` and `components/lp/` and `components/admin/`
- Use `next/font/google` for Fraunces, Inter, and JetBrains Mono
- Currency formatting helper: `formatUSD(n)` that returns `$1.30M`, `$250K`, `$1,250` depending on magnitude
- Multiple formatting helper: `formatMult(n)` that returns `1.20x` with two decimals
- Date formatting helper: `formatDate(d)` that returns `Apr 29, 2026`
- The cost-vs-value bar component takes `cost`, `currentValue`, and the fund's max-current-value, and renders two stacked divs with computed width percentages. Cost segment is `var(--ink-secondary)` at 40% opacity, markup delta segment is `var(--accent-positive)`.
- The portfolio mobile card and desktop table should be separate components rendered conditionally — don't try to make one component do both jobs. They share data, not markup.
- Tailwind config: define `--bg-canvas`, `--ink-primary`, etc. as CSS variables in `globals.css`, then reference them as `bg-canvas`, `text-ink`, etc. via the Tailwind theme extension. This keeps utility classes readable.
- When in doubt about visual choices, lean toward less. Whitespace wins.

---

## 12. Seed data (from the existing internal dashboard)

Pre-populate `portfolio_companies` with these 11 records when standing up the dev environment.

| Name | Stage | Date | Check | Entry val | Own % | Current val | Mult | Pro rata |
|---|---|---|---|---|---|---|---|---|
| Engram | Pre-Seed | 2026-04-29 | 200000 | 45000000 | 0.44 | 75000000 | 1.67 | No |
| Olive | First Check | 2026-04-27 | 110000 | 13000000 | 0.85 | 20000000 | 1.54 | Yes |
| Apollo Atomics | Pre-Seed | 2026-02-11 | 175000 | 20000000 | 0.88 | 20000000 | 1.00 | Yes |
| SubHub | First Check | 2026-01-25 | 150000 | 22500000 | 0.67 | 22500000 | 1.00 | Yes |
| Goblins | Seed | 2025-11-20 | 70000 | 18000000 | 0.39 | 18000000 | 1.00 | No |
| Terac | Seed | 2025-11-17 | 100000 | 30000000 | 0.33 | 30000000 | 1.00 | No |
| CRABI Robotics | Seed | 2025-09-26 | 100000 | 20000000 | 0.50 | 20000000 | 1.00 | No |
| ChatARV | First Check | 2025-09-20 | 20000 | 2000000 | 1.00 | 3000000 | 1.50 | Yes |
| Silares | Seed | 2025-07-21 | 175000 | 25000000 | 0.70 | 30000000 | 1.20 | Yes |
| Sylvan Labs | First Check | 2025-06-06 | 100000 | 15000000 | 0.67 | 15000000 | 1.00 | No |
| applied37 | First Check | 2025-04-07 | 100000 | 40000000 | 0.25 | 50000000 | 1.25 | No |

Fund seed (use these exact values when standing up the dev environment):

```
name:                  NEV Fund I
vintage:               2025
total_committed:       2107500.00
total_called:          1369875.00     -- 65% of committed
total_deployed:        1311798.17     -- precise; displays as $1.31M
total_current_value:   1563400.00     -- sum of NEV-share current values from the 11 companies
as_of_date:            (most recent valuation event date)
```

Sanity-check math:
- `total_called / total_committed` = 0.6500 (65.00%)
- `total_current_value / total_deployed` = 1.1918... (displays as `1.19x`; the internal dashboard rounds to `1.20x` — either is acceptable but be consistent)
- Reserve held back (called but not deployed): `1,369,875 - 1,311,798.17 = $58,076.83`

Co-investor lists from the screenshot should be entered per company in the `co_investors` table.

---

End of PRD.
