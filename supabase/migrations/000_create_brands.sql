-- 000_create_brands.sql
-- Foundation table — must exist before all others
-- Agent: CHESKY (Orchestrator)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE brands (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code text NOT NULL UNIQUE CHECK (code IN ('ex_style', 'ex_beauty', 'uhair', 'coulisse')),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('hair_salon', 'beauty', 'scalp_specialist')),
  logo_url text,
  primary_color text NOT NULL,
  accent_color text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed the 4 brands
INSERT INTO brands (code, name, type, primary_color, accent_color) VALUES
  ('ex_style', 'EX Style', 'hair_salon', '#1A1A2E', '#E94560'),
  ('ex_beauty', 'EX Beauty', 'beauty', '#2D1B69', '#FF6B9D'),
  ('uhair', 'UHair', 'hair_salon', '#0D3B66', '#FAA307'),
  ('coulisse', 'Coulisse', 'scalp_specialist', '#1B4332', '#95D5B2');

-- RLS: brands are public read
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "brands_public_read" ON brands FOR SELECT USING (true);
