-- ── Body measurements ───────────────────────────────────────────────────────
-- weekly_checkins already had `waist` and `hips` columns, but nothing in the
-- app ever wrote to them — every row was null, so the Waist/Hips charts on
-- Progress could never render. This adds the rest of the standard sites and
-- the check-in flow now actually collects all of them.
--
-- Why this matters for thyroid coaching specifically: the scale stalls for
-- weeks at a time, and inches lost is often the only hard evidence the plan is
-- working in month two. Without it there's nothing to show a discouraged
-- client except a flat weight line.
--
-- Stored in centimetres. Left/right sites are deliberately NOT split — halving
-- the input burden matters more than the precision when someone is measuring
-- herself at home each week.

ALTER TABLE public.weekly_checkins ADD COLUMN IF NOT EXISTS neck  numeric(5,2);
ALTER TABLE public.weekly_checkins ADD COLUMN IF NOT EXISTS chest numeric(5,2);
ALTER TABLE public.weekly_checkins ADD COLUMN IF NOT EXISTS arm   numeric(5,2);
ALTER TABLE public.weekly_checkins ADD COLUMN IF NOT EXISTS thigh numeric(5,2);
ALTER TABLE public.weekly_checkins ADD COLUMN IF NOT EXISTS calf  numeric(5,2);
