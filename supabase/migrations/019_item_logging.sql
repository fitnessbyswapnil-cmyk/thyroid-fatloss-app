-- ── Per-item logging ────────────────────────────────────────────────────────
-- daily_logs / meal_tracking / workout_tracking are all DAY-LEVEL summaries:
-- "workout done yes/no", "meals followed: 3". That's an adherence counter, not
-- coaching data — it can't answer "what did she actually eat?" or "is she
-- getting stronger?".
--
-- These two tables hold the per-item detail that makes real coaching possible:
-- progressive overload on the workout side, and a diet feedback loop on the
-- nutrition side.

-- One row per meal slot per day.
CREATE TABLE IF NOT EXISTS public.meal_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  date        date NOT NULL,
  meal        text NOT NULL,          -- "Breakfast" | "Lunch" | … (matches the plan's meal grouping)
  done        boolean NOT NULL DEFAULT true,
  photo_path  text,                   -- optional Blob pathname; a photo says more than a tick
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, date, meal)
);
CREATE INDEX IF NOT EXISTS meal_logs_client_date_idx ON public.meal_logs (client_id, date);

-- One row per SET performed. Set-level detail is what makes progressive
-- overload visible; a per-exercise total would hide a dropped last set.
CREATE TABLE IF NOT EXISTS public.exercise_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  date          date NOT NULL,
  exercise_name text NOT NULL,        -- denormalised: the plan may change, the log shouldn't
  exercise_id   uuid,                 -- soft link to exercises; no FK so library edits never delete history
  set_number    integer NOT NULL CHECK (set_number BETWEEN 1 AND 20),
  weight_kg     numeric(6,2),         -- null for bodyweight movements
  reps          integer CHECK (reps IS NULL OR reps BETWEEN 0 AND 200),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, date, exercise_name, set_number)
);
CREATE INDEX IF NOT EXISTS exercise_logs_client_date_idx ON public.exercise_logs (client_id, date);
CREATE INDEX IF NOT EXISTS exercise_logs_client_ex_idx ON public.exercise_logs (client_id, exercise_name);

ALTER TABLE public.meal_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;

-- Client owns her own logs; coach reads across the roster.
DROP POLICY IF EXISTS meal_logs_own ON public.meal_logs;
CREATE POLICY meal_logs_own ON public.meal_logs FOR ALL
  USING (auth.uid() = client_id) WITH CHECK (auth.uid() = client_id);
DROP POLICY IF EXISTS meal_logs_coach_read ON public.meal_logs;
CREATE POLICY meal_logs_coach_read ON public.meal_logs FOR SELECT TO public
  USING (public.is_coach());

DROP POLICY IF EXISTS exercise_logs_own ON public.exercise_logs;
CREATE POLICY exercise_logs_own ON public.exercise_logs FOR ALL
  USING (auth.uid() = client_id) WITH CHECK (auth.uid() = client_id);
DROP POLICY IF EXISTS exercise_logs_coach_read ON public.exercise_logs;
CREATE POLICY exercise_logs_coach_read ON public.exercise_logs FOR SELECT TO public
  USING (public.is_coach());
