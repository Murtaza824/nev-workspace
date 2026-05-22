-- ============================================================
-- NEV LP Portal — Seed Data
-- Fund I data and 11 portfolio companies with valuation events
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- FUND
-- ──────────────────────────────────────────────────────────

insert into public.fund (name, vintage, total_committed, total_called, total_deployed, total_current_value, as_of_date)
values ('NEV Fund I', 2025, 2107500.00, 1369875.00, 1311798.17, 1563400.00, '2026-04-29');

-- ──────────────────────────────────────────────────────────
-- PORTFOLIO COMPANIES
-- ──────────────────────────────────────────────────────────

insert into public.portfolio_companies
  (slug, name, stage, status, invested_date, check_size, entry_valuation, ownership_pct, pro_rata_rights, current_valuation, current_multiple, website)
values
  ('engram',        'Engram',         'Pre-Seed',    'active', '2026-04-29', 200000, 45000000, 0.44, false, 75000000, 1.67, 'https://www.engram.co/'),
  ('olive',         'Olive',          'First Check', 'active', '2026-04-27', 110000, 13000000, 0.85, true,  20000000, 1.54, 'https://olive.sh/'),
  ('apollo-atomics','Apollo Atomics',  'Pre-Seed',    'active', '2026-02-11', 175000, 20000000, 0.88, true,  20000000, 1.00, 'https://apolloatomics.com/'),
  ('subhub',        'SubHub',         'First Check', 'active', '2026-01-25', 150000, 22500000, 0.67, true,  22500000, 1.00, 'https://subhub.io/'),
  ('goblins',       'Goblins',        'Seed',        'active', '2025-11-20',  70000, 18000000, 0.39, false, 18000000, 1.00, 'https://goblinsapp.com/'),
  ('terac',         'Terac',          'Seed',        'active', '2025-11-17', 100000, 30000000, 0.33, false, 30000000, 1.00, 'https://terac.com/'),
  ('crabi-robotics','CRABI Robotics',  'Seed',        'active', '2025-09-26', 100000, 20000000, 0.50, false, 20000000, 1.00, 'https://www.crabi-robotics.com/'),
  ('fastlease-ai',  'FastLease AI',   'First Check', 'active', '2025-09-20',  20000,  2000000, 1.00, true,   3000000, 1.50, 'https://www.fastlease.ai/'),
  ('silares',       'Silares',        'Seed',        'active', '2025-07-21', 175000, 25000000, 0.70, true,  30000000, 1.20, 'https://www.silares.com/'),
  ('sylvan-labs',   'Sylvan Labs',    'First Check', 'active', '2025-06-06', 100000, 15000000, 0.67, false, 15000000, 1.00, 'https://sylvanlabs.com/'),
  ('applied37',     'applied37',      'First Check', 'active', '2025-04-07', 100000, 40000000, 0.25, false, 50000000, 1.25, 'https://www.forge.ai/');

-- ──────────────────────────────────────────────────────────
-- VALUATION EVENTS
-- Initial entry event for every company.
-- Markup event for companies where current_multiple != 1.00.
-- Uses a DO block to resolve company IDs by slug.
-- ──────────────────────────────────────────────────────────

do $$
declare
  v_id uuid;
begin

  -- Engram (mult 1.67 — markup)
  select id into v_id from public.portfolio_companies where slug = 'engram';
  insert into public.valuation_events (company_id, event_date, event_type, new_company_valuation, new_position_value, multiple, note)
    values (v_id, '2026-04-29', 'initial', 45000000, 200000, 1.00, 'Initial investment');
  insert into public.valuation_events (company_id, event_date, event_type, new_company_valuation, new_position_value, multiple, note)
    values (v_id, '2026-04-29', 'markup',  75000000, 334000, 1.67, 'Marked to current valuation');

  -- Olive (mult 1.54 — markup)
  select id into v_id from public.portfolio_companies where slug = 'olive';
  insert into public.valuation_events (company_id, event_date, event_type, new_company_valuation, new_position_value, multiple, note)
    values (v_id, '2026-04-27', 'initial', 13000000, 110000, 1.00, 'Initial investment');
  insert into public.valuation_events (company_id, event_date, event_type, new_company_valuation, new_position_value, multiple, note)
    values (v_id, '2026-04-27', 'markup',  20000000, 169400, 1.54, 'Marked to current valuation');

  -- Apollo Atomics (mult 1.00 — no markup)
  select id into v_id from public.portfolio_companies where slug = 'apollo-atomics';
  insert into public.valuation_events (company_id, event_date, event_type, new_company_valuation, new_position_value, multiple, note)
    values (v_id, '2026-02-11', 'initial', 20000000, 175000, 1.00, 'Initial investment');

  -- SubHub (mult 1.00 — no markup)
  select id into v_id from public.portfolio_companies where slug = 'subhub';
  insert into public.valuation_events (company_id, event_date, event_type, new_company_valuation, new_position_value, multiple, note)
    values (v_id, '2026-01-25', 'initial', 22500000, 150000, 1.00, 'Initial investment');

  -- Goblins (mult 1.00 — no markup)
  select id into v_id from public.portfolio_companies where slug = 'goblins';
  insert into public.valuation_events (company_id, event_date, event_type, new_company_valuation, new_position_value, multiple, note)
    values (v_id, '2025-11-20', 'initial', 18000000, 70000, 1.00, 'Initial investment');

  -- Terac (mult 1.00 — no markup)
  select id into v_id from public.portfolio_companies where slug = 'terac';
  insert into public.valuation_events (company_id, event_date, event_type, new_company_valuation, new_position_value, multiple, note)
    values (v_id, '2025-11-17', 'initial', 30000000, 100000, 1.00, 'Initial investment');

  -- CRABI Robotics (mult 1.00 — no markup)
  select id into v_id from public.portfolio_companies where slug = 'crabi-robotics';
  insert into public.valuation_events (company_id, event_date, event_type, new_company_valuation, new_position_value, multiple, note)
    values (v_id, '2025-09-26', 'initial', 20000000, 100000, 1.00, 'Initial investment');

  -- FastLease AI (mult 1.50 — markup)
  select id into v_id from public.portfolio_companies where slug = 'fastlease-ai';
  insert into public.valuation_events (company_id, event_date, event_type, new_company_valuation, new_position_value, multiple, note)
    values (v_id, '2025-09-20', 'initial', 2000000, 20000, 1.00, 'Initial investment');
  insert into public.valuation_events (company_id, event_date, event_type, new_company_valuation, new_position_value, multiple, note)
    values (v_id, '2025-09-20', 'markup',  3000000, 30000, 1.50, 'Marked to current valuation');

  -- Silares (mult 1.20 — markup)
  select id into v_id from public.portfolio_companies where slug = 'silares';
  insert into public.valuation_events (company_id, event_date, event_type, new_company_valuation, new_position_value, multiple, note)
    values (v_id, '2025-07-21', 'initial', 25000000, 175000, 1.00, 'Initial investment');
  insert into public.valuation_events (company_id, event_date, event_type, new_company_valuation, new_position_value, multiple, note)
    values (v_id, '2025-07-21', 'markup',  30000000, 210000, 1.20, 'Marked to current valuation');

  -- Sylvan Labs (mult 1.00 — no markup)
  select id into v_id from public.portfolio_companies where slug = 'sylvan-labs';
  insert into public.valuation_events (company_id, event_date, event_type, new_company_valuation, new_position_value, multiple, note)
    values (v_id, '2025-06-06', 'initial', 15000000, 100000, 1.00, 'Initial investment');

  -- applied37 (mult 1.25 — markup)
  select id into v_id from public.portfolio_companies where slug = 'applied37';
  insert into public.valuation_events (company_id, event_date, event_type, new_company_valuation, new_position_value, multiple, note)
    values (v_id, '2025-04-07', 'initial', 40000000, 100000, 1.00, 'Initial investment');
  insert into public.valuation_events (company_id, event_date, event_type, new_company_valuation, new_position_value, multiple, note)
    values (v_id, '2025-04-07', 'markup',  50000000, 125000, 1.25, 'Marked to current valuation');

end $$;

-- ──────────────────────────────────────────────────────────
-- CO-INVESTORS
-- ──────────────────────────────────────────────────────────

do $$
declare
  v_id uuid;
begin

  select id into v_id from public.portfolio_companies where slug = 'engram';
  insert into public.co_investors (company_id, name, "order") values
    (v_id, 'Valor Equity', 1), (v_id, 'BoxGroup', 2), (v_id, 'SV Angel', 3),
    (v_id, 'Long Journey', 4), (v_id, 'Genesis Fund', 5), (v_id, 'GoAhead Ventures', 6);

  select id into v_id from public.portfolio_companies where slug = 'olive';
  insert into public.co_investors (company_id, name, "order") values
    (v_id, 'Maniac Ventures', 1), (v_id, 'Hypersphere Capital', 2), (v_id, 'Charlie Songhurst', 3);

  select id into v_id from public.portfolio_companies where slug = 'apollo-atomics';
  insert into public.co_investors (company_id, name, "order") values
    (v_id, 'Genesis Fund', 1), (v_id, 'Y Combinator', 2), (v_id, 'Don''t Quit Ventures', 3);

  select id into v_id from public.portfolio_companies where slug = 'subhub';
  insert into public.co_investors (company_id, name, "order") values
    (v_id, 'SF1', 1), (v_id, 'Atlas Construction', 2);

  select id into v_id from public.portfolio_companies where slug = 'goblins';
  insert into public.co_investors (company_id, name, "order") values
    (v_id, 'Night Capital', 1), (v_id, 'Reid Hoffman', 2),
    (v_id, 'Scott Belsky', 3), (v_id, 'GoAhead Ventures', 4);

  select id into v_id from public.portfolio_companies where slug = 'terac';
  insert into public.co_investors (company_id, name, "order") values
    (v_id, 'Emergence Capital', 1), (v_id, 'SignalFire', 2),
    (v_id, 'Audacious', 3), (v_id, 'SV Angel', 4), (v_id, 'DST Global', 5);

  select id into v_id from public.portfolio_companies where slug = 'crabi-robotics';
  insert into public.co_investors (company_id, name, "order") values
    (v_id, 'Venrex', 1), (v_id, 'XFund', 2), (v_id, 'Build Collective', 3);

  select id into v_id from public.portfolio_companies where slug = 'fastlease-ai';
  insert into public.co_investors (company_id, name, "order") values
    (v_id, '1517 Fund', 1), (v_id, 'Cory Levy', 2), (v_id, 'LeapYear', 3);

  select id into v_id from public.portfolio_companies where slug = 'silares';
  insert into public.co_investors (company_id, name, "order") values
    (v_id, 'Susa Ventures', 1), (v_id, 'HOF Capital', 2), (v_id, 'Champion Hill', 3),
    (v_id, 'Volt Capital', 4), (v_id, 'Paul Merolla', 5);

  select id into v_id from public.portfolio_companies where slug = 'sylvan-labs';
  insert into public.co_investors (company_id, name, "order") values
    (v_id, 'Kyber Knight', 1), (v_id, 'Coho Deeptech', 2), (v_id, 'Krew Capital', 3);

  select id into v_id from public.portfolio_companies where slug = 'applied37';
  insert into public.co_investors (company_id, name, "order") values
    (v_id, 'Greylock', 1), (v_id, 'BoxGroup', 2), (v_id, 'Amplify', 3),
    (v_id, 'SV Angel', 4), (v_id, 'Jack Altman', 5), (v_id, 'Aaron Levie', 6);

end $$;
