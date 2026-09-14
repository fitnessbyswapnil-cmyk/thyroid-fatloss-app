-- 030: lab report files, uploaded by the client and read by the coach.
--
-- Replaces in-browser OCR (pdf.js + tesseract.js). The client photographs or
-- uploads her report; the file goes to private Vercel Blob via /api/upload
-- under `${client_id}/lab-report/…`; this row records that it exists and
-- whether the coach has typed its values into lab_results yet. Values stay in
-- lab_results exactly as before — nothing there changes.

CREATE TABLE IF NOT EXISTS public.lab_reports (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  pathname     text NOT NULL,
  content_type text,
  uploaded_at  timestamptz NOT NULL DEFAULT now(),
  entered_at   timestamptz,          -- set when the coach has entered the values
  entered_by   uuid,
  CONSTRAINT lab_reports_path_is_own CHECK (pathname LIKE client_id::text || '/lab-report/%')
);

CREATE INDEX IF NOT EXISTS lab_reports_client_idx ON public.lab_reports (client_id, uploaded_at DESC);
CREATE INDEX IF NOT EXISTS lab_reports_pending_idx ON public.lab_reports (uploaded_at) WHERE entered_at IS NULL;

ALTER TABLE public.lab_reports ENABLE ROW LEVEL SECURITY;

-- Client: see and add her own reports. No update or delete — a report she
-- uploaded is part of the record the coach works from.
DROP POLICY IF EXISTS lab_reports_select_own ON public.lab_reports;
CREATE POLICY lab_reports_select_own ON public.lab_reports FOR SELECT
  USING ((select auth.uid()) = client_id);
DROP POLICY IF EXISTS lab_reports_insert_own ON public.lab_reports;
CREATE POLICY lab_reports_insert_own ON public.lab_reports FOR INSERT
  WITH CHECK ((select auth.uid()) = client_id AND entered_at IS NULL);

-- Coach: everything, including marking a report as entered.
DROP POLICY IF EXISTS lab_reports_coach_all ON public.lab_reports;
CREATE POLICY lab_reports_coach_all ON public.lab_reports FOR ALL TO public
  USING ((select public.is_coach())) WITH CHECK ((select public.is_coach()));

GRANT SELECT, INSERT ON public.lab_reports TO authenticated;
GRANT UPDATE ON public.lab_reports TO authenticated;
