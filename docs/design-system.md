# NEV design system

The canonical design system for all NEV workspace apps. The aesthetic was set by the NEV Signal sourcing tool mockup and applies to every app that sits in this monorepo — LP portal, admin, auth, sourcing, and anything that comes after.

**This document is the source of truth.** When `frontend-builder` builds UI, it reads this doc. When `design-critic` reviews UI, it reads this doc. When the mockup and this doc disagree, this doc wins (and gets updated to reflect the mockup if the mockup is right).

## Design philosophy

NEV's tools are operator software for people who use them every day. The aesthetic is **monastic, dense, fast** — closer to Bloomberg or Linear than to a consumer AI product. Restraint is the design.

Three principles:

1. **Information density without clutter.** The feed shows six signals at a glance. Each row carries a lot of data — name, context, summary, source, recency, score — but reads quickly because of typographic hierarchy and disciplined spacing, not because data was hidden.
2. **Numerals are first-class citizens.** Counts, scores, timestamps, and IDs are in monospace. The eye should snap to them.
3. **Color is information, not decoration.** Color appears only when it categorizes (signal type) or signals priority (FIT scores ≥85). It never appears for "vibes."

If a design choice doesn't serve one of those principles, remove it.

## Design tokens

### Colors

Define these as CSS custom properties on `:root` in `packages/ui/globals.css`. Tailwind references them via `theme.extend.colors` in `tailwind.config.ts`.

| Token | Value | Use |
|-------|-------|-----|
| `--color-background-primary` | `#FFFFFF` | App background, card surfaces |
| `--color-background-secondary` | `#F7F6F4` | Muted card backgrounds (metric cards), input fields |
| `--color-background-tertiary` | `#F0EFEC` | Hover states on muted surfaces |
| `--color-text-primary` | `#1A1A1A` | Body text, headings |
| `--color-text-secondary` | `#525252` | Summaries, descriptions |
| `--color-text-tertiary` | `#8A8A8A` | Labels, meta info, source attribution |
| `--color-border-primary` | `rgba(0, 0, 0, 0.16)` | Strong borders (rare) |
| `--color-border-secondary` | `rgba(0, 0, 0, 0.10)` | Filter pill borders, button borders |
| `--color-border-tertiary` | `rgba(0, 0, 0, 0.06)` | Section dividers, feed row dividers |
| `--color-accent-teal` | `#0F6E56` | FIT scores ≥85 |
| `--color-accent-green-dot` | `#1D9E75` | Streaming/live indicator dot |

**Signal type color families** (paired backgrounds + foregrounds). Avatar and pill must use the same family for a given signal:

| Signal type | Background | Foreground |
|-------------|------------|------------|
| Stealth | `#EEEDFE` | `#3C3489` |
| Job change | `#E6F1FB` | `#0C447C` |
| Hiring spike | `#FBEAF0` | `#72243E` |
| New company | `#E1F5EE` | `#085041` |
| Build-in-public | `#FAEEDA` | `#633806` |

These five families are the entire color vocabulary for categorization. Don't introduce a sixth without explicit approval.

### Typography

Two font families, two weights, defined ranges of sizes.

**Families**:
- Body sans-serif: `Inter` with fallback `system-ui, -apple-system, BlinkMacSystemFont, sans-serif`
- Monospace: `JetBrains Mono` with fallback `ui-monospace, 'SF Mono', Menlo, Monaco, Consolas, monospace`

Load Inter and JetBrains Mono via `next/font` in each app's root layout.

**Weights**: 400 (regular) and 500 (medium). **Never** 600 or higher. **Never** bold mid-sentence.

**Sizes** (use these tokens; don't invent new ones):

| Token | Value | Use |
|-------|-------|-----|
| `--text-xs` | 10px | Uppercase labels, sublabels, badge text |
| `--text-sm` | 11px | Source attribution, fine print |
| `--text-base` | 12px | Filter pills, fit-label, small UI text |
| `--text-md` | 13px | Body text, summaries |
| `--text-lg` | 14px | Names, primary feed text |
| `--text-xl` | 15px | App lockup, page titles in compact contexts |
| `--text-2xl` | 17px | FIT scores in feed |
| `--text-3xl` | 20px | Metric card values |
| `--text-4xl` | 24px | Page hero numbers (rare; reserved for detail pages) |

**Line height**:
- Body text and summaries: `1.5` (sometimes `1.6` for long-form)
- UI labels and numerals: `1.2`
- Never below `1.2`

**Letter spacing**:
- Uppercase mono labels: `0.06em` for small labels, `0.08em` for very small labels
- Everything else: `normal` (no manual tracking)

**Case**:
- Sentence case for all prose, headings, button text
- Uppercase only for mono labels (e.g., "SORTED BY FIT", "SIGNALS / 24H")
- Never Title Case. Never ALL CAPS for non-mono text.

### Spacing

Tailwind's default spacing scale is fine. Common values used in the mockup:

| Use | Spacing |
|-----|---------|
| Section padding (vertical, between major regions) | `14px` |
| Card padding | `10px 12px` (compact) or `16px` (standard) |
| Gap between avatar and content in a feed row | `12px` |
| Gap between filter chips | `6px` |
| Gap between metric cards | `8px` |
| Gap inside a metric card label → value | `2px` |
| Bottom margin on metric cards section | `1.25rem` |

### Borders and radius

| Token | Value | Use |
|-------|-------|-----|
| Border weight | `0.5px` everywhere; **never** 1px | All visible borders |
| `--border-radius-sm` | `4px` | Pills, badges |
| `--border-radius-md` | `7-8px` | Most cards, buttons, app icon |
| `--border-radius-lg` | `12px` | Large cards, detail panels |
| `--border-radius-full` | `999px` | Filter pills (fully rounded) |
| `--border-radius-circle` | `50%` | Person avatars |

### Shadows

**None.** No drop shadows, no glow, no elevation system. The only allowed shadow is the focus ring on interactive elements:

```css
:focus-visible { outline: 2px solid var(--color-text-primary); outline-offset: 2px; }
```

## Component specifications

Every visible element from the mockup, specified.

### App header

The top section with the NEV Signal lockup, status indicator, and search/settings affordances.

**Container**: flex row, space-between, padding-bottom `14px`, bottom border `0.5px solid var(--color-border-tertiary)`.

**Left side** (lockup):
- Flex row, gap `10px`, align center
- App icon: `30px × 30px`, `border-radius: 7px`, background `var(--color-text-primary)`, foreground `var(--color-background-primary)`, font-weight 500, font-size 13px, mono family, centered single letter ("N" for NEV Signal)
- Lockup text container:
  - Title: 15px font-weight 500, line-height 1.2 ("NEV Signal")
  - Sublabel: 10px mono uppercase letter-spacing 0.08em color tertiary margin-top 2px ("SOURCING · LIVE")

**Right side** (controls):
- Flex row, gap `14px`, align center
- Streaming pill: inline-flex gap `6px`, font-size 12px color secondary. Green dot `6px × 6px` circle bg `#1D9E75`, then text "Streaming"
- Search icon: `ti-search`, font-size 16px
- Filter icon: `ti-adjustments-horizontal`, font-size 16px

All icon-only buttons get `aria-label`. Decorative SVG/icons get `aria-hidden`.

### Filter chip row

Horizontal scrolling row of pills representing signal type filters.

**Container**: flex row, gap `6px`, padding `14px 0 12px`, flex-wrap allowed.

**Pill (active)**:
- `padding: 4px 11px`
- `border-radius: 999px`
- background `var(--color-text-primary)`, color `var(--color-background-primary)`
- font-size 12px
- no border
- count suffix is part of the same string ("All · 47") — don't separate

**Pill (inactive)**:
- Same padding and radius
- background `transparent`
- `border: 0.5px solid var(--color-border-secondary)`
- color `var(--color-text-secondary)`
- font-size 12px

Counts in pills are part of the label text — they don't need to be monospace because they sit inside the prose.

### Metric cards

Row of small KPI cards above the feed.

**Container**: CSS grid, `grid-template-columns: repeat(4, 1fr)`, gap `8px`, margin-bottom `1.25rem`. (On narrower viewports, collapse to 2 columns.)

**Card**:
- background `var(--color-background-secondary)`
- `border-radius: var(--border-radius-md)`
- `padding: 10px 12px`
- no border, no shadow

**Label**: font-size 10px, color tertiary, letter-spacing 0.06em, mono family, uppercase. Examples: "SIGNALS / 24H", "HIGH PRIORITY", "TRACKED PEOPLE", "WATCHLISTS".

**Value**: font-size 20px, font-weight 500, mono family, margin-top 2px. Always numeric. Always right-aligned within its own flow (left-aligned in the card overall, but the digit itself isn't padded).

### Feed section header

Sits between the metric cards and the first signal row.

**Container**: flex row, space-between, margin-bottom 4px.

**Title** (left): font-size 13px, font-weight 500 ("Today's signals" or "This week's signals").
**Sort label** (right): font-size 11px, color tertiary, mono family, uppercase ("SORTED BY FIT").

### Signal row

The heart of the feed. Most important component in the system. Every detail matters.

**Container**:
- flex row
- align-items: flex-start
- gap `12px`
- padding `14px 0`
- bottom border `0.5px solid var(--color-border-tertiary)` (except on the last row)

**Avatar** (left):
- `36px × 36px`
- For people: `border-radius: 50%`
- For companies: `border-radius: 7px` (rounded square)
- Background and foreground from the signal-type color family
- Initials: font-weight 500, font-size 12px
- `flex-shrink: 0`

**Content** (middle, fills available space):
- `flex: 1`
- `min-width: 0` (allows text to truncate properly)

  *Header row*:
  - flex row, gap `6px`, margin-bottom `3px`, flex-wrap allowed
  - Name: font-weight 500, font-size 14px
  - Context (after a `·`): font-size 12px, color tertiary. Example: "ex-Stripe PM, ex-Notion"
  - Signal type pill (see below)

  *Summary*:
  - font-size 13px, color secondary, line-height 1.5
  - One or two sentences. Concrete, specific. Never marketing-speak.

  *Source attribution row*:
  - flex row, align center, gap `8px`, margin-top `7px`
  - font-size 11px, color tertiary, mono family, uppercase
  - Format: `<icon> SOURCE · <relative time> · <signal count>`
  - Example: `LINKEDIN + CRUSTDATA · 2H AGO · 3 SIGNALS`
  - Separators are `·` middle dots in the same color/size

**Signal type pill**:
- `padding: 1px 7px`
- `border-radius: 4px`
- font-size 10px
- mono family, uppercase, letter-spacing 0.06em
- Background and foreground from the signal-type color family (same family as the avatar)
- Examples: STEALTH, JOB CHANGE, HIRING SPIKE, NEW CO, BUILD-IN-PUBLIC

**Score (right)**:
- flex column, align-items flex-end, gap 2px
- `flex-shrink: 0`
- FIT number:
  - font-size 17px, font-weight 500, mono family
  - Color: `var(--color-accent-teal)` (`#0F6E56`) if score ≥85; otherwise `var(--color-text-primary)`
  - **This is non-negotiable.** A score of 88 is teal. A score of 84 is black. The threshold draws the eye to high-priority signals.
- FIT label:
  - font-size 9px, color tertiary, letter-spacing 0.08em, mono family, uppercase ("FIT")

### Bottom action bar

Footer below the feed.

**Container**: flex row, space-between, padding-top `14px`, top border `0.5px solid var(--color-border-tertiary)`, font-size 12px, color tertiary.

**Left**: "Showing N of M · refreshed Xs ago"
**Right**: keyboard shortcut hints in mono ("⌘K to search · ⌘N new watchlist")

## Icons

**Library**: Tabler Icons, outline (line) variants only.

**Loading**: webfont via CDN or `@tabler/icons-webfont` npm package, loaded once in each app's root layout.

**Usage**: `<i class="ti ti-<name>" aria-hidden="true"></i>` for decorative icons. For icon-only buttons, wrap and add `aria-label="<action>"` to the button.

**Common icons used**:
- `ti-search` — search affordance in app header
- `ti-adjustments-horizontal` — filter/settings affordance in app header
- `ti-brand-linkedin` — LinkedIn source attribution
- `ti-brand-x` — Twitter source attribution
- `ti-database` — Crustdata source attribution
- `ti-world` — public records / web sources
- `ti-git-fork` — GitHub-related signals (when wired)

**Never**:
- Filled Tabler variants (`ti-X-filled`) — these aren't loaded and render blank
- Emoji — anywhere, ever, in UI text
- Custom hand-drawn SVG illustrations — use Tabler or omit the icon
- Lucide, FontAwesome, Heroicons, Material Icons — these don't match the Tabler aesthetic; don't mix libraries

## Patterns and conventions

### Numerical display

All numerals in the UI are in monospace. This includes:

- FIT scores
- Counts in pills ("All · 47")
- Metric card values
- Timestamps ("2H AGO", "1D AGO")
- Source signal counts ("3 SIGNALS")
- Keyboard shortcuts ("⌘K")

Numbers inside prose summaries (e.g., "Headcount +40% over 30 days") stay in the body font — they're part of the sentence, not standalone data.

### Time formatting

Relative time in feed: short uppercase mono.

- < 1 minute: `JUST NOW`
- < 1 hour: `5M AGO`
- < 24 hours: `2H AGO`
- < 7 days: `1D AGO`, `6D AGO`
- ≥ 7 days: `2W AGO`, `1MO AGO`, `3MO AGO`
- ≥ 1 year: display date in `MMM YYYY` format

Use `date-fns` for formatting. The function lives in `packages/ui/lib/formatTime.ts`.

### Empty states

When the feed has no signals (or a filter produces no results), show:

- Centered in the feed area, vertical padding `48px`
- A single line of body text, color tertiary, font-size 13px
- Examples: "No signals match your filter.", "No signals today. Sources next refresh in 2h 14m."
- No illustration, no decorative graphic, no "thumbs up" iconography. Just the line of text.

### Loading states

Use Next.js `loading.tsx` per route. Loading UI matches the structure of the loaded UI with `var(--color-background-secondary)` shimmer blocks where content will appear. Never a centered spinner. Never a "Loading..." label.

### Error states

Use Next.js `error.tsx` per route. Error UI is a single line of body text in color secondary with a "Try again" button (inline, underlined link style — not a button with a border). No exclamation marks, no red borders, no scary iconography. Errors are operational, not emotional.

## Banned patterns

These are not stylistic preferences. They are forbidden because they signal "AI-generated" and violate the operator-software aesthetic. `design-critic` flags them as **blocking**.

- Gradients (any direction, any colors)
- Drop shadows except focus rings
- Glow, neon, animated color effects
- Animated geometric backgrounds (floating shapes, neural-network visualizations, particle effects)
- Glassmorphism, frosted-glass effects, backdrop blur
- Hero illustrations of robots, brains, lightbulbs, sparkles
- ✨ or 🤖 or similar emoji anywhere in UI text
- Title Case headings ("New Era Ventures" is fine as a brand name; "Today's Signals" is not — should be "Today's signals")
- Bold mid-sentence for emphasis
- font-weight 600 or higher anywhere
- Borders thicker than 0.5px
- More than two color families in a single component
- "AI startup purple" gradient brand treatments
- Floating "Ask AI" or "Assistant" widgets in corners
- Card stacks with parallax depth shadows
- Stock-photo human silhouettes or anthropomorphic AI imagery

If something feels like it could be in a 2024 vibe-coded SaaS landing page, it doesn't belong here.

## Reference HTML

The following is the literal HTML/CSS structure from the approved NEV Signal mockup. Use it as ground truth when building the feed page. The classes are not Tailwind utilities (the mockup was inline-styled) — translate them to Tailwind/CSS modules as you build, but preserve the structure, the exact pixel values, and the exact color codes.

```html
<div style="padding: 1rem 0;">

  <!-- App header -->
  <div style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 14px; border-bottom: 0.5px solid var(--color-border-tertiary);">
    <div style="display: flex; align-items: center; gap: 10px;">
      <div style="width: 30px; height: 30px; border-radius: 7px; background: var(--color-text-primary); color: var(--color-background-primary); display: flex; align-items: center; justify-content: center; font-weight: 500; font-size: 13px; font-family: var(--font-mono);">N</div>
      <div>
        <div style="font-size: 15px; font-weight: 500; line-height: 1.2;">NEV Signal</div>
        <div style="font-size: 10px; color: var(--color-text-tertiary); letter-spacing: 0.08em; font-family: var(--font-mono); margin-top: 2px;">SOURCING · LIVE</div>
      </div>
    </div>
    <div style="display: flex; align-items: center; gap: 14px; font-size: 12px; color: var(--color-text-secondary);">
      <span style="display: inline-flex; align-items: center; gap: 6px;"><span style="width: 6px; height: 6px; border-radius: 50%; background: #1D9E75; display: inline-block;"></span>Streaming</span>
      <i class="ti ti-search" style="font-size: 16px;" aria-hidden="true"></i>
      <i class="ti ti-adjustments-horizontal" style="font-size: 16px;" aria-hidden="true"></i>
    </div>
  </div>

  <!-- Filter chips -->
  <div style="display: flex; gap: 6px; padding: 14px 0 12px; flex-wrap: wrap;">
    <button style="padding: 4px 11px; border-radius: 999px; background: var(--color-text-primary); color: var(--color-background-primary); border: none; font-size: 12px; cursor: pointer;">All · 47</button>
    <button style="padding: 4px 11px; border-radius: 999px; background: transparent; border: 0.5px solid var(--color-border-secondary); font-size: 12px; color: var(--color-text-secondary); cursor: pointer;">Stealth · 9</button>
    <!-- ... etc for Job changes, New cos, Hiring spikes, Build-in-public ... -->
  </div>

  <!-- Metric cards -->
  <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 1.25rem;">
    <div style="background: var(--color-background-secondary); border-radius: var(--border-radius-md); padding: 10px 12px;">
      <div style="font-size: 10px; color: var(--color-text-tertiary); letter-spacing: 0.06em; font-family: var(--font-mono);">SIGNALS / 24H</div>
      <div style="font-size: 20px; font-weight: 500; font-family: var(--font-mono); margin-top: 2px;">47</div>
    </div>
    <!-- ... etc for HIGH PRIORITY, TRACKED PEOPLE, WATCHLISTS ... -->
  </div>

  <!-- Feed header -->
  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
    <div style="font-size: 13px; font-weight: 500;">Today's signals</div>
    <div style="font-size: 11px; color: var(--color-text-tertiary); font-family: var(--font-mono);">SORTED BY FIT</div>
  </div>

  <!-- Signal row: STEALTH (Sarah Chen, score 94 → teal) -->
  <div style="display: flex; align-items: flex-start; gap: 12px; padding: 14px 0; border-bottom: 0.5px solid var(--color-border-tertiary);">
    <div style="width: 36px; height: 36px; border-radius: 50%; background: #EEEDFE; color: #3C3489; display: flex; align-items: center; justify-content: center; font-weight: 500; font-size: 12px; flex-shrink: 0;">SC</div>
    <div style="flex: 1; min-width: 0;">
      <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 3px; flex-wrap: wrap;">
        <span style="font-weight: 500; font-size: 14px;">Sarah Chen</span>
        <span style="font-size: 12px; color: var(--color-text-tertiary);">· ex-Stripe PM, ex-Notion</span>
        <span style="padding: 1px 7px; border-radius: 4px; font-size: 10px; background: #EEEDFE; color: #3C3489; letter-spacing: 0.06em; font-family: var(--font-mono);">STEALTH</span>
      </div>
      <div style="font-size: 13px; color: var(--color-text-secondary); line-height: 1.5;">Updated LinkedIn headline to "Building something new" · recent posts reference AI infra · removed all employer tags within 48h.</div>
      <div style="display: flex; align-items: center; gap: 8px; margin-top: 7px; font-size: 11px; color: var(--color-text-tertiary); font-family: var(--font-mono);">
        <span><i class="ti ti-brand-linkedin" style="font-size: 12px; vertical-align: -1px;" aria-hidden="true"></i> LINKEDIN + CRUSTDATA</span>
        <span>·</span>
        <span>2H AGO</span>
        <span>·</span>
        <span>3 SIGNALS</span>
      </div>
    </div>
    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 2px; flex-shrink: 0;">
      <div style="font-size: 17px; font-weight: 500; font-family: var(--font-mono); color: #0F6E56;">94</div>
      <div style="font-size: 9px; color: var(--color-text-tertiary); letter-spacing: 0.08em; font-family: var(--font-mono);">FIT</div>
    </div>
  </div>

  <!-- Signal row: JOB CHANGE (Marcus Webb, score 91 → teal) -->
  <div style="display: flex; align-items: flex-start; gap: 12px; padding: 14px 0; border-bottom: 0.5px solid var(--color-border-tertiary);">
    <div style="width: 36px; height: 36px; border-radius: 50%; background: #E6F1FB; color: #0C447C; display: flex; align-items: center; justify-content: center; font-weight: 500; font-size: 12px; flex-shrink: 0;">MW</div>
    <div style="flex: 1; min-width: 0;">
      <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 3px; flex-wrap: wrap;">
        <span style="font-weight: 500; font-size: 14px;">Marcus Webb</span>
        <span style="font-size: 12px; color: var(--color-text-tertiary);">· Research Scientist, Anthropic</span>
        <span style="padding: 1px 7px; border-radius: 4px; font-size: 10px; background: #E6F1FB; color: #0C447C; letter-spacing: 0.06em; font-family: var(--font-mono);">JOB CHANGE</span>
      </div>
      <div style="font-size: 13px; color: var(--color-text-secondary); line-height: 1.5;">Tweeted "Last day at Anthropic. Excited for what's next" · LinkedIn now reads "Founder, Stealth" · two co-tweets from known co-founders.</div>
      <!-- source row, score column ... same pattern -->
    </div>
  </div>

  <!-- Signal row: HIRING SPIKE (Glimpse AI, company avatar — rounded square not circle, score 88 → teal) -->
  <div style="display: flex; align-items: flex-start; gap: 12px; padding: 14px 0; border-bottom: 0.5px solid var(--color-border-tertiary);">
    <div style="width: 36px; height: 36px; border-radius: 7px; background: #FBEAF0; color: #72243E; display: flex; align-items: center; justify-content: center; font-weight: 500; font-size: 12px; flex-shrink: 0;">GA</div>
    <!-- ... -->
  </div>

  <!-- Signal row: NEW CO (Recurra Labs, company avatar, score 86 → teal) -->
  <!-- Signal row: BUILD-IN-PUBLIC (James Liu, person avatar, score 79 → NOT teal, primary text color) -->
  <!-- Signal row: JOB CHANGE (Aaron Park, person avatar, score 77 → NOT teal) -->

  <!-- Bottom action bar -->
  <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 14px; border-top: 0.5px solid var(--color-border-tertiary); font-size: 12px; color: var(--color-text-tertiary);">
    <span>Showing 6 of 47 · refreshed 30s ago</span>
    <span style="font-family: var(--font-mono);">⌘K to search · ⌘N new watchlist</span>
  </div>

</div>
```

## Implementation notes for frontend-builder

**Translate inline styles to Tailwind + CSS variables.** The reference HTML uses inline styles for clarity; the real implementation uses Tailwind classes referencing the CSS custom properties defined in `packages/ui/globals.css`.

Example translation:

```html
<!-- Reference (inline) -->
<div style="font-size: 14px; font-weight: 500;">Sarah Chen</div>

<!-- Implementation (Tailwind) -->
<div className="text-[14px] font-medium">Sarah Chen</div>

<!-- Or, if the size is in the default scale -->
<div className="text-sm font-medium">Sarah Chen</div>
```

**Extract the signal row into a reusable component**, parameterized by signal type. The component lives in `packages/ui/components/SignalRow.tsx` and is consumed by `apps/sourcing/app/page.tsx`.

**Color-family selection** lives in a helper:

```ts
// packages/ui/lib/signalColors.ts
export const signalTypeColors = {
  stealth: { bg: '#EEEDFE', fg: '#3C3489' },
  job_change: { bg: '#E6F1FB', fg: '#0C447C' },
  hiring_spike: { bg: '#FBEAF0', fg: '#72243E' },
  new_company: { bg: '#E1F5EE', fg: '#085041' },
  build_in_public: { bg: '#FAEEDA', fg: '#633806' },
} as const

export const signalTypeLabels = {
  stealth: 'STEALTH',
  job_change: 'JOB CHANGE',
  hiring_spike: 'HIRING SPIKE',
  new_company: 'NEW CO',
  build_in_public: 'BUILD-IN-PUBLIC',
} as const
```

**Score color logic**:

```ts
const scoreColor = score >= 85 
  ? 'var(--color-accent-teal)' 
  : 'var(--color-text-primary)'
```

**Avatar shape logic**:

```ts
const avatarShape = entityType === 'person' ? 'rounded-full' : 'rounded-[7px]'
```

**Initials generation**: first letter of first word + first letter of last word for people. For companies, first two consonants of the name or the first two letters if the name is short (e.g., "Glimpse AI" → "GA", "Recurra Labs" → "RL").

## Open considerations

These are decisions deferred to first build that should be locked in then:

- **Dark mode**: not in the mockup, not planned for v1. The token system above will support it (swap `--color-background-*` and `--color-text-*` values via a `.dark` class) but no implementation work yet.
- **Mobile responsive**: feed is desktop-first v1. The metric card grid should collapse to 2 columns under 640px. Signal rows already work fine on narrow widths due to `flex-wrap`.
- **Animation**: minimal. The streaming indicator dot can pulse softly (1.5s cycle, opacity 0.7 → 1.0 → 0.7). Filter chip selection is instant — no slide or fade. Page transitions use Next.js defaults (none).
- **Custom NEV branding**: the "N" in the app icon is a placeholder. If you have an actual NEV mark, swap it in. Don't introduce a logotype, gradient, or wordmark in the app header.
