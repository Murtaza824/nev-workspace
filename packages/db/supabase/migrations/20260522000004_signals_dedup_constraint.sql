-- Replace the partial unique index on sourcing_signals with a full unique constraint.
-- PostgREST's on_conflict parameter requires a real unique constraint (not a partial index).
-- NULL values are treated as distinct in unique constraints, so rows without person_id
-- or event_at still cannot conflict with each other via NULL equality.

drop index if exists public.sourcing_signals_dedup_idx;

alter table public.sourcing_signals
  add constraint sourcing_signals_dedup_uniq
  unique (person_id, signal_type, event_at);
