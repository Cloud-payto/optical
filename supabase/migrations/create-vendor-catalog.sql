-- Create vendor_catalog table for centralized vendor product data
-- This table stores frame data shared across all users (not user-specific)

CREATE TABLE IF NOT EXISTS public.vendor_catalog (
  id uuid NOT NULL DEFAULT gen_random_uuid(),

  -- Vendor relationship
  vendor_id uuid NOT NULL,
  vendor_name character varying,

  -- Product identification (for matching)
  brand character varying NOT NULL,
  model character varying NOT NULL,
  color character varying,
  color_code character varying,
  sku character varying,

  -- Unique identifiers
  upc character varying,
  ean character varying,

  -- Pricing (competitive intelligence!)
  wholesale_cost numeric,
  msrp numeric,
  map_price numeric,

  -- Frame specifications
  eye_size character varying,
  bridge character varying,
  temple_length character varying,
  full_size character varying,

  -- Product details
  material character varying,
  gender character varying,
  fit_type character varying,

  -- Advanced measurements
  a_measurement character varying,
  b_measurement character varying,
  dbl character varying,
  ed character varying,

  -- Availability
  in_stock boolean,
  availability_status character varying,

  -- Data quality
  confidence_score integer DEFAULT 100,
  data_source character varying CHECK (data_source IN ('web_scrape', 'api', 'manual', 'email_parse')),
  verified boolean DEFAULT false,

  -- Metadata
  first_seen_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  last_updated timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  times_ordered integer DEFAULT 1,
  metadata jsonb DEFAULT '{}'::jsonb,

  -- Constraints
  CONSTRAINT vendor_catalog_pkey PRIMARY KEY (id),
  CONSTRAINT vendor_catalog_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE,
  CONSTRAINT vendor_catalog_unique_item UNIQUE (vendor_id, model, color, eye_size)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_vendor_catalog_brand ON public.vendor_catalog(brand);
CREATE INDEX IF NOT EXISTS idx_vendor_catalog_vendor_brand ON public.vendor_catalog(vendor_id, brand);
CREATE INDEX IF NOT EXISTS idx_vendor_catalog_upc ON public.vendor_catalog(upc) WHERE upc IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vendor_catalog_model ON public.vendor_catalog(model);
CREATE INDEX IF NOT EXISTS idx_vendor_catalog_vendor_model ON public.vendor_catalog(vendor_id, model);

-- Comments for documentation
COMMENT ON TABLE public.vendor_catalog IS 'Centralized catalog of vendor products shared across all accounts. Used for vendor comparison and fast lookups.';
COMMENT ON COLUMN public.vendor_catalog.times_ordered IS 'Counter tracking how many times this item has been ordered across all accounts (popularity metric)';
COMMENT ON COLUMN public.vendor_catalog.data_source IS 'How this data was obtained: web_scrape, api, manual, or email_parse';
COMMENT ON COLUMN public.vendor_catalog.confidence_score IS 'Data quality score (0-100). Higher = more reliable data';

-- Grant permissions (adjust based on your RLS policies)
-- ALTER TABLE public.vendor_catalog ENABLE ROW LEVEL SECURITY;
