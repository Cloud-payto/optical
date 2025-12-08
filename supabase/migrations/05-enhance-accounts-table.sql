-- ============================================================
-- ENHANCE ACCOUNTS TABLE FOR USER PROFILES
-- ============================================================
-- Migration: Add user profile and preference columns to accounts table
-- ============================================================

-- Add user profile and preference columns
ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email_orders": true, "email_inventory": true, "email_marketing": false}'::jsonb,
  ADD COLUMN IF NOT EXISTS display_preferences JSONB DEFAULT '{"theme": "light", "language": "en"}'::jsonb,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

-- Add index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);

-- Add index on email for lookups
CREATE INDEX IF NOT EXISTS idx_accounts_email ON public.accounts(email);

-- Update existing constraint to ensure email is unique
ALTER TABLE public.accounts DROP CONSTRAINT IF EXISTS accounts_email_key;
ALTER TABLE public.accounts ADD CONSTRAINT accounts_email_unique UNIQUE(email);

COMMENT ON COLUMN public.accounts.user_id IS 'Reference to auth.users - each account is owned by one user';
COMMENT ON COLUMN public.accounts.notification_preferences IS 'User notification settings stored as JSONB';
COMMENT ON COLUMN public.accounts.display_preferences IS 'UI preferences like theme, language';
COMMENT ON COLUMN public.accounts.onboarding_completed IS 'Whether user has completed onboarding flow';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Accounts table enhanced with user profile columns';
  RAISE NOTICE '';
END $$;
