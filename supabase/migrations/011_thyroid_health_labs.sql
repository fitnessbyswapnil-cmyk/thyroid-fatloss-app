-- ── Thyroid intake + lab tracking ───────────────────────────────────────────
-- The niche differentiator: capture each client's thyroid diagnosis/medication
-- and track their labs (TSH/T3/T4/D/B12/ferritin) over time alongside weight.

-- One health profile per client (thyroid-specific intake).
CREATE TABLE IF NOT EXISTS public.health_profiles (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         uuid NOT NULL UNIQUE REFERENCES public.clients(id) ON DELETE CASCADE,
  diagnosis         text,          -- Hypothyroid | Hashimoto's | Subclinical | Other | None
  diagnosis_year    integer,
  medication        text,          -- e.g. Levothyroxine
  medication_dose   text,          -- e.g. 50 mcg
  medication_timing text,          -- e.g. Empty stomach, 30 min before breakfast
  menopause_status  text,          -- Pre | Peri | Post | N/A
  conditions        text,          -- other conditions / PCOS / diabetes etc (freeform)
  allergies         text,
  notes             text,
  updated_at        timestamptz NOT NULL DEFAULT now(),
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Many lab results per client, dated.
CREATE TABLE IF NOT EXISTS public.lab_results (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  taken_on    date NOT NULL,
  tsh         numeric,
  t3          numeric,
  t4          numeric,
  vitamin_d   numeric,
  b12         numeric,
  ferritin    numeric,
  weight_kg   numeric,
  notes       text,
  created_by  uuid,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lab_results_client_date_idx ON public.lab_results (client_id, taken_on);

ALTER TABLE public.health_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_results     ENABLE ROW LEVEL SECURITY;

-- health_profiles: client owns their row; coach can do everything.
DROP POLICY IF EXISTS hp_select_own ON public.health_profiles;
CREATE POLICY hp_select_own ON public.health_profiles FOR SELECT USING (auth.uid() = client_id);
DROP POLICY IF EXISTS hp_insert_own ON public.health_profiles;
CREATE POLICY hp_insert_own ON public.health_profiles FOR INSERT WITH CHECK (auth.uid() = client_id);
DROP POLICY IF EXISTS hp_update_own ON public.health_profiles;
CREATE POLICY hp_update_own ON public.health_profiles FOR UPDATE USING (auth.uid() = client_id);
DROP POLICY IF EXISTS hp_coach_all ON public.health_profiles;
CREATE POLICY hp_coach_all ON public.health_profiles FOR ALL TO public
  USING (public.is_coach()) WITH CHECK (public.is_coach());

-- lab_results: same pattern.
DROP POLICY IF EXISTS lab_select_own ON public.lab_results;
CREATE POLICY lab_select_own ON public.lab_results FOR SELECT USING (auth.uid() = client_id);
DROP POLICY IF EXISTS lab_insert_own ON public.lab_results;
CREATE POLICY lab_insert_own ON public.lab_results FOR INSERT WITH CHECK (auth.uid() = client_id);
DROP POLICY IF EXISTS lab_update_own ON public.lab_results;
CREATE POLICY lab_update_own ON public.lab_results FOR UPDATE USING (auth.uid() = client_id);
DROP POLICY IF EXISTS lab_delete_own ON public.lab_results;
CREATE POLICY lab_delete_own ON public.lab_results FOR DELETE USING (auth.uid() = client_id);
DROP POLICY IF EXISTS lab_coach_all ON public.lab_results;
CREATE POLICY lab_coach_all ON public.lab_results FOR ALL TO public
  USING (public.is_coach()) WITH CHECK (public.is_coach());
