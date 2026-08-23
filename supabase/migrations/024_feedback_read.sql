-- ── The weekly review is the deliverable, and it landed silently ───────────
--
-- checkin_feedback carries the one thing a 1:1 client is paying for: the note
-- her coach wrote about her week. Nothing recorded whether she ever opened it,
-- so the coach had no way to tell a client who read every word from one who
-- stopped looking — the two are the same row to him today.
--
-- read_at is that receipt. It is written by HER, from her own session, when the
-- note is on her screen.

ALTER TABLE public.checkin_feedback
  ADD COLUMN IF NOT EXISTS read_at timestamptz;

COMMENT ON COLUMN public.checkin_feedback.read_at IS
  'When the owning client first had this review on screen. Stamped once by her own session; the coach never writes it.';

-- ── The write she needs, and nothing more ──────────────────────────────────
--
-- 006 gave the client SELECT on feedback for her own check-ins and no write at
-- all. A plain UPDATE policy would hand her the whole row: a policy says which
-- rows may be touched, never which columns, and `authenticated` holds
-- table-level UPDATE on this table — so she could rewrite the body of her
-- coach's review and it would still read as his words. That is the same hole
-- 022 §3 closed on messages, and it is closed the same way here: revoke the
-- blanket grant, name the columns, and freeze the rest in a trigger, because
-- coach and client are both `authenticated` and grants cannot tell them apart.

REVOKE UPDATE ON public.checkin_feedback FROM authenticated, anon;
GRANT UPDATE (body, coach_id, updated_at, read_at)
  ON public.checkin_feedback TO authenticated;

CREATE OR REPLACE FUNCTION public.freeze_feedback_for_client()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- The service role has no auth.uid(); the coach owns the text.
  IF auth.uid() IS NULL OR public.is_coach() THEN
    RETURN new;
  END IF;

  new.body       := old.body;
  new.coach_id   := old.coach_id;
  new.checkin_id := old.checkin_id;
  new.created_at := old.created_at;
  new.updated_at := old.updated_at;

  -- Once. A second stamp would move the receipt to whenever she last opened
  -- the dashboard, which is not the answer the coach is looking for.
  new.read_at    := coalesce(old.read_at, new.read_at);

  RETURN new;
END;
$$;

COMMENT ON FUNCTION public.freeze_feedback_for_client IS
  'A client may stamp read_at on a review of her own check-in, once. The body stays her coach''s words. The coach and the service role pass through.';

DROP TRIGGER IF EXISTS trg_freeze_feedback_for_client ON public.checkin_feedback;
CREATE TRIGGER trg_freeze_feedback_for_client
  BEFORE UPDATE ON public.checkin_feedback
  FOR EACH ROW EXECUTE FUNCTION public.freeze_feedback_for_client();

-- Row access mirrors the existing read policy exactly: her own check-ins only.
DROP POLICY IF EXISTS "feedback_update_read_own_client" ON public.checkin_feedback;
CREATE POLICY "feedback_update_read_own_client" ON public.checkin_feedback
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.weekly_checkins wc
    WHERE wc.id = checkin_feedback.checkin_id AND wc.client_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.weekly_checkins wc
    WHERE wc.id = checkin_feedback.checkin_id AND wc.client_id = auth.uid()
  ));
