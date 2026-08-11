-- ── Foreign-key indexes ─────────────────────────────────────────────────────
-- Postgres indexes primary keys automatically but NOT the referencing side of
-- a foreign key. Every per-client read and every RLS policy check filters on
-- these columns, so without an index each one is a sequential scan.
--
-- Invisible at today's row counts; this is preventative, so the app stays fast
-- as check-ins, photos and logs accumulate per client over months.

CREATE INDEX IF NOT EXISTS progress_photos_client_idx     ON public.progress_photos (client_id);
CREATE INDEX IF NOT EXISTS meal_tracking_client_idx       ON public.meal_tracking (client_id);
CREATE INDEX IF NOT EXISTS workout_tracking_client_idx    ON public.workout_tracking (client_id);
CREATE INDEX IF NOT EXISTS testimonials_client_idx        ON public.testimonials (client_id);
CREATE INDEX IF NOT EXISTS coach_insights_client_idx      ON public.coach_insights (client_id);
CREATE INDEX IF NOT EXISTS coach_insights_coach_idx       ON public.coach_insights (coach_id);
CREATE INDEX IF NOT EXISTS viewed_comparisons_left_idx    ON public.viewed_comparisons (left_session_id);
CREATE INDEX IF NOT EXISTS viewed_comparisons_right_idx   ON public.viewed_comparisons (right_session_id);
CREATE INDEX IF NOT EXISTS exercises_created_by_idx       ON public.exercises (created_by);
CREATE INDEX IF NOT EXISTS foods_created_by_idx           ON public.foods (created_by);
CREATE INDEX IF NOT EXISTS lesson_reads_lesson_idx        ON public.lesson_reads (lesson_id);
