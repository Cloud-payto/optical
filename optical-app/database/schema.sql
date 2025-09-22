-- Optical Business Intelligence Platform Database Schema
-- Designed for multi-tenant SaaS with vendor email parsing and inventory tracking

-- Enable UUID extension for better distributed IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Accounts table (multi-tenant)
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    business_name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    country VARCHAR(50) DEFAULT 'USA',
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled', 'trial')),
    subscription_tier VARCHAR(50) DEFAULT 'basic' CHECK (subscription_tier IN ('trial', 'basic', 'professional', 'enterprise')),
    subscription_start_date TIMESTAMP WITH TIME ZONE,
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Users table (authentication)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('owner', 'admin', 'user', 'viewer')),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    email_verified BOOLEAN DEFAULT false,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(account_id, email)
);

-- Vendors table
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(50) UNIQUE,
    domain VARCHAR(255),
    email_patterns JSONB DEFAULT '[]'::jsonb, -- Array of email patterns to match
    parser_service VARCHAR(100), -- Which parser service to use
    api_endpoint VARCHAR(255),
    api_key_encrypted TEXT,
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default vendors
INSERT INTO vendors (name, code, domain, email_patterns, parser_service) VALUES
('Safilo', 'SAFILO', 'safilo.com', '["noreply@safilo.com", "*@safilo.com"]'::jsonb, 'SafiloService'),
('Modern Optical', 'MODERN', 'modernoptical.com', '["orders@modernoptical.com", "*@modernoptical.com"]'::jsonb, 'ModernOpticalParser'),
('Luxottica', 'LUX', 'luxottica.com', '["*@luxottica.com"]'::jsonb, 'LuxotticaParser');

-- Email webhook storage
CREATE TABLE emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendors(id),
    message_id VARCHAR(255),
    from_email VARCHAR(255),
    to_email VARCHAR(255),
    subject TEXT,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    raw_data JSONB, -- Complete CloudMailin webhook data
    plain_text TEXT,
    html_text TEXT,
    attachments_count INTEGER DEFAULT 0,
    spam_score NUMERIC(5,2),
    spam_status VARCHAR(50),
    parse_status VARCHAR(50) DEFAULT 'pending' CHECK (parse_status IN ('pending', 'processing', 'parsed', 'failed', 'ignored')),
    parsed_data JSONB, -- Extracted data from parser
    error_message TEXT,
    duplicate_order BOOLEAN DEFAULT false,
    duplicate_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendors(id),
    email_id UUID REFERENCES emails(id) ON DELETE SET NULL,
    order_number VARCHAR(100) NOT NULL,
    reference_number VARCHAR(100),
    account_number VARCHAR(100),
    customer_name VARCHAR(255),
    customer_code VARCHAR(100),
    customer_phone VARCHAR(50),
    placed_by VARCHAR(255),
    order_date DATE,
    total_pieces INTEGER DEFAULT 0,
    total_amount NUMERIC(10,2),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
    tracking_number VARCHAR(255),
    shipped_date DATE,
    delivered_date DATE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(account_id, vendor_id, order_number, customer_name)
);

-- Inventory items table
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendors(id),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    email_id UUID REFERENCES emails(id) ON DELETE SET NULL,
    sku VARCHAR(255),
    brand VARCHAR(100),
    model VARCHAR(100),
    color VARCHAR(100),
    color_code VARCHAR(50),
    color_name VARCHAR(255),
    size VARCHAR(50),
    full_size VARCHAR(50),
    temple_length VARCHAR(50),
    quantity INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_stock', 'sold', 'returned')),
    
    -- Product details
    upc VARCHAR(50),
    ean VARCHAR(50),
    material VARCHAR(100),
    country_of_origin VARCHAR(100),
    
    -- Pricing
    wholesale_price NUMERIC(10,2),
    msrp NUMERIC(10,2),
    selling_price NUMERIC(10,2),
    
    -- API enrichment
    api_verified BOOLEAN DEFAULT false,
    confidence_score INTEGER,
    validation_reason TEXT,
    in_stock BOOLEAN,
    availability VARCHAR(50),
    
    -- Tracking
    received_date DATE,
    sold_date DATE,
    returned_date DATE,
    
    -- Metadata
    enriched_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Brands table (for brand management)
CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    vendor_id UUID REFERENCES vendors(id),
    category VARCHAR(50),
    tier VARCHAR(50) CHECK (tier IN ('luxury', 'premium', 'standard', 'value')),
    is_active BOOLEAN DEFAULT true,
    website VARCHAR(255),
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- API logs table (for tracking API calls and debugging)
CREATE TABLE api_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendors(id),
    endpoint VARCHAR(255),
    method VARCHAR(10),
    request_data JSONB,
    response_data JSONB,
    status_code INTEGER,
    error_message TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Webhook logs table
CREATE TABLE webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    email_id UUID REFERENCES emails(id) ON DELETE CASCADE,
    webhook_type VARCHAR(50),
    payload JSONB,
    processing_status VARCHAR(50),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_users_account_id ON users(account_id);
CREATE INDEX idx_users_email ON users(email);

CREATE INDEX idx_emails_account_id ON emails(account_id);
CREATE INDEX idx_emails_vendor_id ON emails(vendor_id);
CREATE INDEX idx_emails_received_at ON emails(received_at DESC);
CREATE INDEX idx_emails_parse_status ON emails(parse_status);

CREATE INDEX idx_orders_account_vendor ON orders(account_id, vendor_id);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_order_date ON orders(order_date DESC);

CREATE INDEX idx_inventory_account_id ON inventory(account_id);
CREATE INDEX idx_inventory_vendor_id ON inventory(vendor_id);
CREATE INDEX idx_inventory_order_id ON inventory(order_id);
CREATE INDEX idx_inventory_sku ON inventory(sku);
CREATE INDEX idx_inventory_brand_model ON inventory(brand, model);
CREATE INDEX idx_inventory_status ON inventory(status);

CREATE INDEX idx_api_logs_account_id ON api_logs(account_id);
CREATE INDEX idx_api_logs_created_at ON api_logs(created_at DESC);

CREATE INDEX idx_webhook_logs_account_id ON webhook_logs(account_id);
CREATE INDEX idx_webhook_logs_created_at ON webhook_logs(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emails_updated_at BEFORE UPDATE ON emails
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for common queries
CREATE VIEW account_inventory_summary AS
SELECT 
    a.id as account_id,
    a.name as account_name,
    COUNT(DISTINCT i.id) as total_items,
    COUNT(DISTINCT i.brand) as total_brands,
    COUNT(DISTINCT i.order_id) as total_orders,
    SUM(i.quantity) as total_quantity,
    SUM(i.quantity * i.wholesale_price) as total_value
FROM accounts a
LEFT JOIN inventory i ON a.id = i.account_id
GROUP BY a.id, a.name;

CREATE VIEW vendor_order_summary AS
SELECT 
    v.id as vendor_id,
    v.name as vendor_name,
    COUNT(DISTINCT o.id) as total_orders,
    COUNT(DISTINCT o.account_id) as total_accounts,
    SUM(o.total_pieces) as total_pieces,
    MIN(o.order_date) as first_order_date,
    MAX(o.order_date) as last_order_date
FROM vendors v
LEFT JOIN orders o ON v.id = o.vendor_id
GROUP BY v.id, v.name;