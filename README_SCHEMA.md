# Database Schema Reference

## Key Table: account_vendor_pricing
Used to store vendor/brand pricing relationships for each account.

### Columns:
- id (UUID, primary key)
- account_id (UUID) - Links to accounts table
- vendor_id (UUID) - Links to vendors table  
- brand_id (UUID) - Links to brands table
- discount_percentage (NUMERIC 5,2) - e.g., 45.50 for 45.5%
- multiplier (NUMERIC 5,3) - e.g., 2.25 for 2.25x markup
- your_cost_override (NUMERIC 10,2) - Manual cost override
- payment_terms (VARCHAR 100) - e.g., "Net 30"
- minimum_order (NUMERIC 10,2) - Minimum order amount
- free_shipping_threshold (NUMERIC 10,2) - Free shipping threshold
- notes (TEXT) - Additional notes
- is_active (BOOLEAN) - Active status
- negotiated_date (DATE) - When pricing was negotiated
- expires_date (DATE) - When pricing expires
- created_at, updated_at (TIMESTAMPTZ) - Timestamps

### Important: NO tariff_tax column exists
If code references tariff_tax, it should be removed or mapped to another field.