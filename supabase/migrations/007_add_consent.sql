-- Migration: 007_add_consent
-- Records when a client gave health-data consent during onboarding.
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS consent_at timestamptz;
