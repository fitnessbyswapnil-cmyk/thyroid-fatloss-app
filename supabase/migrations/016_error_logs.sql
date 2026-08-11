-- ── Error visibility ────────────────────────────────────────────────────────
-- The app had no error monitoring: a failure in production was invisible until
-- a client complained. Rather than add a paid APM service, unexpected server
-- errors are recorded here so they can be reviewed and counted.
--
-- Written with the service-role client (bypasses RLS) because the whole point
-- is to capture failures even when auth or a policy is what broke.

CREATE TABLE IF NOT EXISTS public.error_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  context    text NOT NULL,      -- e.g. "health.addLab"
  message    text NOT NULL,
  stack      text,
  user_id    uuid,               -- deliberately NOT an FK: never lose a log to a cascade
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS error_logs_created_idx ON public.error_logs (created_at DESC);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Only the coach/admin may read them; nothing client-side can read or write.
-- (Inserts happen via the service-role client, which bypasses RLS.)
DROP POLICY IF EXISTS error_logs_coach_read ON public.error_logs;
CREATE POLICY error_logs_coach_read ON public.error_logs FOR SELECT TO public
  USING (public.is_coach());
