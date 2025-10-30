-- Migration: Handle New User Signup
-- This creates a trigger that automatically creates an account record
-- when a new user signs up via Supabase Auth

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.accounts (
    id,
    name,
    business_name,
    email,
    status,
    subscription_tier,
    trial_ends_at,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), -- Use name from metadata or email prefix
    COALESCE(NEW.raw_user_meta_data->>'business_name', NULL),
    NEW.email,
    'trial', -- New users start on trial
    'trial',
    NOW() + INTERVAL '14 days', -- 14-day trial period
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger that runs after a new user is created in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Add RLS (Row Level Security) policies for accounts table if not exists
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own account
DROP POLICY IF EXISTS "Users can view their own account" ON public.accounts;
CREATE POLICY "Users can view their own account"
  ON public.accounts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy: Users can update their own account
DROP POLICY IF EXISTS "Users can update their own account" ON public.accounts;
CREATE POLICY "Users can update their own account"
  ON public.accounts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Service role can do anything (for backend operations)
DROP POLICY IF EXISTS "Service role can manage all accounts" ON public.accounts;
CREATE POLICY "Service role can manage all accounts"
  ON public.accounts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON FUNCTION public.handle_new_user() IS
  'Automatically creates an account record when a new user signs up via Supabase Auth';
