-- ── Let a client's own device report an error ───────────────────────────────
-- error_logs was write-only from the server and readable by the coach, so a
-- fault that happens in the browser — the ones that make a screen "do nothing"
-- — left no trace anywhere the coach could see. A client can now insert rows
-- about herself and nobody else, and still cannot read the table.
DROP POLICY IF EXISTS error_logs_insert_own ON public.error_logs;
CREATE POLICY error_logs_insert_own ON public.error_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE INDEX IF NOT EXISTS error_logs_created_desc ON public.error_logs (created_at DESC);
