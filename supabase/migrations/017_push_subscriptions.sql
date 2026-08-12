-- ── Web push subscriptions ──────────────────────────────────────────────────
-- Adherence was the biggest gap in the app: everything (streaks, check-ins,
-- lessons, coach replies) was invisible until a client happened to open it.
-- Web Push is the free channel that fixes this — no per-message cost, works in
-- the Android app and in the installed iPhone PWA.
--
-- One row per device: a client with a phone and a laptop legitimately has two.

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  endpoint    text NOT NULL UNIQUE,   -- push service URL; unique per device
  p256dh      text NOT NULL,          -- client public key for payload encryption
  auth        text NOT NULL,          -- client auth secret
  created_at  timestamptz NOT NULL DEFAULT now(),
  last_sent_at timestamptz
);
CREATE INDEX IF NOT EXISTS push_subs_client_idx ON public.push_subscriptions (client_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- A client manages only her own device subscriptions; the coach may read
-- (to see who is reachable) but never write on someone's behalf.
DROP POLICY IF EXISTS push_subs_own ON public.push_subscriptions;
CREATE POLICY push_subs_own ON public.push_subscriptions FOR ALL
  USING (auth.uid() = client_id) WITH CHECK (auth.uid() = client_id);
DROP POLICY IF EXISTS push_subs_coach_read ON public.push_subscriptions;
CREATE POLICY push_subs_coach_read ON public.push_subscriptions FOR SELECT TO public
  USING (public.is_coach());

-- Idempotency ledger: prevents the daily cron from sending the same nudge
-- twice if it retries or is invoked manually.
CREATE TABLE IF NOT EXISTS public.reminder_sends (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  kind       text NOT NULL,          -- 'checkin_due' | 'coach_reply' | 'lesson'
  sent_on    date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, kind, sent_on)
);

ALTER TABLE public.reminder_sends ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS reminder_sends_coach_read ON public.reminder_sends;
CREATE POLICY reminder_sends_coach_read ON public.reminder_sends FOR SELECT TO public
  USING (public.is_coach());
