-- Migration: Add Multi-Location Support
-- Description: Creates practice_locations table and adds location_id to inventory

-- ============================================
-- 1. CREATE PRACTICE_LOCATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.practice_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  phone VARCHAR(20),
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(account_id, name)
);

-- Create index for faster lookups by account
CREATE INDEX idx_practice_locations_account_id ON public.practice_locations(account_id);

-- Create index for active locations
CREATE INDEX idx_practice_locations_active ON public.practice_locations(account_id, is_active);

-- ============================================
-- 2. ADD LOCATION_ID TO INVENTORY TABLE
-- ============================================

ALTER TABLE public.inventory
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES practice_locations(id) ON DELETE SET NULL;

-- Create index for location-based inventory queries
CREATE INDEX idx_inventory_location_id ON public.inventory(location_id);

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on practice_locations
ALTER TABLE public.practice_locations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own practice locations
CREATE POLICY "Users can view own practice locations"
  ON public.practice_locations
  FOR SELECT
  USING (account_id = auth.uid());

-- Policy: Users can insert their own practice locations
CREATE POLICY "Users can insert own practice locations"
  ON public.practice_locations
  FOR INSERT
  WITH CHECK (account_id = auth.uid());

-- Policy: Users can update their own practice locations
CREATE POLICY "Users can update own practice locations"
  ON public.practice_locations
  FOR UPDATE
  USING (account_id = auth.uid())
  WITH CHECK (account_id = auth.uid());

-- Policy: Users can delete their own practice locations
CREATE POLICY "Users can delete own practice locations"
  ON public.practice_locations
  FOR DELETE
  USING (account_id = auth.uid());

-- ============================================
-- 4. FUNCTION: ENSURE SINGLE PRIMARY LOCATION
-- ============================================

-- Function to ensure only one primary location per account
CREATE OR REPLACE FUNCTION ensure_single_primary_location()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting this location as primary, unset other primaries for this account
  IF NEW.is_primary = true THEN
    UPDATE public.practice_locations
    SET is_primary = false
    WHERE account_id = NEW.account_id
      AND id != NEW.id
      AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce single primary location
DROP TRIGGER IF EXISTS trigger_ensure_single_primary_location ON public.practice_locations;
CREATE TRIGGER trigger_ensure_single_primary_location
  AFTER INSERT OR UPDATE OF is_primary
  ON public.practice_locations
  FOR EACH ROW
  WHEN (NEW.is_primary = true)
  EXECUTE FUNCTION ensure_single_primary_location();

-- ============================================
-- 5. FUNCTION: AUTO-SET FIRST LOCATION AS PRIMARY
-- ============================================

-- Function to auto-set first location as primary
CREATE OR REPLACE FUNCTION auto_set_primary_location()
RETURNS TRIGGER AS $$
DECLARE
  location_count INTEGER;
BEGIN
  -- Count existing locations for this account
  SELECT COUNT(*) INTO location_count
  FROM public.practice_locations
  WHERE account_id = NEW.account_id;

  -- If this is the first location, make it primary
  IF location_count = 1 THEN
    UPDATE public.practice_locations
    SET is_primary = true
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-set first location as primary
DROP TRIGGER IF EXISTS trigger_auto_set_primary_location ON public.practice_locations;
CREATE TRIGGER trigger_auto_set_primary_location
  AFTER INSERT
  ON public.practice_locations
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_primary_location();

-- ============================================
-- 6. UPDATED_AT TRIGGER
-- ============================================

-- Apply updated_at trigger (reuse existing function if available)
DROP TRIGGER IF EXISTS update_practice_locations_updated_at ON public.practice_locations;
CREATE TRIGGER update_practice_locations_updated_at
  BEFORE UPDATE ON public.practice_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. HELPER VIEW: ACCOUNT LOCATION COUNT
-- ============================================

-- View to easily check if account has multiple locations
CREATE OR REPLACE VIEW public.account_location_summary AS
SELECT
  account_id,
  COUNT(*) as total_locations,
  COUNT(*) FILTER (WHERE is_active = true) as active_locations,
  (SELECT id FROM practice_locations pl2 WHERE pl2.account_id = pl.account_id AND pl2.is_primary = true LIMIT 1) as primary_location_id
FROM public.practice_locations pl
GROUP BY account_id;

-- ============================================
-- 8. COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE public.practice_locations IS 'Stores practice/store locations for multi-location support';
COMMENT ON COLUMN public.practice_locations.is_primary IS 'Primary location for the account - only one per account';
COMMENT ON COLUMN public.practice_locations.is_active IS 'Soft delete - inactive locations are hidden but preserved';
COMMENT ON COLUMN public.inventory.location_id IS 'Links inventory item to a specific practice location';
