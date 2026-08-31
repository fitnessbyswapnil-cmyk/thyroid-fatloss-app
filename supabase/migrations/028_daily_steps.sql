-- ── Steps on the daily log ──────────────────────────────────────────────────
-- The daily plan is three things: eat to plan, do the session, move. Steps were
-- only captured once a week in the check-in, which is too coarse to coach from
-- and asks her to remember six days back.
--
-- Nullable on purpose: a null means she did not answer, which is different from
-- a tapped "under 2,000". The coach strip must be able to tell those apart.
ALTER TABLE public.daily_logs ADD COLUMN IF NOT EXISTS steps integer;

ALTER TABLE public.daily_logs
  DROP CONSTRAINT IF EXISTS daily_logs_steps_sane;
ALTER TABLE public.daily_logs
  ADD CONSTRAINT daily_logs_steps_sane CHECK (steps IS NULL OR (steps >= 0 AND steps <= 100000));
