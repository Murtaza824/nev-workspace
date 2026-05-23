-- ============================================================
-- Phase 5: Cofounder cluster detection trigger
--
-- Fires AFTER INSERT on sourcing_signals when signal_type = 'stealth_entry'.
-- Finds other stealth_entry signals in the last 60d whose person shares
-- at least one prior_company with the newly inserted person.
-- Creates or extends a sourcing_clusters row and links both signals.
-- Re-scores the matched signal so its cluster component updates.
--
-- Named with "z_" prefix so it fires after sourcing_signals_score_on_insert,
-- which means the new signal is already scored when we re-score the older one.
-- ============================================================

create or replace function public.sourcing_detect_cofounder_cluster()
returns trigger
language plpgsql
as $$
declare
  v_prior_companies text[];
  v_match           record;
  v_cluster_id      uuid;
  v_min_at          timestamptz;
  v_max_at          timestamptz;
  v_new_at          timestamptz;
begin
  -- Defensive: should be filtered by the WHEN clause, but guard anyway
  if new.signal_type != 'stealth_entry' or new.person_id is null then
    return null;
  end if;

  -- Get this person's prior_companies
  select prior_companies
  into v_prior_companies
  from public.sourcing_people
  where id = new.person_id;

  if v_prior_companies is null or array_length(v_prior_companies, 1) is null then
    return null;
  end if;

  v_new_at := coalesce(new.event_at, new.detected_at);

  -- Find a stealth_entry signal from a different person with overlapping
  -- prior_companies within 60 days. Prefer matches already in a cluster
  -- (handles the 3+ person edge case by joining the existing cluster).
  select
    ss.id          as signal_id,
    ss.person_id   as person_id,
    ss.cluster_id  as cluster_id,
    coalesce(ss.event_at, ss.detected_at) as signal_at
  into v_match
  from public.sourcing_signals   ss
  join public.sourcing_people    sp on sp.id = ss.person_id
  where ss.signal_type = 'stealth_entry'
    and ss.person_id   != new.person_id
    and ss.status not in ('passed', 'snoozed')
    and sp.prior_companies && v_prior_companies
    and coalesce(ss.event_at, ss.detected_at) >= v_new_at - interval '60 days'
  order by ss.cluster_id nulls last, ss.detected_at desc
  limit 1;

  if not found then
    return null;
  end if;

  v_min_at := least(v_new_at, v_match.signal_at);
  v_max_at := greatest(v_new_at, v_match.signal_at);

  if v_match.cluster_id is not null then
    -- Join the existing cluster (3+ person case)
    v_cluster_id := v_match.cluster_id;
    update public.sourcing_clusters
    set signal_count      = signal_count + 1,
        latest_signal_at  = greatest(latest_signal_at, v_max_at)
    where id = v_cluster_id;
  else
    -- Create a new cofounder_pair cluster
    insert into public.sourcing_clusters (
      cluster_type,
      primary_entity_type,
      primary_entity_id,
      signal_count,
      earliest_signal_at,
      latest_signal_at
    ) values (
      'cofounder_pair',
      'person',
      new.person_id,
      2,
      v_min_at,
      v_max_at
    ) returning id into v_cluster_id;

    -- Link the older matched signal
    update public.sourcing_signals
    set cluster_id = v_cluster_id
    where id = v_match.signal_id;
  end if;

  -- Link the new signal
  update public.sourcing_signals
  set cluster_id = v_cluster_id
  where id = new.id;

  -- Re-score all signals in this cluster so the cluster component is reflected.
  -- sourcing_score_signal is STABLE so calling it from a VOLATILE trigger is fine.
  update public.sourcing_signals ss
  set score           = (public.sourcing_score_signal(ss.id, ss.detected_at)->>'score')::int,
      score_breakdown = public.sourcing_score_signal(ss.id, ss.detected_at)->'breakdown'
  where ss.cluster_id = v_cluster_id;

  return null;
end;
$$;


-- Trigger: fires after insert, filtered to stealth_entry with a person.
-- "z_" prefix ensures alphabetical ordering puts this after
-- sourcing_signals_score_on_insert.

drop trigger if exists sourcing_signals_z_cluster_detect on public.sourcing_signals;

create trigger sourcing_signals_z_cluster_detect
  after insert on public.sourcing_signals
  for each row
  when (new.signal_type = 'stealth_entry' and new.person_id is not null)
  execute function public.sourcing_detect_cofounder_cluster();
