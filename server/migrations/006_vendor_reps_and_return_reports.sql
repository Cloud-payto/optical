-- Migration: Add vendor_reps table and return_reports system
-- Created: 2025-10-25
-- Description: Adds vendor rep contact info and return report tracking

-- ============================================================================
-- VENDOR REPS TABLE
-- ============================================================================
-- Stores contact information for sales reps at each vendor
CREATE TABLE IF NOT EXISTS public.vendor_reps (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  rep_name varchar(255) NOT NULL,
  rep_email varchar(255) NOT NULL,
  rep_phone varchar(50),
  rep_title varchar(100),
  is_primary boolean DEFAULT false,
  notes text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,a
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vendor_reps_account_vendor ON public.vendor_reps(account_id, vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_reps_primary ON public.vendor_reps(vendor_id, is_primary) WHERE is_primary = true;

-- ============================================================================
-- ADD CONTACT EMAIL TO VENDORS TABLE
-- ============================================================================
-- Fallback email if no rep is specified
ALTER TABLE public.vendors
ADD COLUMN IF NOT EXISTS contact_email varchar(255),
ADD COLUMN IF NOT EXISTS contact_phone varchar(50);

-- ============================================================================
-- RETURN REPORTS TABLE
-- ============================================================================
-- Tracks generated return authorization requests
CREATE TABLE IF NOT EXISTS public.return_reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  vendor_id uuid REFERENCES public.vendors(id) ON DELETE SET NULL,
  report_number varchar(50) NOT NULL UNIQUE,
  status varchar(20) DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'sent', 'cancelled')),
  vendor_account_number varchar(100),
  total_items integer DEFAULT 0,
  total_value numeric(10, 2) DEFAULT 0,
  generated_at timestamp with time zone,
  pdf_path varchar(500),
  sent_to_email varchar(255),
  sent_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Add index for report lookups
CREATE INDEX IF NOT EXISTS idx_return_reports_account ON public.return_reports(account_id);
CREATE INDEX IF NOT EXISTS idx_return_reports_vendor ON public.return_reports(vendor_id);
CREATE INDEX IF NOT EXISTS idx_return_reports_status ON public.return_reports(status);

-- ============================================================================
-- RETURN REPORT ITEMS TABLE
-- ============================================================================
-- Links inventory items to return reports
CREATE TABLE IF NOT EXISTS public.return_report_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  return_report_id uuid NOT NULL REFERENCES public.return_reports(id) ON DELETE CASCADE,
  inventory_id uuid NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
  sku varchar(100),
  brand varchar(100),
  model varchar(255),
  color varchar(100),
  size varchar(50),
  quantity integer DEFAULT 1,
  wholesale_price numeric(10, 2),
  order_date date,
  return_window_expires date,
  reason varchar(255),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_return_report_items_report ON public.return_report_items(return_report_id);
CREATE INDEX IF NOT EXISTS idx_return_report_items_inventory ON public.return_report_items(inventory_id);

-- ============================================================================
-- FUNCTION: Generate unique report number
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_return_report_number(account_uuid uuid)
RETURNS varchar AS $$
DECLARE
  report_count integer;
  new_report_number varchar;
BEGIN
  -- Get count of existing reports for this account in current year
  SELECT COUNT(*) INTO report_count
  FROM public.return_reports
  WHERE account_id = account_uuid
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_TIMESTAMP);

  -- Generate report number: RR-YYYY-NNN
  new_report_number := 'RR-' ||
                       EXTRACT(YEAR FROM CURRENT_TIMESTAMP) ||
                       '-' ||
                       LPAD((report_count + 1)::text, 3, '0');

  RETURN new_report_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: Auto-update updated_at timestamps
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vendor_reps_updated_at
  BEFORE UPDATE ON public.vendor_reps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_return_reports_updated_at
  BEFORE UPDATE ON public.return_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE public.vendor_reps IS 'Sales rep contact information for each vendor';
COMMENT ON TABLE public.return_reports IS 'Return authorization requests grouped by vendor';
COMMENT ON TABLE public.return_report_items IS 'Individual items included in each return report';
COMMENT ON FUNCTION generate_return_report_number IS 'Generates unique report numbers in format RR-YYYY-NNN';
