-- ── Education library ───────────────────────────────────────────────────────
-- Short, thyroid-specific lessons released week by week. This is the highest
-- leverage asset a solo coach has: written once, it serves every client and
-- answers the questions that would otherwise arrive one at a time in chat.

CREATE TABLE IF NOT EXISTS public.lessons (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text NOT NULL UNIQUE,
  title         text NOT NULL,
  summary       text,
  body          text NOT NULL,          -- plain text; blank line = paragraph, "- " = bullet
  category      text,                   -- Medication | Nutrition | Training | Mindset | Labs
  week_number   integer NOT NULL DEFAULT 1,
  read_minutes  integer NOT NULL DEFAULT 2,
  published     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lessons_week_idx ON public.lessons (week_number);

-- Which lessons a client has read (drives "new lesson" state + coach insight).
CREATE TABLE IF NOT EXISTS public.lesson_reads (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  lesson_id  uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  read_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, lesson_id)
);

ALTER TABLE public.lessons      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_reads ENABLE ROW LEVEL SECURITY;

-- Lessons: everyone signed in reads published lessons; only the coach writes.
DROP POLICY IF EXISTS lessons_read ON public.lessons;
CREATE POLICY lessons_read ON public.lessons FOR SELECT
  USING (published OR public.is_coach());
DROP POLICY IF EXISTS lessons_coach_write ON public.lessons;
CREATE POLICY lessons_coach_write ON public.lessons FOR ALL TO public
  USING (public.is_coach()) WITH CHECK (public.is_coach());

-- Reads: a client owns her own rows; the coach can see them.
DROP POLICY IF EXISTS lesson_reads_own ON public.lesson_reads;
CREATE POLICY lesson_reads_own ON public.lesson_reads FOR ALL
  USING (auth.uid() = client_id) WITH CHECK (auth.uid() = client_id);
DROP POLICY IF EXISTS lesson_reads_coach ON public.lesson_reads;
CREATE POLICY lesson_reads_coach ON public.lesson_reads FOR SELECT TO public
  USING (public.is_coach());
