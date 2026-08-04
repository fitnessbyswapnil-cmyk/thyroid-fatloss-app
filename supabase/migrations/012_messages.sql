-- ── In-app coach ↔ client messaging ─────────────────────────────────────────
-- One thread per client (client ↔ their coach). from_coach marks the sender side.
CREATE TABLE IF NOT EXISTS public.messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  sender_id   uuid NOT NULL,
  from_coach  boolean NOT NULL DEFAULT false,
  body        text NOT NULL,
  read_by_client boolean NOT NULL DEFAULT false,
  read_by_coach  boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_client_time_idx ON public.messages (client_id, created_at);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Client sees & posts in their own thread; coach sees & posts in any thread.
DROP POLICY IF EXISTS msg_select ON public.messages;
CREATE POLICY msg_select ON public.messages FOR SELECT
  USING (auth.uid() = client_id OR public.is_coach());

DROP POLICY IF EXISTS msg_insert ON public.messages;
CREATE POLICY msg_insert ON public.messages FOR INSERT
  WITH CHECK ((auth.uid() = client_id AND from_coach = false) OR public.is_coach());

-- Allow marking messages read (update) by either side of the thread.
DROP POLICY IF EXISTS msg_update ON public.messages;
CREATE POLICY msg_update ON public.messages FOR UPDATE
  USING (auth.uid() = client_id OR public.is_coach());
