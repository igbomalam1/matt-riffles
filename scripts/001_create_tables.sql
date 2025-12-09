-- VIP Card Applications table
CREATE TABLE IF NOT EXISTS vip_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  waybill_address TEXT,
  card_type TEXT NOT NULL CHECK (card_type IN ('gold', 'platinum', 'silver')),
  photo_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table for shop, books, tickets
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  items JSONB NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('card', 'gift_card', 'crypto')),
  payment_details JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'shipped', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs for admin actions on orders
CREATE TABLE IF NOT EXISTS order_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  actor_id TEXT NOT NULL,
  actor_email TEXT,
  action TEXT NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Show bookings table
CREATE TABLE IF NOT EXISTS shows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  city TEXT NOT NULL,
  venue TEXT NOT NULL,
  ticket_status TEXT DEFAULT 'low_tickets' CHECK (ticket_status IN ('available', 'low_tickets', 'sold_out')),
  ticket_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Presale code requests
CREATE TABLE IF NOT EXISTS presale_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT NOT NULL,
  codes_needed INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- City requests (for "Don't See Your City")
CREATE TABLE IF NOT EXISTS city_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT NOT NULL,
  requested_city TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin settings
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Newsletter subscribers (for tracking)
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables (admin-only access via service role)
ALTER TABLE vip_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE presale_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Public read access for shows (everyone can see shows)
CREATE POLICY "Anyone can view shows" ON shows FOR SELECT USING (true);

-- Allow public inserts for customer-facing forms (no auth required)
CREATE POLICY "Anyone can submit VIP applications" ON vip_cards FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can create orders" ON orders FOR INSERT WITH CHECK (true);
-- Admin audit logs are service-role only; no public policies
CREATE POLICY "Anyone can submit presale requests" ON presale_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can submit city requests" ON city_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can send chat messages" ON chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read their chat messages" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Anyone can read admin settings" ON admin_settings FOR SELECT USING (true);

-- Insert default BTC wallet setting
INSERT INTO admin_settings (key, value) VALUES ('btc_wallet', 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh') ON CONFLICT (key) DO NOTHING;
INSERT INTO admin_settings (key, value) VALUES ('signature_url', '') ON CONFLICT (key) DO NOTHING;
