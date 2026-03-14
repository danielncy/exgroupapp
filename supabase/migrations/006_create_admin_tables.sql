-- 006_create_admin_tables.sql
-- Admin users, audit log, daily reports
-- Agent: COO (Admin & Ops)

CREATE TABLE admin_users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  display_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('hq_admin', 'brand_manager', 'outlet_manager', 'staff')),
  brand_id uuid REFERENCES brands(id),
  outlet_id uuid REFERENCES outlets(id),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- APPEND-ONLY audit log
CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id uuid NOT NULL REFERENCES admin_users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  changes jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE daily_reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  outlet_id uuid NOT NULL REFERENCES outlets(id),
  report_date date NOT NULL,
  total_bookings integer NOT NULL DEFAULT 0,
  completed_bookings integer NOT NULL DEFAULT 0,
  cancellations integer NOT NULL DEFAULT 0,
  walk_ins integer NOT NULL DEFAULT 0,
  revenue_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL CHECK (currency IN ('MYR', 'SGD')),
  avg_rating decimal,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(outlet_id, report_date)
);

-- Indexes
CREATE INDEX idx_audit_log_admin ON audit_log(admin_user_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_daily_reports_outlet ON daily_reports(outlet_id, report_date);

-- RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

-- Admin users can see their own record
CREATE POLICY "admin_select_own" ON admin_users
  FOR SELECT USING (auth.uid() = auth_user_id);

-- HQ admins can see all admin users
CREATE POLICY "admin_select_hq" ON admin_users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users au WHERE au.auth_user_id = auth.uid() AND au.role = 'hq_admin')
  );
