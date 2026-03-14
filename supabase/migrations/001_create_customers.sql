-- 001_create_customers.sql
-- Customer identity tables
-- Agent: LENNY (Auth & Identity)

-- Core customer table
CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text NOT NULL UNIQUE,
  email text,
  display_name text NOT NULL DEFAULT '',
  avatar_url text,
  preferred_language text NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'ms', 'zh')),
  referral_code text UNIQUE,
  marketing_consent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- Auto-generate referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS trigger AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := upper(substr(md5(random()::text), 1, 6));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_referral_code
  BEFORE INSERT ON customers
  FOR EACH ROW EXECUTE FUNCTION generate_referral_code();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Brand memberships (one customer, many brands)
CREATE TABLE customer_brand_memberships (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES brands(id),
  membership_tier text NOT NULL DEFAULT 'bronze' CHECK (membership_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  total_points integer NOT NULL DEFAULT 0,
  first_visit_at timestamptz,
  last_visit_at timestamptz,
  total_visits integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(customer_id, brand_id)
);

-- Customer preferences (progressive profiling)
CREATE TABLE customer_preferences (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id uuid NOT NULL UNIQUE REFERENCES customers(id) ON DELETE CASCADE,
  preferred_outlet_id uuid,
  preferred_stylist_id uuid,
  hair_type text,
  skin_type text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_preferences_updated_at
  BEFORE UPDATE ON customer_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_auth_user ON customers(auth_user_id);
CREATE INDEX idx_memberships_customer ON customer_brand_memberships(customer_id);
CREATE INDEX idx_memberships_brand ON customer_brand_memberships(brand_id);

-- RLS Policies
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_brand_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_preferences ENABLE ROW LEVEL SECURITY;

-- Customers can only see and update their own profile
CREATE POLICY "customers_select_own" ON customers
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "customers_update_own" ON customers
  FOR UPDATE USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- Customers can see their own memberships
CREATE POLICY "memberships_select_own" ON customer_brand_memberships
  FOR SELECT USING (
    customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())
  );

-- Customers can see and update their own preferences
CREATE POLICY "preferences_select_own" ON customer_preferences
  FOR SELECT USING (
    customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "preferences_upsert_own" ON customer_preferences
  FOR ALL USING (
    customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())
  );
