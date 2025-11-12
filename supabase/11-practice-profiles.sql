-- ============================================================
-- PRACTICE PROFILES TABLE
-- ============================================================
-- Migration: Add practice profile questionnaire data
-- ============================================================

-- Create practice_profiles table
CREATE TABLE IF NOT EXISTS public.practice_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,

  -- Practice Information
  practice_type VARCHAR(50), -- 'independent', 'chain', 'medical_practice', 'other'
  practice_specialty VARCHAR(100), -- 'optometry', 'ophthalmology', 'both'
  years_in_business INTEGER,
  patient_volume_range VARCHAR(50), -- '0-100', '100-500', '500-1000', '1000+'

  -- Brand & Product Preferences
  current_brands JSONB DEFAULT '[]'::jsonb, -- Array of brand names
  average_frame_price_range VARCHAR(50), -- 'under_100', '100_200', '200_300', '300_plus'

  -- Preferences & Goals
  primary_goals JSONB DEFAULT '[]'::jsonb, -- Array like ['increase_profit', 'track_inventory', 'compare_vendors']

  -- Metadata
  completed_at TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT practice_profiles_account_id_unique UNIQUE(account_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_practice_profiles_account_id ON public.practice_profiles(account_id);
CREATE INDEX IF NOT EXISTS idx_practice_profiles_is_completed ON public.practice_profiles(is_completed);

-- Add comments for documentation
COMMENT ON TABLE public.practice_profiles IS 'Stores practice profile questionnaire responses for personalization';
COMMENT ON COLUMN public.practice_profiles.practice_type IS 'Type of practice: independent, chain, medical_practice, other';
COMMENT ON COLUMN public.practice_profiles.current_brands IS 'JSONB array of brand names currently stocked';
COMMENT ON COLUMN public.practice_profiles.primary_goals IS 'JSONB array of user goals: increase_profit, track_inventory, etc.';

-- Add questionnaire tracking columns to accounts table
ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS questionnaire_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS questionnaire_skipped BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS questionnaire_last_prompted TIMESTAMP WITH TIME ZONE;

-- Create index on questionnaire completion status
CREATE INDEX IF NOT EXISTS idx_accounts_questionnaire_completed ON public.accounts(questionnaire_completed);

-- Add comments
COMMENT ON COLUMN public.accounts.questionnaire_completed IS 'Whether user has completed the practice profile questionnaire';
COMMENT ON COLUMN public.accounts.questionnaire_skipped IS 'Whether user has explicitly skipped the questionnaire';
COMMENT ON COLUMN public.accounts.questionnaire_last_prompted IS 'Last time user was prompted to complete questionnaire';

-- Enable Row Level Security
ALTER TABLE public.practice_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read their own practice profile
CREATE POLICY "Users can view their own practice profile"
  ON public.practice_profiles
  FOR SELECT
  USING (account_id = auth.uid());

-- RLS Policy: Users can insert their own practice profile
CREATE POLICY "Users can insert their own practice profile"
  ON public.practice_profiles
  FOR INSERT
  WITH CHECK (account_id = auth.uid());

-- RLS Policy: Users can update their own practice profile
CREATE POLICY "Users can update their own practice profile"
  ON public.practice_profiles
  FOR UPDATE
  USING (account_id = auth.uid())
  WITH CHECK (account_id = auth.uid());

-- RLS Policy: Users can delete their own practice profile
CREATE POLICY "Users can delete their own practice profile"
  ON public.practice_profiles
  FOR DELETE
  USING (account_id = auth.uid());

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_practice_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER practice_profiles_updated_at
  BEFORE UPDATE ON public.practice_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_practice_profiles_updated_at();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Practice profiles table created successfully';
  RAISE NOTICE '✅ RLS policies applied';
  RAISE NOTICE '✅ Questionnaire tracking columns added to accounts table';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Update frontend API services';
  RAISE NOTICE '2. Create questionnaire components';
  RAISE NOTICE '3. Integrate with onboarding flow';
  RAISE NOTICE '';
END $$;
