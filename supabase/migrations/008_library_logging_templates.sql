-- Migration: 008_library_logging_templates
-- Fittr-style upgrade foundations, single-coach model:
--   exercises      — coach-owned workout library
--   foods          — coach-owned food library (macros per portion)
--   plan_templates — reusable meal/workout plan templates
--   daily_logs     — client daily adherence log (drives real streaks)
--
-- ALL NEW tables + NEW policies only. No existing table or policy is modified.
-- Library content is embedded into plans at save time, so exercises/foods stay
-- coach-only (clients never need to read the raw library).

-- ============ exercises (workout library) ============
CREATE TABLE IF NOT EXISTS public.exercises (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  muscle_group text,          -- e.g. 'Full body', 'Legs', 'Back', 'Core'
  equipment text,             -- e.g. 'None', 'Dumbbells', 'Resistance band'
  video_url text,             -- YouTube/anything embeddable
  cues text,                  -- coaching cues / how-to
  created_by uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_exercises_name ON public.exercises (lower(name));
CREATE INDEX IF NOT EXISTS idx_exercises_muscle ON public.exercises (muscle_group);
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "exercises_coach_all" ON public.exercises;
CREATE POLICY "exercises_coach_all" ON public.exercises FOR ALL TO public
  USING (public.is_coach()) WITH CHECK (public.is_coach());

-- ============ foods (food library) ============
CREATE TABLE IF NOT EXISTS public.foods (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  portion text NOT NULL DEFAULT '1 serving',  -- human portion, e.g. '1 katori (150g)'
  calories integer,
  protein numeric(6,1),
  carbs numeric(6,1),
  fats numeric(6,1),
  is_veg boolean DEFAULT true,
  tags text,                  -- freeform: 'breakfast, thyroid-friendly, high-protein'
  created_by uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_foods_name ON public.foods (lower(name));
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "foods_coach_all" ON public.foods;
CREATE POLICY "foods_coach_all" ON public.foods FOR ALL TO public
  USING (public.is_coach()) WITH CHECK (public.is_coach());

-- ============ plan_templates (reusable plans) ============
CREATE TABLE IF NOT EXISTS public.plan_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('meal','workout')),
  title text NOT NULL,
  content jsonb NOT NULL,     -- same shape as plans.content
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_plan_templates_coach_type ON public.plan_templates (coach_id, type);
ALTER TABLE public.plan_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "templates_coach_all" ON public.plan_templates;
CREATE POLICY "templates_coach_all" ON public.plan_templates FOR ALL TO public
  USING (public.is_coach() AND coach_id = auth.uid())
  WITH CHECK (public.is_coach() AND coach_id = auth.uid());

-- ============ daily_logs (client adherence -> real streaks) ============
CREATE TABLE IF NOT EXISTS public.daily_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  workout_done boolean DEFAULT false,
  meals_followed integer DEFAULT 0 CHECK (meals_followed BETWEEN 0 AND 10),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (client_id, date)
);
CREATE INDEX IF NOT EXISTS idx_daily_logs_client_date ON public.daily_logs (client_id, date DESC);
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "logs_select_own" ON public.daily_logs;
CREATE POLICY "logs_select_own" ON public.daily_logs FOR SELECT TO public
  USING (auth.uid() = client_id);
DROP POLICY IF EXISTS "logs_insert_own" ON public.daily_logs;
CREATE POLICY "logs_insert_own" ON public.daily_logs FOR INSERT TO public
  WITH CHECK (auth.uid() = client_id);
DROP POLICY IF EXISTS "logs_update_own" ON public.daily_logs;
CREATE POLICY "logs_update_own" ON public.daily_logs FOR UPDATE TO public
  USING (auth.uid() = client_id);
DROP POLICY IF EXISTS "coaches_logs_select" ON public.daily_logs;
CREATE POLICY "coaches_logs_select" ON public.daily_logs FOR SELECT TO public
  USING (public.is_coach());
