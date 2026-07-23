-- Animated demo support: a single looping GIF/MP4 URL per exercise.
-- Takes priority over the two-photo (image_start/image_end) crossfade, which
-- stays as an automatic fallback so a demo always renders.
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS demo_url text;
