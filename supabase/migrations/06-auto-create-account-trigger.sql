-- ============================================================
-- AUTO-CREATE ACCOUNT ON USER SIGNUP
-- ============================================================
-- Migration: Database trigger to automatically create account record
-- when a new user signs up via Supabase Auth
-- ============================================================

-- Function to automatically create an account when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a new account record for the user
  INSERT INTO public.accounts (
    id,
    user_id,
    name,
    email,
    status,
    subscription_tier,
    trial_ends_at,
    email_verified,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,                                           -- Use same UUID as auth.users
    NEW.id,                                           -- user_id reference
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)), -- Extract name from email if not provided
    NEW.email,
    'trial',                                          -- Start with trial status
    'trial',                                          -- Trial tier
    NOW() + INTERVAL '14 days',                       -- 14-day trial
    NEW.email_confirmed_at IS NOT NULL,               -- Email verified if confirmed
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that fires after user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates an account record when a new user signs up via Supabase Auth';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Auto-create account trigger installed';
  RAISE NOTICE '   New users will automatically get an account record';
  RAISE NOTICE '';
END $$;
