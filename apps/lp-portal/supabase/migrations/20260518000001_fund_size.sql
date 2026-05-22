-- Add target fund size as the denominator for LP ownership calculations
alter table public.fund add column if not exists fund_size numeric;

-- Set Fund I target size to $5M
update public.fund set fund_size = 5000000;
