-- ── Recipes on library foods ────────────────────────────────────────────────
-- Two problems, one column set:
--
-- 1. A client saw "Palak Paneer · 1 katori · 260 kcal" with no idea what went
--    into it or how to make it.
-- 2. Food macros were hand-entered estimates. Composing a dish from measured
--    ingredients gives real numbers instead.
--
-- ingredients is [{ name, grams, kcal, protein, carbs, fats, source }], where
-- source records where the per-100g values came from (e.g. "IFCT 2017") so a
-- computed dish can always be traced back.

ALTER TABLE public.foods ADD COLUMN IF NOT EXISTS recipe text;
ALTER TABLE public.foods ADD COLUMN IF NOT EXISTS ingredients jsonb;
