-- ── Plan history: what she was actually following, week by week ────────────
--
-- Plans are edited in place. One row per (client_id, type) — enforced by
-- plans_client_type_uniq since 023 — updated every time the coach revises it.
-- So when a month goes badly and she reviews why, the plan on screen is the
-- plan as it is today, not the one the client was following in week four. The
-- evidence needed to answer the question is overwritten by the act of asking it.
--
-- This table is the copy taken just before each overwrite. It is additive: the
-- plans table keeps its exact shape, every existing read path is untouched, and
-- nothing here is on the client's read path for her live plan.

CREATE TABLE IF NOT EXISTS public.plan_revisions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Nullable and ON DELETE SET NULL, not CASCADE. Deleting a plan and building
  -- a fresh one is an edit in place with extra steps — the one moment history
  -- is most worth having is exactly when cascading would destroy it.
  -- (client_id, type) is what the history is actually looked up by.
  plan_id    uuid REFERENCES public.plans(id) ON DELETE SET NULL,

  client_id  uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  type       text NOT NULL CHECK (type = ANY (ARRAY['meal'::text, 'workout'::text])),
  title      text NOT NULL,
  content    jsonb NOT NULL,
  file_path  text,

  -- The coach who saved the version that replaced this one. SET NULL rather
  -- than cascade: losing the author must not silently drop the plan.
  created_by uuid REFERENCES public.clients(id) ON DELETE SET NULL,

  -- When this version stopped being the live plan.
  created_at timestamptz NOT NULL DEFAULT now()
);

-- The only read this table has: her history of one type, newest first.
CREATE INDEX IF NOT EXISTS idx_plan_revisions_client_type
  ON public.plan_revisions (client_id, type, created_at DESC);
-- FK lead column, per the convention checked in 023 §4.
CREATE INDEX IF NOT EXISTS idx_plan_revisions_plan_id
  ON public.plan_revisions (plan_id);

ALTER TABLE public.plan_revisions ENABLE ROW LEVEL SECURITY;

-- Supabase's default privileges hand anon and authenticated ALL on anything new
-- in public, so the grants are stated rather than inherited. Two reasons:
--
--   anon      — every policy below compares auth.uid() or calls is_coach(),
--               both false for anon, so this is belt and braces; but a client's
--               plan is her medical-adjacent record and the anon key ships in
--               the browser bundle.
--   TRUNCATE  — the one privilege in that default set that does NOT go through
--               row-level security. An authenticated session holding it could
--               empty the whole history in one statement, past every policy.
REVOKE ALL ON public.plan_revisions FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plan_revisions TO authenticated;

DROP POLICY IF EXISTS plan_revisions_coach_all ON public.plan_revisions;
CREATE POLICY plan_revisions_coach_all ON public.plan_revisions FOR ALL
  TO authenticated
  USING (public.is_coach())
  WITH CHECK (public.is_coach());

-- She may read her own history and nothing else. No INSERT/UPDATE/DELETE policy
-- exists for her, so the table-level grants above are dead ends: with RLS on, a
-- write needs a policy that permits it, and there is none.
DROP POLICY IF EXISTS plan_revisions_client_read ON public.plan_revisions;
CREATE POLICY plan_revisions_client_read ON public.plan_revisions FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

COMMENT ON TABLE public.plan_revisions IS
  'The previous version of a plan, copied here by savePlan just before each change. Plans are edited in place, so without this there is no record of what the client was actually following on a given week.';
