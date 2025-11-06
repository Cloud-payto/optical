-- Migration: Enable Real-time Subscriptions for Orders and Inventory
-- This enables Supabase real-time for automatic UI updates

-- Enable real-time for orders table
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- Enable real-time for inventory table
ALTER PUBLICATION supabase_realtime ADD TABLE inventory;

-- Optional: Enable real-time for emails table if you want to track incoming emails
ALTER PUBLICATION supabase_realtime ADD TABLE emails;

COMMENT ON TABLE orders IS 'Real-time enabled - changes will be broadcast to subscribed clients';
COMMENT ON TABLE inventory IS 'Real-time enabled - changes will be broadcast to subscribed clients';
COMMENT ON TABLE emails IS 'Real-time enabled - changes will be broadcast to subscribed clients';
