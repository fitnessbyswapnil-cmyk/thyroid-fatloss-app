-- Migration: 001_initial_schema
-- Description: Creates the initial database schema with all tables and RLS policies
-- Created: 2024

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CLIENTS TABLE (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  profile_photo TEXT,
  age INTEGER,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  current_weight DECIMAL(5,2),
  target_weight DECIMAL(5,2),
  start_weight DECIMAL(5,2),
  thyroid_condition TEXT,
  medications TEXT,
  allergies TEXT,
  plan_type TEXT DEFAULT 'standard' CHECK (plan_type IN ('standard', 'premium', 'elite')),
  start_date DATE DEFAULT CURRENT_DATE,
  renewal_date DATE,
  coach_notes TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'paused', 'cancelled', 'expired')),
  role TEXT DEFAULT 'client' CHECK (role IN ('client', 'coach', 'admin')),
  streak_current INTEGER DEFAULT 0,
  streak_best INTEGER DEFAULT 0,
  recovery_score INTEGER DEFAULT 0,
  wellness_score INTEGER DEFAULT 0,
  tsh_before DECIMAL(5,2),
  tsh_current DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clients - DEFAULT DENY + ALLOW SPECIFIC
CREATE POLICY "clients_select_own" ON public.clients FOR SELECT USING (auth.uid() = id);
CREATE POLICY "clients_insert_own" ON public.clients FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "clients_update_own" ON public.clients FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "clients_delete_own" ON public.clients FOR DELETE USING (auth.uid() = id);

-- Coaches/Admins can see all clients
CREATE POLICY "coaches_select_all" ON public.clients FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.id = auth.uid() AND c.role IN ('coach', 'admin')
    )
  );

CREATE POLICY "coaches_update_all" ON public.clients FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.id = auth.uid() AND c.role IN ('coach', 'admin')
    )
  );

-- WEEKLY CHECKINS TABLE
CREATE TABLE IF NOT EXISTS public.weekly_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  weight DECIMAL(5,2),
  waist DECIMAL(5,2),
  hips DECIMAL(5,2),
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 10),
  sleep_score INTEGER CHECK (sleep_score BETWEEN 1 AND 10),
  stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 10),
  digestion_score INTEGER CHECK (digestion_score BETWEEN 1 AND 10),
  mood INTEGER CHECK (mood BETWEEN 1 AND 10),
  adherence_score INTEGER CHECK (adherence_score BETWEEN 0 AND 100),
  steps INTEGER,
  workouts_completed INTEGER DEFAULT 0,
  notes TEXT,
  coach_feedback TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on weekly_checkins
ALTER TABLE public.weekly_checkins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for weekly_checkins - DEFAULT DENY + ALLOW SPECIFIC
CREATE POLICY "checkins_select_own" ON public.weekly_checkins FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "checkins_insert_own" ON public.weekly_checkins FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "checkins_update_own" ON public.weekly_checkins FOR UPDATE USING (auth.uid() = client_id);
CREATE POLICY "checkins_delete_own" ON public.weekly_checkins FOR DELETE USING (auth.uid() = client_id);

-- Coaches can see all checkins
CREATE POLICY "coaches_checkins_select" ON public.weekly_checkins FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.id = auth.uid() AND c.role IN ('coach', 'admin')
    )
  );

CREATE POLICY "coaches_checkins_update" ON public.weekly_checkins FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.id = auth.uid() AND c.role IN ('coach', 'admin')
    )
  );

-- PROGRESS PHOTOS TABLE
CREATE TABLE IF NOT EXISTS public.progress_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  front_photo TEXT,
  side_photo TEXT,
  back_photo TEXT,
  week_number INTEGER,
  notes TEXT,
  upload_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on progress_photos
ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for progress_photos - DEFAULT DENY + ALLOW SPECIFIC
CREATE POLICY "photos_select_own" ON public.progress_photos FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "photos_insert_own" ON public.progress_photos FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "photos_update_own" ON public.progress_photos FOR UPDATE USING (auth.uid() = client_id);
CREATE POLICY "photos_delete_own" ON public.progress_photos FOR DELETE USING (auth.uid() = client_id);

-- Coaches can see all photos
CREATE POLICY "coaches_photos_select" ON public.progress_photos FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.id = auth.uid() AND c.role IN ('coach', 'admin')
    )
  );

-- COACH INSIGHTS TABLE (for coach messages to clients)
CREATE TABLE IF NOT EXISTS public.coach_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  insight TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on coach_insights
ALTER TABLE public.coach_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for coach_insights - DEFAULT DENY + ALLOW SPECIFIC
CREATE POLICY "insights_select_own" ON public.coach_insights FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "insights_update_read" ON public.coach_insights FOR UPDATE USING (auth.uid() = client_id);

-- Coaches can insert insights for any client
CREATE POLICY "coaches_insights_insert" ON public.coach_insights FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.id = auth.uid() AND c.role IN ('coach', 'admin')
    )
  );

-- Coaches can see all insights
CREATE POLICY "coaches_insights_select" ON public.coach_insights FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.id = auth.uid() AND c.role IN ('coach', 'admin')
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to clients table
DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
