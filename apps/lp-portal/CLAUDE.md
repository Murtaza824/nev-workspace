# CLAUDE.md — New Era Ventures LP Portal

This file governs how Claude Code builds the New Era Ventures LP Portal. Read it fully before doing anything. Re-read it whenever a new session starts.

---

## Project context

The LP Portal is a private, invitation-only web app where New Era Ventures' limited partners log in to view fund performance, the portfolio, and updates from the GPs. Read-only for LPs. Thin admin layer for the GPs (Murtaza, Carter). Deliberately small in scope; unusually high in design quality.

**Primary reference:** `NEV_LP_Portal_PRD.md` in the repo root. Every feature, layout, color, type size, and data field is specified there. **Do not deviate from the PRD without explicit user confirmation.** If a spec is ambiguous, ask before guessing.

---

## Stack

- Next.js 14 (App Router, TypeScript)
- Tailwind CSS with custom theme (palette in PRD §3, mobile-first per PRD §5)
- shadcn/ui for primitives
- Supabase (Postgres, Auth, Storage)
- Vercel (hosting)
- Fonts: Fraunces, Inter, JetBrains Mono (via `next/font`)
- `react-markdown` for rendering, `@uiw/react-md-editor` for admin composition

## Commands

```bash
# install
pnpm install

# dev
pnpm dev

# build + typecheck
pnpm build
pnpm typecheck

# lint
pnpm lint

# supabase (assuming Supabase CLI installed)
supabase start              # local Supabase
supabase migration new <n>  # new migration
supabase db push            # push migrations to remote
supabase db reset           # reset local DB and re-seed

# deploy
vercel --prod
```

Use **pnpm**, not npm or yarn. Commit `pnpm-lock.yaml`.

---

## Code conventions

### File structure

```
app/
  (lp)/                       # LP-facing routes, shared layout with nav
    dashboard/page.tsx
    portfolio/page.tsx
    portfolio/[slug]/page.tsx
    updates/page.tsx
    updates/[slug]/page.tsx
    account/page.tsx
    layout.tsx
  (admin)/                    # admin routes, gated by middleware
    admin/page.tsx
    admin/users/page.tsx
    admin/portfolio/page.tsx
    admin/fund/page.tsx
    admin/updates/page.tsx
    layout.tsx
  login/page.tsx
  layout.tsx                  # root layout, fonts, viewport
  globals.css
components/
  ui/                         # shared primitives (Button, Pill, Stat, Card)
  lp/                         # LP-only components (PortfolioTable, PortfolioMobileList, etc.)
  admin/                      # admin-only components
lib/
  supabase/server.ts          # server-side Supabase client
  supabase/client.ts          # client-side Supabase client
  format.ts                   # formatUSD, formatMult, formatDate
  types.ts                    # shared TS types
supabase/
  migrations/                 # SQL migrations
  seed.sql                    # seed data per PRD §12
public/
  branding/                   # NEV logo, favicon, social card
middleware.ts
tailwind.config.ts
```

### Patterns

- **Server components by default.** Use `'use client'` only when interaction requires it (forms, modals, the markdown editor, the mobile nav sheet).
- **Data fetching in server components** via the server Supabase client. No client-side fetching for initial page data.
- **No fetch waterfalls.** If a page needs three tables, kick off the queries in parallel with `Promise.all`.
- **One CSS variable definition.** Define all colors in `globals.css` as CSS variables. Reference them in Tailwind via theme extension. Never hardcode hex values in component files.
- **Format helpers everywhere.** `formatUSD(1300000)` → `"$1.30M"`. `formatMult(1.20)` → `"1.20x"`. `formatDate(date)` → `"Apr 29, 2026"`. Never inline currency or date formatting in JSX.
- **Mobile-first Tailwind.** Default styles are mobile. Use `sm:` `md:` `lg:` `xl:` to layer up.
- **Separate components for separate viewports.** The portfolio mobile card list and desktop table are two components. Don't try to make one component shapeshift.
- **Semantic HTML.** `<table>` for the desktop portfolio table. `<article>` for updates. `<nav>` for nav. Accessibility comes mostly for free if the markup is right.

### Naming

- Components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Utilities: `camelCase.ts`
- Routes: `kebab-case` in the URL, but Next.js folder names follow the URL
- Database tables and columns: `snake_case`
- TypeScript types: `PascalCase`, prefer `type` over `interface` unless extending

### Don'ts

- No `any` types. Use `unknown` and narrow.
- No inline styles. Tailwind only.
- No client-side data fetching for initial render.
- No new dependencies without justifying why a built-in or existing dep doesn't work.
- No commented-out code in commits.
- No `console.log` in committed code (use a debug flag or remove).
- No `Title Case` headings. Sentence case only.

---

## Quality bars — non-negotiable

These are the floors. A phase is not done if any of these fail.

1. **Visual fidelity.** Every screen matches PRD §3 and §6. Typography hierarchy correct. Numbers in JetBrains Mono. Pills the right palette. Whitespace generous. Sentence case throughout.
2. **Mobile perfect.** Every LP page tested at 375px, 390px, 428px, 768px, 1024px, 1280px. Hamburger nav works. Portfolio card list renders below 768px. No horizontal scroll on any LP page.
3. **Lighthouse mobile ≥ 90** on `/dashboard`, `/portfolio`, `/updates/[slug]`.
4. **RLS enforced.** A non-admin LP cannot read any other LP's profile row. Verified by the security auditor agent.
5. **Type-safe.** `pnpm typecheck` passes with zero errors. No `@ts-ignore` without an inline justification.
6. **No layout shift.** Pages don't jump after fonts or data load. Use `next/font` and reserve image dimensions.
7. **Auth flow works end-to-end** on a real email account, including the invite, password set, and first login.

---

## Orchestrator + subagent pattern

The main Claude Code session is the **orchestrator**. It plans, sequences phases, and spawns subagents. It does not write code directly except for trivial fixes.

The build is sequential by phase (Phase 1 → 5 per PRD §10). Within each phase, the **builder** subagent writes the code in a single thread. After each phase deploys, the orchestrator spawns **three reviewer subagents in parallel**, collects their reports, and either signs off or sends fixes back to the builder.

### Subagent roles

Each role is defined as a focused agent definition in `.claude/agents/`. When the orchestrator spawns a subagent, Claude Code loads that file as the agent's context — keeping each agent lean and on-task. The summaries below are an overview; the canonical role spec lives in each agent's file. **If you change an agent's behavior, edit the file in `.claude/agents/`, not the summary here.**

Files:
- `.claude/agents/builder.md`
- `.claude/agents/design-auditor.md`
- `.claude/agents/lp-simulator.md`
- `.claude/agents/security-auditor.md`
- `.claude/agents/mobile-qa.md`

#### 1. Builder

**Spawned:** at the start of each phase
**Reads:** the PRD section for the current phase, this CLAUDE.md, the current repo state
**Does:** writes code, runs migrations, fixes reviewer issues, deploys to Vercel
**Outputs:** a phase summary listing what was built, any deviations from the PRD (with justification), and a deployed URL for review

Builder rules:
- Implement exactly what the PRD specifies. If something is unclear, stop and ask the orchestrator.
- After implementing, run `pnpm typecheck`, `pnpm build`, `pnpm lint`. Fix everything before marking the phase done.
- Commit in logical chunks with descriptive messages. One feature per commit where possible.
- Push to `main` only after the phase is reviewed and approved.

#### 2. Design auditor

**Spawned:** in parallel after the builder marks a phase done
**Reads:** the PRD §3 (design language) and §6 (page specs), the deployed URL, screenshots of every screen the phase touched
**Does:** walks every screen, compares against the spec at the level of pixels and palette
**Outputs:** a list of issues categorized as `critical`, `polish`, or `nit`

Checklist:
- Typography: Fraunces for display, Inter for UI, JetBrains Mono for numbers — anywhere a number renders, confirm it's mono
- Palette: every color used is in the §3 palette, no off-spec hex values, no Tailwind default grays
- Pills: stage pills use the correct mint/peach/slate, sentence case content
- Spacing: generous whitespace, no cramped cards, vertical rhythm consistent
- Case: sentence case everywhere except the small uppercase caption labels
- Numbers: formatted per spec (`$1.30M`, `1.20x`, `Apr 29, 2026`)
- Borders: 1px hairline, no heavier strokes, no shadows except the one soft hover elevation

#### 3. LP simulator

**Spawned:** in parallel after the builder marks Phase 3 or later done
**Reads:** the test LP credentials, the deployed URL
**Does:** logs in as a fictional LP named "Sarah Chen, $250K commitment," navigates the entire LP experience on both desktop and mobile, and reports the experience as a human LP would
**Outputs:** a written walkthrough in first-person voice ("I logged in expecting to see my returns immediately, but the dashboard took 3 seconds to load and I wasn't sure if it was working..."), plus a prioritized list of UX issues

What the LP simulator pays attention to:
- Time to understanding (how fast can I see what my stake is worth?)
- Confusion points (anywhere I had to think about what something meant)
- Tone and trust signals (does this feel like a real fund or a side project?)
- Mobile gestures (anything frustrating to tap, scroll, or read on a phone)
- Empty states (what happens if there are no updates yet?)
- The "delight" question (is there anything here that makes me want to screenshot and share?)

This agent should NOT read the PRD before testing. It should approach the product fresh, the way a real LP would.

#### 4. Security auditor

**Spawned:** in parallel after the builder marks Phase 2 done, and again after Phase 4
**Reads:** the PRD §8 (auth and access control), the migration files, the deployed environment
**Does:** attempts to break RLS, audits auth flows, looks for data leakage
**Outputs:** a security review with `critical`, `high`, `medium`, `low` findings

Audit checklist:
- Create a second test LP. Verify LP1 cannot read LP2's profile row via direct Supabase query
- Verify LP cannot read any draft update
- Verify LP cannot call any admin endpoint
- Verify the invite flow does not expose existing LP emails
- Verify the password reset flow does not leak information about whether an email is registered
- Verify the magic link flow expires correctly
- Confirm RLS is enabled on every table (a table without RLS is a critical finding)
- Confirm all admin routes are gated by middleware, not just hidden in the UI
- Check that API routes do not leak Supabase service role keys

#### 5. Mobile QA

**Spawned:** in parallel after the builder marks any phase done
**Reads:** the PRD §5 (responsive behavior), the deployed URL
**Does:** opens Chrome DevTools and tests at six viewport widths, runs Lighthouse on mobile preset, manually verifies key responsive behaviors
**Outputs:** screenshots at each width, a Lighthouse report, and a list of mobile-specific issues

Test matrix:
- 375px (iPhone SE / 13 mini)
- 390px (iPhone 14 / 15)
- 428px (iPhone 15 Pro Max)
- 768px (iPad portrait)
- 1024px (iPad landscape / small laptop)
- 1280px (desktop)

Per width, verify:
- No horizontal scroll on the page body
- Nav: hamburger below 768px, full nav at 768px+
- Dashboard stat rows: 1-up below 768px (personal), 2-up below 768px (fund)
- Portfolio: card list below 768px, table above
- Touch targets ≥ 44×44px
- Tappable cards have an `:active` state

### Spawning pattern

After the builder reports a phase done, the orchestrator spawns the appropriate reviewers in parallel:

```
Phase 1 done → design auditor, mobile QA
Phase 2 done → design auditor, mobile QA, security auditor
Phase 3 done → design auditor, mobile QA, LP simulator
Phase 4 done → design auditor, mobile QA, security auditor
Phase 5 done → all four reviewers (design, mobile, LP simulator, security)
```

The orchestrator waits for all reviewers to report, consolidates findings, and either signs off or hands a fix list to the builder. The builder fixes, redeploys, and the orchestrator either re-runs reviewers (for critical issues) or signs off (for polish/nit).

---

## Phase workflow (canonical)

1. Orchestrator reads the PRD section for the next phase
2. Orchestrator spawns the builder with that section as the brief
3. Builder implements, deploys, reports done
4. Orchestrator spawns appropriate reviewers in parallel
5. Reviewers report
6. Orchestrator consolidates and decides: ship, or send fixes back
7. If fixes: builder fixes, redeploys, loop back to step 4 (re-run only relevant reviewers)
8. If ship: mark phase complete, move to next phase

Do not start the next phase until the current one is signed off.

---

## Definition of done — per phase

A phase is done when:
- All deliverables in PRD §10 for that phase are implemented
- `pnpm typecheck`, `pnpm build`, `pnpm lint` all pass
- Deployed to Vercel preview (Phases 1-4) or production (Phase 5)
- All reviewer findings at `critical` or `high` severity are resolved
- Findings at `medium` or below are documented in a `TODO.md` for later
- The user (Murtaza) has reviewed the deployed URL and approved

---

## Common pitfalls — read this twice

- **Don't use Tailwind's default colors.** No `text-gray-500`. Use the custom palette tokens (`text-ink-secondary`, `bg-canvas`, etc.).
- **Don't use Tailwind's default font sizes for display/headings.** Use the custom type scale from PRD §3.
- **Don't forget mobile.** Every component must work below 768px. The PRD §5 spec is binding, not aspirational.
- **Don't put numbers in Inter.** Currency, percentages, multiples, dates — all JetBrains Mono. No exceptions.
- **Don't write the portfolio table to also work on mobile.** Two separate components, conditional render.
- **Don't skip RLS.** Every table gets RLS. Default deny. Then explicit policies.
- **Don't trust the client.** Admin checks happen in middleware and in RLS, not just in the UI.
- **Don't commit `.env.local`.** Supabase keys, Resend keys, anything secret stays out of git.
- **Don't deploy without `pnpm build` passing locally first.**

---

## Confirmed decisions

- **Domain:** `lp.neweraventures.com`. Configure as a Vercel custom domain. The Supabase auth redirect URLs must be updated to match before Phase 2 deploys.
- **Logo:** the NEV wordmark has been provided and vectorized. It is a custom geometric display face — stacked "NEW ERA / VENTURES" wordmark with rounded letter terminals and broken segments, native treatment white-on-black.

  Files in `public/branding/`:
  - `nev-logo.svg` — production SVG, tightened viewBox (`456 52 1016 296`, aspect ratio ~3.43:1), fill set to `currentColor` so CSS can theme it
  - `logo.png` — original PNG, kept as a reference for the source artwork

  Treatment rules:
  - **Default in-app rendering:** dark ink (`--ink-primary`, #1A1F2C) on the cream canvas. Used in the top nav, login screen, and anywhere the wordmark appears in the product. Because the SVG uses `currentColor`, simply setting `color: var(--ink-primary)` on the `<Logo>` component renders it correctly.
  - **Native white-on-black treatment:** reserved for the favicon, PDF letterhead, social/OG cards, and email signature blocks. Set `color: white` and place on a dark surface.
  - **Size in nav:** target 36-40px height for the stacked lockup. At a 3.43:1 aspect ratio, that's roughly 120-140px wide — sits comfortably in the nav.
  - **Favicon:** placeholder is a black 32×32 square with a white "N" extracted from the wordmark. Build `app/icon.tsx` (Next.js metadata route) to generate it dynamically, or place a static `favicon.ico` in `app/`. Real favicon variants (180px apple-touch-icon, OG card) can be derived from the SVG.
  - **The `<Logo>` component** lives at `components/ui/Logo.tsx` and inlines the SVG (do not use `<img src>` — inlining lets the fill inherit color and avoids an extra HTTP request). Takes a `className` prop for sizing and color overrides.

  ```tsx
  // components/ui/Logo.tsx — sketch
  export function Logo({ className = "h-9 w-auto text-ink-primary" }: { className?: string }) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="456 52 1016 296"
           role="img" aria-label="New Era Ventures" fill="currentColor"
           className={className}>
        <title>New Era Ventures</title>
        {/* paste contents of nev-logo.svg <g>...</g> here */}
      </svg>
    );
  }
  ```

  Note: this SVG was vectorized from the source PNG via potrace. The trace is clean and identical to the original at every size tested down to 96px wide, but if the designer ever provides a true source SVG, swap `nev-logo.svg` for that — it's a one-file change.
- **Empty states:** LPs are only invited after they have committed and wired capital. The `commitment_amount` field will always be populated by the time a user can log in. Do not design or build a "no commitment yet" empty state on the dashboard. If admin somehow invites an LP without setting a commitment, the dashboard can show a generic "Your account is being set up — contact ir@neweraventures.com" fallback, but this is not a polished state.
- **LP roster:** do not bulk-import LP emails into a seed file. New LPs are invited one at a time via `/admin/users` once Phase 4 ships. If a bulk import is ever needed, write a one-off script that reads from a gitignored local CSV; do not commit LP PII to the repo.
- **Fund capital (Fund I):**
  - Total committed: `$2,107,500.00`
  - Total called: `$1,369,875.00` (65% of committed)
  - Total deployed: `$1,311,798.17`
  - Total current value: `$1,563,400.00` (sum of NEV-share current values across the 11 portfolio companies per PRD §12)
  - Use these exact values to seed the `fund` table in Phase 2.

## Deferred items (provided later in the build, not blockers for Phase 1)

- **Sender email** for invitations. Likely `ir@neweraventures.com`. Murtaza will set up deliverability (Resend recommended) before Phase 2 testing requires real auth emails to send. Until then, Supabase's default auth email is fine for development.
- **Test LP account.** Murtaza will provide a real-LP-style test account (email + commitment amount) toward the end of the build, before the LP simulator agent's first run in Phase 3 or 5. For development before that, the builder creates a fake test LP (`test-lp@example.com`, commitment `$250,000`) and uses it for local QA.

## Items still to decide before Phase 5

- **PDF letterhead template** — needed for the eventual PDF-export workflow on updates. Can be deferred until Phase 5.
- **Analytics** — Plausible, PostHog, or none for v1. Can be deferred until Phase 5.
- **Error tracking** — Sentry or none for v1. Can be deferred until Phase 5.

Phase 1 can begin immediately; none of the deferred items block it.

---

End of CLAUDE.md.
