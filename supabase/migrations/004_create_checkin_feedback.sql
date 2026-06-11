-- Create checkin_feedback table for coach reviews
CREATE TABLE IF NOT EXISTS public.checkin_feedback (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  checkin_id uuid NOT NULL REFERENCES public.weekly_checkins(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_checkin_feedback_checkin_id ON public.checkin_feedback(checkin_id);
CREATE INDEX IF NOT EXISTS idx_checkin_feedback_coach_id ON public.checkin_feedback(coach_id);

-- Enable RLS
ALTER TABLE public.checkin_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Coaches can read feedback for their clients
CREATE POLICY "Coaches can read feedback for their clients" ON public.checkin_feedback
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = coach_id 
      AND c.role = 'coach'
      AND auth.uid() = c.id
    )
    OR
    EXISTS (
      SELECT 1 FROM public.weekly_checkins wc
      JOIN public.clients c ON c.id = wc.client_id
      WHERE wc.id = checkin_id
      AND c.role = 'client'
      AND auth.uid() = c.id
    )
  );

-- RLS Policy: Coaches can insert feedback
CREATE POLICY "Coaches can insert feedback" ON public.checkin_feedback
  FOR INSERT
  WITH CHECK (
    coach_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = auth.uid() AND c.role = 'coach'
    )
  );
