-- Migration: 009_exercise_demo_images
-- Adds demonstration image columns to the exercise library. Two frames per
-- exercise (start + end position) that the UI alternates to create a looping
-- animated demo. Images are public-domain (Free Exercise DB) served via CDN.
--
-- No RLS change: exercises stays coach-only (exercises_coach_all). Clients never
-- read this table — plan items embed the image URLs into the plan's content jsonb
-- at save time, and clients read those through their own plans.

ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS image_start text;
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS image_end   text;
