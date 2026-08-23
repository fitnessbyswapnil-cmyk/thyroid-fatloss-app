-- ── Housekeeping: constraints the app already assumes, and one open door ────
--
-- Nothing here changes behaviour on a correct row. Each item closes a gap
-- between what the code believes about the data and what the database will
-- actually let through.

-- ── 1. One meal plan and one workout plan per client. ───────────────────────
-- savePlan looks the existing plan up with .maybeSingle() on (client_id, type),
-- and getPlansForClient does .find() over the result. A second row of the same
-- type would make the first throw and the second pick an arbitrary winner —
-- the client would see a plan silently swap under her. The app has always
-- treated this pair as unique; the database never said so.
--
-- Dedupe first, keeping the most recently touched row, so this is safe to run
-- on an environment that already drifted. (On production today: zero duplicates,
-- so the DELETE is a no-op.)
DELETE FROM public.plans p
USING public.plans newer
WHERE p.client_id = newer.client_id
  AND p.type      = newer.type
  AND p.id       <> newer.id
  AND (
        coalesce(newer.updated_at, newer.created_at, newer.assigned_at),
        newer.id
      ) > (
        coalesce(p.updated_at, p.created_at, p.assigned_at),
        p.id
      );

CREATE UNIQUE INDEX IF NOT EXISTS plans_client_type_uniq
  ON public.plans (client_id, type);

-- idx_plans_client_type covered exactly these two columns and is now redundant:
-- the unique index serves every lookup it served, and a second copy only costs
-- write time on every plan save.
DROP INDEX IF EXISTS public.idx_plans_client_type;

-- ── 2. A lab entry must carry at least one value. ───────────────────────────
-- A row with a date and nothing else still shows up in listLabs, so it lands in
-- every chart series and every delta as a gap the trend has to step over. The
-- form allows it today: submitLab posts whatever is in the fields, and an empty
-- form saves cleanly.
--
-- weight_kg counts as a value — a weigh-in with no bloodwork is a legitimate
-- entry, not an empty one. notes deliberately does not: a note with no numbers
-- has nothing for the trend to plot, and there is a reflection field for that.
--
-- NOT VALID: one pre-existing empty row (Test Client, 2026-08-22) would fail
-- this. It is not deleted here — removing a client's row is hers or the coach's
-- call, and the Health screen already has a delete button for it. New and
-- updated rows are checked from now on regardless.
ALTER TABLE public.lab_results
  DROP CONSTRAINT IF EXISTS lab_results_has_a_value;
ALTER TABLE public.lab_results
  ADD CONSTRAINT lab_results_has_a_value CHECK (
    tsh       IS NOT NULL OR
    t3        IS NOT NULL OR
    t4        IS NOT NULL OR
    vitamin_d IS NOT NULL OR
    b12       IS NOT NULL OR
    ferritin  IS NOT NULL OR
    weight_kg IS NOT NULL OR
    (extras IS NOT NULL
     AND extras <> 'null'::jsonb
     AND extras <> '[]'::jsonb
     AND extras <> '{}'::jsonb)
  ) NOT VALID;

-- ── 3. The education library was readable without signing in. ───────────────
-- Supabase's default privileges on the public schema hand anon full table
-- grants (every other table in this database still carries them), and 014 wrote
-- the read policy as USING (published OR is_coach()) with no role clause and no
-- auth.uid() test — so anyone holding the publishable anon key, which ships in
-- the browser bundle, could read every published lesson. Every other table
-- survives the same grant because its policy compares auth.uid(), which is null
-- for anon. lessons was the one that did not. That is the coach's written
-- asset, the one thing she produces once and sells access to.
--
-- Verified before revoking: every reader is behind auth — app/actions/lessons.ts
-- (used by /dashboard/learn and /dashboard/learn/[slug]), app/dashboard/page.tsx
-- and app/coach/client/[id]/page.tsx. No marketing page, no route under app/api,
-- and no build-time fetch touches lessons. The seed script uses the service role.
REVOKE ALL ON public.lessons FROM anon;

DROP POLICY IF EXISTS lessons_read ON public.lessons;
CREATE POLICY lessons_read ON public.lessons FOR SELECT
  TO authenticated
  USING (published OR public.is_coach());

-- ── 4. Foreign-key indexes: nothing missing. ────────────────────────────────
-- Checked rather than assumed — every FK column in public leads an index
-- already (001 and 015 between them cover all of them):
--
--   SELECT c.conrelid::regclass, a.attname
--     FROM pg_constraint c
--     JOIN LATERAL unnest(c.conkey) WITH ORDINALITY k(attnum, ord) ON true
--     JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
--    WHERE c.contype = 'f' AND c.connamespace = 'public'::regnamespace
--      AND k.ord = 1
--      AND NOT EXISTS (SELECT 1 FROM pg_index i
--                       WHERE i.indrelid = c.conrelid AND i.indkey[0] = k.attnum);
--   -- 0 rows
--
-- No index is added here. The remaining unindexed filters are non-FK columns on
-- tables holding tens of rows (weekly_checkins.submitted_at scanned globally by
-- the coach dashboard), where an index would cost writes and save nothing yet.

COMMENT ON CONSTRAINT lab_results_has_a_value ON public.lab_results IS
  'A lab entry with a date and no values would sit in every chart series and every delta as a hole. At least one measured value, or a weight, or an extracted extra.';
