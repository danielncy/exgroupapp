-- 002_create_booking_tables.sql
-- Outlets, services, stylists, bookings
-- Agent: MIKHAIL (Booking Engine)

CREATE TABLE outlets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id uuid NOT NULL REFERENCES brands(id),
  name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  country text NOT NULL CHECK (country IN ('MY', 'SG')),
  lat decimal,
  lng decimal,
  phone text,
  operating_hours jsonb NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE services (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id uuid NOT NULL REFERENCES brands(id),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  duration_minutes integer NOT NULL,
  buffer_minutes integer NOT NULL DEFAULT 15,
  price_cents integer NOT NULL,
  currency text NOT NULL CHECK (currency IN ('MYR', 'SGD')),
  category text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE stylists (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  outlet_id uuid NOT NULL REFERENCES outlets(id),
  name text NOT NULL,
  avatar_url text,
  specialties text[] NOT NULL DEFAULT '{}',
  bio text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE stylist_schedules (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  stylist_id uuid NOT NULL REFERENCES stylists(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_available boolean NOT NULL DEFAULT true,
  UNIQUE(stylist_id, day_of_week)
);

CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id uuid NOT NULL REFERENCES customers(id),
  outlet_id uuid NOT NULL REFERENCES outlets(id),
  stylist_id uuid REFERENCES stylists(id),
  service_id uuid NOT NULL REFERENCES services(id),
  booking_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  cancelled_at timestamptz,
  cancellation_reason text
);

CREATE TRIGGER set_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes for slot conflict detection
CREATE INDEX idx_bookings_slot ON bookings(stylist_id, booking_date, start_time)
  WHERE status NOT IN ('cancelled', 'no_show');
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_outlet_date ON bookings(outlet_id, booking_date);
CREATE INDEX idx_stylists_outlet ON stylists(outlet_id);
CREATE INDEX idx_services_brand ON services(brand_id);
CREATE INDEX idx_outlets_brand ON outlets(brand_id);

-- Add FK from customer_preferences now that outlets/stylists exist
ALTER TABLE customer_preferences
  ADD CONSTRAINT fk_preferences_outlet FOREIGN KEY (preferred_outlet_id) REFERENCES outlets(id),
  ADD CONSTRAINT fk_preferences_stylist FOREIGN KEY (preferred_stylist_id) REFERENCES stylists(id);

-- RLS
ALTER TABLE outlets ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE stylists ENABLE ROW LEVEL SECURITY;
ALTER TABLE stylist_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Public read for outlets, services, stylists (customers need to browse)
CREATE POLICY "outlets_public_read" ON outlets FOR SELECT USING (true);
CREATE POLICY "services_public_read" ON services FOR SELECT USING (true);
CREATE POLICY "stylists_public_read" ON stylists FOR SELECT USING (true);
CREATE POLICY "schedules_public_read" ON stylist_schedules FOR SELECT USING (true);

-- Customers can see their own bookings and create new ones
CREATE POLICY "bookings_select_own" ON bookings
  FOR SELECT USING (
    customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "bookings_insert_own" ON bookings
  FOR INSERT WITH CHECK (
    customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "bookings_update_own" ON bookings
  FOR UPDATE USING (
    customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())
  );
