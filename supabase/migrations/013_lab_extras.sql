-- Full-panel lab storage: keep every test extracted from an uploaded report
-- (lipids, HbA1c, CBC, etc.), each with the reference range PRINTED on the
-- report, as [{ name, value, unit, low, high }]. Core thyroid tests continue
-- to live in their numeric columns for trend charts.
ALTER TABLE public.lab_results ADD COLUMN IF NOT EXISTS extras jsonb;
ALTER TABLE public.lab_results ADD COLUMN IF NOT EXISTS source text; -- 'manual' | 'upload'
