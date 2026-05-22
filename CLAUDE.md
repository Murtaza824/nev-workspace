# CLAUDE.md — NEV workspace

This file is your operating manual for the NEV workspace monorepo. Read it before doing anything else. If anything in this document conflicts with a user request, ask for clarification rather than guessing.

## What this codebase is

The NEV workspace is a Turborepo monorepo housing all of New Era Ventures' internal tools. Four apps share one Supabase project, one identity layer, and one design system. The two human operators are **Murtaza** (managing partner, builder, the user who initiates most sessions) and **Carter** (co-managing partner, joining the workspace shortly).

Current apps:

- `apps/auth` — login, callback, no-access. Single source of truth for authentication. Served at `auth.neweraventures.com`.
- `apps/admin` — user management, invitations, role assignment. Admin-only. Served at `admin.neweraventures.com`.
- `apps/lp-portal` — existing LP-facing portal. Will be retrofit to use the shared identity layer. Served at `lp.neweraventures.com`.
- `apps/sourcing` — NEV Signal, the deal sourcing tool. The primary build target right now. Served at `sourcing.neweraventures.com`.

All apps share session cookies via the `.neweraventures.com` parent domain.

## Read first, every session

Before starting any work, read the two foundational docs in this order:

1. `docs/nev-identity-layer-architecture.md` — the identity layer, data model, auth flow, RLS policies, admin app spec. This is the foundation everything sits on.
2. `docs/nev-signal-sourcing-tool-prd.md` — the sourcing tool product spec, signal sources, scoring engine, UI spec, and the seven phases of build with verifiable "done when" criteria for each.

If you're starting a Phase X build, re-read Phase X of the PRD specifically. Don't work from memory.

## Repo layout

```
nev-workspace/
├── apps/
│   ├── auth/
│   ├── admin/
│   ├── lp-portal/
│   └── sourcing/
├── packages/
│   ├── db/                  # Supabase types, client, migrations
│   ├── ui/                  # shared shadcn components, design tokens
│   ├── auth/                # access middleware, session helpers
│   └── ingestion/           # signal source connectors
├── docs/
│   ├── nev-identity-layer-architecture.md
│   └── nev-signal-sourcing-tool-prd.md
├── .claude/
│   └── agents/              # subagent definitions (see below)
├── CLAUDE.md                # this file
├── turbo.json
└── package.json
```

## Core operating principles

These shape every decision you make in this codebase.

**Ship the smallest correct thing.** This is a two-person fund's internal tool, not a SaaS product. Don't add abstractions, configuration, or generality "in case we need it later." If we need it later, we'll add it later.

**Prefer Postgres over application code** for anything data-shaped. Use Postgres functions, triggers, views, and RLS policies before reaching for TypeScript. Supabase is paying for itself when we let it do the work.

**Match the existing pattern.** If a similar piece of code already exists in the repo, follow its structure. Consistency beats local optimization. Read 2–3 neighbouring files before writing a new one.

**Decisions go in the doc.** When you make a non-obvious technical decision, write a one-line comment with the reasoning. Future-you and Murtaza will both thank present-you.

**Phases are sacred.** The PRD breaks the build into phases with "done when" criteria for a reason. Finish one phase fully before starting the next. Phase verification (via the `phase-verifier` subagent) gates progression.

## Non-negotiable rules

These are not preferences. Violating them creates security, correctness, or design debt.

1. **RLS is on for every public schema table.** Always. Default deny. If you add a table, you add its RLS policies in the same migration. No exceptions.

2. **All data fetching is server-side** through Next.js server components or route handlers using the Supabase server client. Client-side direct Supabase queries are forbidden except for realtime subscriptions, which must still pass RLS.

3. **The access middleware gates every route in every app** except `/login`, `/callback`, and explicitly public marketing pages. Adding a new app means adding the middleware as the first file.

4. **No new dependencies without a reason.** If lodash or moment.js or some other thing wants to enter the package.json, explain why the standard library or existing dependency doesn't suffice. Tailwind, shadcn, Supabase SDK, and Next.js core ecosystem are pre-approved.

5. **No mock data in production paths.** If a feature isn't built yet, return an empty state, not fake records. Mock data has a way of leaking.

6. **Environment variables are typed and validated** at app boot using zod schemas in `packages/db/env.ts`. No `process.env.SOMETHING` accessed directly in feature code.

7. **Every migration is idempotent.** Use `create table if not exists`, `alter table ... add column if not exists`. Migrations may be re-run.

8. **Secrets are never committed.** API keys live in Vercel environment variables. Local development uses `.env.local`, which is gitignored. If a key leaks, rotate immediately.

## UI design system — the NEV Signal aesthetic

The UI matches the NEV Signal mockup that Murtaza signed off on. Frontend work must reproduce this aesthetic faithfully. The `design-critic` subagent enforces fidelity.

**Tone**: monastic, dense, fast. Not flashy. Reads like a Bloomberg terminal mated with Linear. Operator software for people who use it every day.

**Typography**:
- Sans-serif body (Inter or system-ui), 14–15px for content
- Monospace (JetBrains Mono or system mono) for: all numerals, timestamps, source attribution, status labels in caps, code-like identifiers
- Sentence case everywhere. Never Title Case. Never ALL CAPS except for explicit "label" patterns in mono (e.g., "SORTED BY FIT", "SIGNALS / 24H")
- Two weights only: 400 regular, 500 medium. Never 600+

**Color**:
- White surfaces, light gray secondary backgrounds (`--color-background-secondary`)
- Black for primary text, muted gray for secondary, lighter gray for tertiary
- Color is reserved for signal type categorization: purple (stealth), blue (job change), pink (hiring spike), teal (new company), amber (build-in-public)
- Signal type avatar background and pill background use the same color family
- FIT scores ≥85 render in teal (`#0F6E56`); below 85 render in primary text color
- No gradients, drop shadows, glows, or neon. Flat surfaces only.

**Layout**:
- 0.5px borders, never 1px
- `border-radius-md` (8px) on most elements, `-lg` (12px) on cards, fully rounded (`999px`) on filter pills
- Generous whitespace; line-height 1.5–1.7 on body text
- Right-aligned numerics in feed rows; left-aligned everything else

**Components**:
- Tabler outline icons only (`<i class="ti ti-X">`). Never use filled icons. Never emoji.
- Avatar circles for people (initials, color-matched to signal type), rounded squares for companies
- Pills/badges use a colored fill with darker text from the same color family
- Metric cards: muted background, label in small uppercase mono, value in large mono numerals

**Banned**:
- Emoji anywhere in UI text
- Title Case headings
- Gradient backgrounds
- Drop shadows (except focus rings)
- "AI-generic" tropes: glowing borders, animated gradients, decorative geometric shapes, hero illustrations of robots/brains
- Mid-sentence bolding
- font-weight 600 or higher
- More than two colors in any single component

## Orchestrator workflow

When Murtaza starts a session asking for non-trivial work, you act as the **orchestrator**. The orchestrator's job is to plan, delegate to subagents, verify, and report. Not to do all the work itself.

The standard orchestrator loop:

1. **Read the relevant docs** — architecture and PRD sections for the requested work.
2. **State your understanding** — write a short plan back to Murtaza. Confirm the phase, the scope, the success criteria. Wait for ack before proceeding on anything ambiguous.
3. **Decompose** — break the work into tasks. Each task maps to one subagent.
4. **Delegate** — invoke the relevant subagent for each task using the Task tool. Provide it the specific scope, the relevant doc references, and any constraints.
5. **Integrate** — review subagent output, resolve cross-cutting concerns, wire pieces together.
6. **Verify** — invoke `phase-verifier` against the PRD's "done when" criteria for the phase. If UI changed, also invoke `design-critic`.
7. **Report** — summarize what shipped, link to the changed files, note any deviations from the spec or new open questions.

For trivial tasks (one-line fix, single-file edit, doc updates), skip the delegation step and just do the work directly. The orchestrator/subagent pattern is for substantive work, not every keystroke.

## Subagent roster

Five subagents live in `.claude/agents/`. Invoke them via the Task tool. Each has its own system prompt, scope, and expertise.

| Subagent | Use when |
|----------|----------|
| `schema-architect` | Writing or modifying Postgres schema, RLS policies, migrations, Supabase functions, scoring engine SQL |
| `frontend-builder` | Building or modifying React components, pages, or any UI in any app. Must produce work that passes `design-critic` review. |
| `ingestion-builder` | Building or modifying signal source connectors (Crustdata, GitHub, OpenCorporates, WHOIS), edge functions, cron jobs, dedup logic |
| `phase-verifier` | After completing a phase, before moving to the next. Verifies "done when" criteria objectively. |
| `design-critic` | After `frontend-builder` finishes UI work. Reviews against the NEV Signal mockup for fidelity. Does not fix issues, only reports them. |

Subagent invocation pattern (pseudo):

```
orchestrator → schema-architect: "design the sourcing_signals table per PRD section X"
schema-architect → returns: migration file + index strategy notes
orchestrator → reads output, integrates
orchestrator → phase-verifier: "Phase 1 done? Check criteria from PRD."
phase-verifier → returns: pass/fail per criterion
orchestrator → reports to Murtaza
```

## Phase workflow (sourcing tool specifically)

The sourcing tool ships in seven phases. Don't skip ahead.

- **Phase 0** — Bootstrap monorepo, deploy sourcing app skeleton, wire identity middleware
- **Phase 1** — Schema migrations + seed alumni pool (~100 to start)
- **Phase 2** — First signal source (Crustdata person flow) + dedup
- **Phase 3** — Scoring engine + feed UI matching the mockup
- **Phase 4** — Signal detail page + action handlers (pursuing, snooze, pass, notes)
- **Phase 5** — Cofounder clustering logic + UI integration
- **Phase 6** — Secondary sources: GitHub, Delaware filings, WHOIS
- **Phase 7** — Polish: profile pages, watchlists, settings, performance pass

Each phase has a "done when" criterion in the PRD. `phase-verifier` checks it before you proceed.

## Commands

```bash
# Install
pnpm install

# Dev (all apps)
pnpm dev

# Dev (single app)
pnpm dev --filter=sourcing

# Lint and typecheck
pnpm lint
pnpm typecheck

# Supabase migrations (run from /packages/db)
pnpm supabase migration new <name>
pnpm supabase db push

# Production build
pnpm build
```

## Gotchas

- **Parent-domain cookies**: Supabase session cookies must be set with `domain: '.neweraventures.com'` to work across subdomains. This is configured in `packages/auth/createServerClient.ts`. Don't override it in individual apps.
- **RLS bypass for server-side ingestion**: Edge functions and cron-triggered workers use the service role key, which bypasses RLS. Be careful — this is the keys-to-the-kingdom. Service role key is server-side only, never exposed to the browser, and only used in `packages/ingestion/`.
- **Crustdata rate limits and pricing**: Tracked person count × refresh frequency drives cost. Phase 2 should not proceed without confirming the Crustdata plan supports 2,000 people × 6h. Murtaza handles this confirmation.
- **Supabase Auth + Resend email templates**: Templates live in Supabase Dashboard, not the codebase. Changes to email copy require a dashboard edit, not a PR. Document any changes in `docs/email-templates.md`.
- **Score function side effects**: The `sourcing_score_signal` Postgres function must be deterministic and side-effect-free. It can be called repeatedly (e.g., after weight tuning) and must produce the same output for the same input. No `now()`, no random, no writes.

## Definition of done

A piece of work is "done" when all of the following are true:

1. The relevant phase's "done when" criterion from the PRD passes via `phase-verifier`
2. For UI work, `design-critic` returns zero issues OR Murtaza explicitly accepts the deviation
3. RLS policies are in place for any new tables
4. Types compile (`pnpm typecheck` clean)
5. Lint is clean (`pnpm lint` clean)
6. Murtaza has been told what shipped, with file references

Anything less is in-progress, not done.
