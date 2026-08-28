-- ── The walk was untracked ──────────────────────────────────────────────────
-- The daily plan is three things: eat to plan, do the session, walk 30 minutes.
-- daily_logs could record the first two and had nowhere to put the third, so
-- the single item the fat-loss maths leans on hardest was the one the coach
-- could not see.
ALTER TABLE public.daily_logs ADD COLUMN IF NOT EXISTS walk_done boolean NOT NULL DEFAULT false;

-- One row per client per day. Without this the upsert races: two taps landing
-- together both miss the SELECT and both INSERT, and the day silently splits
-- across two rows that each hold half the answer.
CREATE UNIQUE INDEX IF NOT EXISTS daily_logs_client_date_uniq
  ON public.daily_logs (client_id, date);

-- The coach reads these newest-first per client on every client page.
CREATE INDEX IF NOT EXISTS daily_logs_client_date_desc
  ON public.daily_logs (client_id, date DESC);
