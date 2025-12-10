-- Create table to store webhook payloads for testing
-- Run this in Supabase SQL editor

CREATE TABLE IF NOT EXISTS webhook_test_payloads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_code TEXT NOT NULL,           -- e.g., 'MARCHON', 'SAFILO', etc.
    vendor_name TEXT,                     -- Human readable name
    payload JSONB NOT NULL,               -- The full webhook payload
    description TEXT,                     -- Optional description of this test case
    captured_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    use_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,       -- Can disable without deleting
    UNIQUE(vendor_code)                   -- One payload per vendor (update to replace)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_webhook_test_payloads_vendor ON webhook_test_payloads(vendor_code);
CREATE INDEX IF NOT EXISTS idx_webhook_test_payloads_active ON webhook_test_payloads(is_active);

-- Comment
COMMENT ON TABLE webhook_test_payloads IS 'Stores captured webhook payloads for testing vendor email parsing';
