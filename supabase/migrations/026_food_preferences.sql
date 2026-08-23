-- Food preferences, captured once at onboarding.
--
-- Every plan before this was written against weight, height and an allergy
-- string. That is enough to hit a calorie target and not enough to write food
-- someone will actually eat: it cannot tell a woman who cooks for a family at
-- 7am from one who carries a tiffin, or a South Indian kitchen from a Punjabi
-- one, and the generator was picking roti for both.
--
-- Typed columns rather than one JSONB blob, because the generator and the
-- Claude prompt both read specific fields and a typo in a JSONB key fails
-- silently. `extras` exists so a new question can ship before it earns a
-- column.

CREATE TABLE IF NOT EXISTS public.food_preferences (
  client_id uuid PRIMARY KEY REFERENCES public.clients(id) ON DELETE CASCADE,

  diet_type         text,          -- veg | egg | nonveg | vegan
  meals_per_day     smallint,      -- 3..6, drives the generator's slot split
  cuisines          text[]  NOT NULL DEFAULT '{}',   -- matches foods.tags verbatim
  staple            text,          -- roti | rice | both | millets
  who_cooks         text,          -- self | family | help | outside
  cook_time         text,          -- under15 | 15to30 | over30
  lunch_place       text,          -- home | tiffin | outside
  caffeine_per_day  text,          -- none | 1to2 | 3to4 | 5plus
  tablet_timing     text,          -- under30 | 30to60 | over60 | no_tablet | unsure
  avoid             text[]  NOT NULL DEFAULT '{}',
  avoid_note        text,

  extras            jsonb   NOT NULL DEFAULT '{}'::jsonb,
  updated_at        timestamptz NOT NULL DEFAULT now(),
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Bounded rather than free: 6 meals is already "I graze", and a stray 60 from a
-- fat-fingered form would quietly split a day's calories into sixty portions.
ALTER TABLE public.food_preferences DROP CONSTRAINT IF EXISTS food_preferences_meals_range;
ALTER TABLE public.food_preferences
  ADD CONSTRAINT food_preferences_meals_range
  CHECK (meals_per_day IS NULL OR (meals_per_day BETWEEN 2 AND 8));

ALTER TABLE public.food_preferences ENABLE ROW LEVEL SECURITY;

-- Same shape as health_profiles (011): hers to read and write, the coach's to
-- read across the roster.
DROP POLICY IF EXISTS fp_select_own ON public.food_preferences;
CREATE POLICY fp_select_own ON public.food_preferences
  FOR SELECT USING (auth.uid() = client_id);

DROP POLICY IF EXISTS fp_insert_own ON public.food_preferences;
CREATE POLICY fp_insert_own ON public.food_preferences
  FOR INSERT WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS fp_update_own ON public.food_preferences;
CREATE POLICY fp_update_own ON public.food_preferences
  FOR UPDATE USING (auth.uid() = client_id);

DROP POLICY IF EXISTS fp_coach_all ON public.food_preferences;
CREATE POLICY fp_coach_all ON public.food_preferences
  FOR ALL TO public
  USING (public.is_coach()) WITH CHECK (public.is_coach());

GRANT SELECT, INSERT, UPDATE ON public.food_preferences TO authenticated;

COMMENT ON TABLE public.food_preferences IS
  'One row per client. Answers are tap-only; values are stable identifiers defined in lib/plans/preferences.ts.';
