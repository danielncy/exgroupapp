-- 004_create_loyalty_tables.sql
-- Loyalty ledger, stamp cards, tiers, rewards
-- Agent: YUKAI (Loyalty & Gamification)

-- APPEND-ONLY loyalty ledger
CREATE TABLE loyalty_ledger (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id uuid NOT NULL REFERENCES customers(id),
  brand_id uuid NOT NULL REFERENCES brands(id),
  entry_type text NOT NULL CHECK (entry_type IN (
    'earn_booking', 'earn_referral', 'earn_streak', 'earn_birthday', 'earn_cross_brand',
    'redeem', 'expire', 'adjust'
  )),
  points integer NOT NULL DEFAULT 0,
  stamps integer NOT NULL DEFAULT 0,
  reference_type text,
  reference_id uuid,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE stamp_cards (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id uuid NOT NULL REFERENCES customers(id),
  brand_id uuid NOT NULL REFERENCES brands(id),
  card_type text NOT NULL,
  stamps_collected integer NOT NULL DEFAULT 0,
  stamps_required integer NOT NULL,
  is_completed boolean NOT NULL DEFAULT false,
  reward_claimed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE loyalty_tiers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id uuid NOT NULL REFERENCES brands(id),
  tier_name text NOT NULL CHECK (tier_name IN ('bronze', 'silver', 'gold', 'platinum')),
  min_points integer NOT NULL,
  benefits jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(brand_id, tier_name)
);

CREATE TABLE rewards (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id uuid NOT NULL REFERENCES brands(id),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  points_cost integer NOT NULL DEFAULT 0,
  stamps_cost integer NOT NULL DEFAULT 0,
  reward_type text NOT NULL CHECK (reward_type IN ('discount', 'free_service', 'product', 'upgrade')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed default tiers for each brand
INSERT INTO loyalty_tiers (brand_id, tier_name, min_points, benefits)
SELECT b.id, t.tier_name, t.min_points, t.benefits::jsonb
FROM brands b
CROSS JOIN (VALUES
  ('bronze', 0, '{"discount_pct": 0}'),
  ('silver', 500, '{"discount_pct": 5}'),
  ('gold', 1500, '{"discount_pct": 10, "priority_booking": true}'),
  ('platinum', 5000, '{"discount_pct": 15, "priority_booking": true, "free_birthday_service": true}')
) AS t(tier_name, min_points, benefits);

-- Indexes
CREATE INDEX idx_loyalty_ledger_customer ON loyalty_ledger(customer_id);
CREATE INDEX idx_loyalty_ledger_brand ON loyalty_ledger(brand_id);
CREATE INDEX idx_stamp_cards_customer ON stamp_cards(customer_id);
CREATE INDEX idx_rewards_brand ON rewards(brand_id);

-- RLS
ALTER TABLE loyalty_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE stamp_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "loyalty_ledger_select_own" ON loyalty_ledger
  FOR SELECT USING (customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid()));

CREATE POLICY "stamp_cards_select_own" ON stamp_cards
  FOR SELECT USING (customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid()));

CREATE POLICY "loyalty_tiers_public_read" ON loyalty_tiers FOR SELECT USING (true);
CREATE POLICY "rewards_public_read" ON rewards FOR SELECT USING (true);
