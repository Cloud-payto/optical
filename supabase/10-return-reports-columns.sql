-- =====================================================
-- Migration 10: Add Missing Columns to return_reports Table
-- =====================================================
-- Description: Adds columns needed for the Returns page functionality
-- Run Date: 2025-01-12
-- =====================================================

-- Add vendor_name column (denormalized for easier display)
ALTER TABLE public.return_reports
ADD COLUMN IF NOT EXISTS vendor_name VARCHAR(255);

-- Add filename column to store the PDF filename
ALTER TABLE public.return_reports
ADD COLUMN IF NOT EXISTS filename VARCHAR(500);

-- Add item_count column to track number of distinct items in report
ALTER TABLE public.return_reports
ADD COLUMN IF NOT EXISTS item_count INTEGER DEFAULT 0;

-- Add total_quantity column to track total units across all items
ALTER TABLE public.return_reports
ADD COLUMN IF NOT EXISTS total_quantity INTEGER DEFAULT 0;

-- Add generated_date column (separate from created_at for clarity)
ALTER TABLE public.return_reports
ADD COLUMN IF NOT EXISTS generated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_return_reports_account_id
ON public.return_reports(account_id);

CREATE INDEX IF NOT EXISTS idx_return_reports_vendor_name
ON public.return_reports(vendor_name);

CREATE INDEX IF NOT EXISTS idx_return_reports_status
ON public.return_reports(status);

CREATE INDEX IF NOT EXISTS idx_return_reports_generated_date
ON public.return_reports(generated_date DESC);

-- Add comments for documentation
COMMENT ON COLUMN public.return_reports.vendor_name IS 'Denormalized vendor name for display';
COMMENT ON COLUMN public.return_reports.filename IS 'PDF filename in storage';
COMMENT ON COLUMN public.return_reports.item_count IS 'Number of distinct inventory items in report';
COMMENT ON COLUMN public.return_reports.total_quantity IS 'Total quantity across all items';
COMMENT ON COLUMN public.return_reports.generated_date IS 'Date when report was generated';

-- Verification query
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'return_reports'
-- ORDER BY ordinal_position;
