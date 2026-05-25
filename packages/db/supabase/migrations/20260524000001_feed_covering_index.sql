-- Covering index for the filter-count query on the feed page:
--   SELECT signal_type FROM sourcing_signals WHERE status IN (...)
-- Without this, Postgres uses (status, score) to find rows then heap-fetches signal_type.
-- With this, the query is an index-only scan.

create index if not exists sourcing_signals_status_type_idx
  on public.sourcing_signals (status, signal_type);
