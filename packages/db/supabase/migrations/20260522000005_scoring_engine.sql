-- ============================================================
-- Phase 3: scoring engine
-- sourcing_score_signal() → pure stable function, no side effects, no now()
-- sourcing_apply_score()  → trigger function that writes score + breakdown
-- Back-fill all existing signals at migration time.
-- ============================================================

-- ── 1. Pure scoring function ──────────────────────────────────
-- stable: reads DB, no writes, same inputs → same output.
-- p_as_of defaults to the signal's own detected_at so repeated calls are deterministic.

create or replace function public.sourcing_score_signal(
  p_signal_id uuid,
  p_as_of     timestamptz default null
) returns jsonb
language plpgsql
stable
as $$
declare
  v_signal_type    text;
  v_person_id      uuid;
  v_detected_at    timestamptz;
  v_event_at       timestamptz;
  v_seniority_tier text;
  v_tier_1_alum    boolean;
  v_prior_companies text[];

  v_ref_time        timestamptz;
  v_days            int;
  v_recency         int;
  v_density_count   int;
  v_density         int;
  v_cluster         int;
  v_seniority       int;
  v_tier            int;
  v_total           int;
begin
  select
    s.signal_type,
    s.person_id,
    s.detected_at,
    s.event_at,
    p.seniority_tier,
    p.tier_1_alum,
    p.prior_companies
  into
    v_signal_type,
    v_person_id,
    v_detected_at,
    v_event_at,
    v_seniority_tier,
    v_tier_1_alum,
    v_prior_companies
  from public.sourcing_signals s
  left join public.sourcing_people p on p.id = s.person_id
  where s.id = p_signal_id;

  if not found then return null; end if;

  -- Reference timestamp: caller-supplied or detected_at (never now())
  v_ref_time := coalesce(p_as_of, v_detected_at);

  -- ── Recency (0–30) ───────────────────────────────────────
  -- event_at is when the underlying event happened; fall back to detected_at
  v_days := (v_ref_time::date - coalesce(v_event_at, v_detected_at)::date);
  v_recency := case
    when v_days <= 7  then 30
    when v_days <= 14 then 20
    when v_days <= 30 then 10
    else 0
  end;

  -- ── Signal density (0–30) ────────────────────────────────
  -- Count distinct signals for this person within 60d of ref_time
  if v_person_id is not null then
    select count(*)::int
    into v_density_count
    from public.sourcing_signals
    where person_id = v_person_id
      and coalesce(event_at, detected_at) >= v_ref_time - interval '60 days'
      and coalesce(event_at, detected_at) <= v_ref_time;
  else
    v_density_count := 1;  -- signal itself
  end if;

  v_density := case
    when v_density_count >= 3 then 30
    when v_density_count = 2  then 20
    else 10
  end;

  -- ── Cofounder cluster (0–15) ─────────────────────────────
  -- Only stealth_entry signals qualify on both sides (PRD step 1–3)
  v_cluster := 0;
  if v_signal_type = 'stealth_entry'
     and v_person_id is not null
     and v_prior_companies is not null
     and array_length(v_prior_companies, 1) > 0
  then
    if exists (
      select 1
      from public.sourcing_signals s2
      join public.sourcing_people p2 on p2.id = s2.person_id
      where s2.person_id != v_person_id
        and s2.signal_type = 'stealth_entry'
        and p2.tier_1_alum = true
        and p2.prior_companies && v_prior_companies
        and coalesce(s2.event_at, s2.detected_at) >= v_ref_time - interval '60 days'
        and coalesce(s2.event_at, s2.detected_at) <= v_ref_time
    ) then
      v_cluster := 15;
    end if;
  end if;

  -- ── Seniority (0–15) ─────────────────────────────────────
  v_seniority := case v_seniority_tier
    when 'founder' then 15
    when 'vp'      then 12
    when 'staff'   then 10
    when 'senior'  then 5
    when 'ic'      then 2
    else 0
  end;

  -- ── Prior company tier (0–10) ────────────────────────────
  v_tier := case when v_tier_1_alum = true then 10 else 0 end;

  v_total := least(v_recency + v_density + v_cluster + v_seniority + v_tier, 100);

  return jsonb_build_object(
    'score', v_total,
    'breakdown', jsonb_build_object(
      'recency',   v_recency,
      'density',   v_density,
      'cluster',   v_cluster,
      'seniority', v_seniority,
      'tier',      v_tier
    )
  );
end;
$$;


-- ── 2. Trigger function (volatile — writes score + breakdown) ─

create or replace function public.sourcing_apply_score()
returns trigger
language plpgsql
as $$
declare
  v_result jsonb;
begin
  v_result := public.sourcing_score_signal(new.id, new.detected_at);
  if v_result is not null then
    update public.sourcing_signals
    set score          = (v_result->>'score')::int,
        score_breakdown = v_result->'breakdown'
    where id = new.id;
  end if;
  return null;  -- ignored for AFTER triggers
end;
$$;


-- ── 3. AFTER INSERT trigger (idempotent: drop + create) ───────
-- AFTER insert so the row is in the table when density is counted.

drop trigger if exists sourcing_signals_score_on_insert on public.sourcing_signals;

create trigger sourcing_signals_score_on_insert
  after insert on public.sourcing_signals
  for each row
  execute function public.sourcing_apply_score();


-- ── 4. Back-fill existing signals ────────────────────────────
-- Uses detected_at as the reference timestamp to keep scoring deterministic.

update public.sourcing_signals ss
set
  score           = (x.result->>'score')::int,
  score_breakdown = x.result->'breakdown'
from (
  select id, detected_at, public.sourcing_score_signal(id, detected_at) as result
  from public.sourcing_signals
  where score is null
) x
where ss.id = x.id;
