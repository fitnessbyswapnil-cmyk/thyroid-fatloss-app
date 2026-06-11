-- Migration: 006_fix_rls_recursion_and_protect_tables
--
-- Part 1 — fix the infinite-recursion in coach policies.
-- Coach policies checked the caller's role with
--   EXISTS (SELECT 1 FROM clients WHERE id = auth.uid() AND role IN ('coach','admin'))
-- Evaluated on tables whose policies re-query `clients` (itself carrying the same
-- self-referential policy), Postgres throws
--   "infinite recursion detected in policy for relation clients"
-- breaking ALL authenticated reads. Move the role lookup into a SECURITY DEFINER
-- function: it runs as the owner (BYPASSRLS), so the inner SELECT on clients does
-- NOT re-trigger RLS. auth.uid() still scopes the check to the caller.
--
-- Part 2 — enable RLS + owner/coach policies on three tables that were left
-- world-readable (RLS disabled): checkin_feedback, email_reminders,
-- viewed_comparisons.

-- ============================================================
-- Part 1: is_coach() helper + de-recursed coach policies
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_coach()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.clients
    WHERE id = auth.uid() AND role IN ('coach', 'admin')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_coach() TO authenticated, anon, service_role;

-- clients (root of the recursion)
DROP POLICY IF EXISTS "coaches_select_all" ON public.clients;
CREATE POLICY "coaches_select_all" ON public.clients FOR SELECT TO public
  USING (public.is_coach());
DROP POLICY IF EXISTS "coaches_update_all" ON public.clients;
CREATE POLICY "coaches_update_all" ON public.clients FOR UPDATE TO public
  USING (public.is_coach());

-- weekly_checkins
DROP POLICY IF EXISTS "coaches_checkins_select" ON public.weekly_checkins;
CREATE POLICY "coaches_checkins_select" ON public.weekly_checkins FOR SELECT TO public
  USING (public.is_coach());
DROP POLICY IF EXISTS "coaches_checkins_update" ON public.weekly_checkins;
CREATE POLICY "coaches_checkins_update" ON public.weekly_checkins FOR UPDATE TO public
  USING (public.is_coach());

-- progress_photos
DROP POLICY IF EXISTS "coaches_photos_select" ON public.progress_photos;
CREATE POLICY "coaches_photos_select" ON public.progress_photos FOR SELECT TO public
  USING (public.is_coach());

-- coach_insights
DROP POLICY IF EXISTS "coaches_insights_select" ON public.coach_insights;
CREATE POLICY "coaches_insights_select" ON public.coach_insights FOR SELECT TO public
  USING (public.is_coach());
DROP POLICY IF EXISTS "coaches_insights_insert" ON public.coach_insights;
CREATE POLICY "coaches_insights_insert" ON public.coach_insights FOR INSERT TO public
  WITH CHECK (public.is_coach());

-- daily_habits
DROP POLICY IF EXISTS "coaches_habits_select" ON public.daily_habits;
CREATE POLICY "coaches_habits_select" ON public.daily_habits FOR SELECT TO public
  USING (public.is_coach());

-- meal_tracking
DROP POLICY IF EXISTS "coaches_meals_select" ON public.meal_tracking;
CREATE POLICY "coaches_meals_select" ON public.meal_tracking FOR SELECT TO public
  USING (public.is_coach());

-- workout_tracking
DROP POLICY IF EXISTS "coaches_workouts_select" ON public.workout_tracking;
CREATE POLICY "coaches_workouts_select" ON public.workout_tracking FOR SELECT TO public
  USING (public.is_coach());

-- testimonials
DROP POLICY IF EXISTS "coaches_testimonials_all" ON public.testimonials;
CREATE POLICY "coaches_testimonials_all" ON public.testimonials FOR ALL TO public
  USING (public.is_coach());

-- plans (coach checks also referenced clients; normalize to is_coach()).
-- is_coach() also covers 'admin' — intentional for this single-coach setup.
DROP POLICY IF EXISTS "coaches_insert_plans" ON public.plans;
CREATE POLICY "coaches_insert_plans" ON public.plans FOR INSERT TO public
  WITH CHECK ((coach_id = auth.uid()) AND public.is_coach());
DROP POLICY IF EXISTS "coaches_select_client_plans" ON public.plans;
CREATE POLICY "coaches_select_client_plans" ON public.plans FOR SELECT TO public
  USING ((coach_id = auth.uid()) OR public.is_coach());

-- ============================================================
-- Part 2: protect the three world-readable tables
-- ============================================================

-- checkin_feedback: coach (author) full access; client may read feedback on
-- their OWN check-ins. (Writes are coach-only.)
ALTER TABLE public.checkin_feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "feedback_select_own_client" ON public.checkin_feedback;
CREATE POLICY "feedback_select_own_client" ON public.checkin_feedback FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM public.weekly_checkins wc
    WHERE wc.id = checkin_feedback.checkin_id AND wc.client_id = auth.uid()
  ));
DROP POLICY IF EXISTS "coaches_feedback_select" ON public.checkin_feedback;
CREATE POLICY "coaches_feedback_select" ON public.checkin_feedback FOR SELECT TO public
  USING (public.is_coach());
DROP POLICY IF EXISTS "coaches_feedback_insert" ON public.checkin_feedback;
CREATE POLICY "coaches_feedback_insert" ON public.checkin_feedback FOR INSERT TO public
  WITH CHECK ((coach_id = auth.uid()) AND public.is_coach());
DROP POLICY IF EXISTS "coaches_feedback_update" ON public.checkin_feedback;
CREATE POLICY "coaches_feedback_update" ON public.checkin_feedback FOR UPDATE TO public
  USING ((coach_id = auth.uid()) AND public.is_coach())
  WITH CHECK (coach_id = auth.uid());
DROP POLICY IF EXISTS "coaches_feedback_delete" ON public.checkin_feedback;
CREATE POLICY "coaches_feedback_delete" ON public.checkin_feedback FOR DELETE TO public
  USING ((coach_id = auth.uid()) AND public.is_coach());

-- email_reminders: client reads own; coach reads all. Writes are server-side
-- (service_role bypasses RLS), so no authenticated write policy is granted.
ALTER TABLE public.email_reminders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reminders_select_own" ON public.email_reminders;
CREATE POLICY "reminders_select_own" ON public.email_reminders FOR SELECT TO public
  USING (auth.uid() = client_id);
DROP POLICY IF EXISTS "coaches_reminders_select" ON public.email_reminders;
CREATE POLICY "coaches_reminders_select" ON public.email_reminders FOR SELECT TO public
  USING (public.is_coach());

-- viewed_comparisons: owner full access; coach reads all.
ALTER TABLE public.viewed_comparisons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "viewed_select_own" ON public.viewed_comparisons;
CREATE POLICY "viewed_select_own" ON public.viewed_comparisons FOR SELECT TO public
  USING (auth.uid() = client_id);
DROP POLICY IF EXISTS "viewed_insert_own" ON public.viewed_comparisons;
CREATE POLICY "viewed_insert_own" ON public.viewed_comparisons FOR INSERT TO public
  WITH CHECK (auth.uid() = client_id);
DROP POLICY IF EXISTS "viewed_update_own" ON public.viewed_comparisons;
CREATE POLICY "viewed_update_own" ON public.viewed_comparisons FOR UPDATE TO public
  USING (auth.uid() = client_id);
DROP POLICY IF EXISTS "coaches_viewed_select" ON public.viewed_comparisons;
CREATE POLICY "coaches_viewed_select" ON public.viewed_comparisons FOR SELECT TO public
  USING (public.is_coach());
