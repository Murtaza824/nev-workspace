# TODO

Items logged from Phase 2 reviewer findings. Address before Phase 5 ships.

## Security
- [x] **Supabase dashboard**: Disabled "Enable email signups" on 2026-05-17.
- [ ] **Supabase dashboard**: Consider enabling `secure_password_change` (Authentication → Settings) — requires re-auth before password changes.
- [ ] **Security headers**: Add Content-Security-Policy header once admin page domains and external scripts are finalized. Deferred from Phase 5 — CSP needs finalisation of all external domains (Supabase, fonts, OG image). Add to `next.config.mjs` `headers()` array when ready.

## Phase 3 deferred (low severity — address before Phase 5)
- [ ] **UpdateBody paragraph spacing**: Tighten `mb-6` to `mb-5 md:mb-6` on mobile paragraphs (PRD §5 specifies 1.25em mobile vs 1.5em desktop spacing).
- [ ] **Mobile valuation history**: Event type pills (markup/markdown/initial) are omitted from the mobile stacked view on `/portfolio/[slug]`. Desktop shows them. Consider adding a small colored dot or text label on mobile.
- [ ] **Account page**: Add a line "To update your email, contact ir@neweraventures.com" so LPs know the path if their email changes.
- [ ] **Mobile portfolio card**: Consider adding a one-line sector or one-liner beneath the company name for companies that have it, so LPs don't need to tap through to identify a company.
- [ ] **Investment memos**: Upload PDF memos for all 11 companies via `/admin/portfolio` (Phase 4). Until uploaded, detail pages show "Investment memo available upon request." Field is `memo_pdf_url` on `portfolio_companies`.

## Phase 4 prep
- [ ] Admin invite flow (`/admin/users`) must NOT pass `role` in the metadata payload to `inviteUserByEmail()`. Role is always set to 'lp' by the trigger; admin elevation is a separate explicit action.
