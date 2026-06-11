-- Migration: 003_enhance_weekly_checkins
-- Description: Adds missing columns to weekly_checkins table:
-- bloating, cravings, meds_taken, meds_target, workouts_target, 
-- symptoms (JSONB), reflection_text, sleep_quality, status
-- Created: 2024

-- Add missing columns to weekly_checkins
ALTER TABLE public.weekly_checkins
ADD COLUMN IF NOT EXISTS bloating INTEGER CHECK (bloating BETWEEN 1 AND 10),
ADD COLUMN IF NOT EXISTS cravings INTEGER CHECK (cravings BETWEEN 1 AND 10),
ADD COLUMN IF NOT EXISTS meds_taken INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS meds_target INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS workouts_target INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 10),
ADD COLUMN IF NOT EXISTS symptoms JSONB,
ADD COLUMN IF NOT EXISTS reflection_text TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'reviewed'));

-- Add index on client_id and week_number for faster queries
CREATE INDEX IF NOT EXISTS idx_weekly_checkins_client_week 
  ON public.weekly_checkins(client_id, week_number DESC);
