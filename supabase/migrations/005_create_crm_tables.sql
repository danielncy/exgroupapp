-- 005_create_crm_tables.sql
-- Segments, campaigns, health scores
-- Agent: ANDREW (CRM & Intelligence)

CREATE TABLE customer_health_scores (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id uuid NOT NULL REFERENCES customers(id),
  score integer NOT NULL CHECK (score BETWEEN 0 AND 100),
  recency_score integer NOT NULL,
  frequency_score integer NOT NULL,
  monetary_score integer NOT NULL,
  risk_level text NOT NULL CHECK (risk_level IN ('healthy', 'cooling', 'at_risk', 'churning', 'churned')),
  calculated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE customer_segments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  criteria jsonb NOT NULL DEFAULT '{}',
  is_dynamic boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE customer_segment_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  segment_id uuid NOT NULL REFERENCES customer_segments(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id),
  entered_at timestamptz NOT NULL DEFAULT now(),
  exited_at timestamptz
);

CREATE TABLE campaigns (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  segment_id uuid REFERENCES customer_segments(id),
  channel text NOT NULL CHECK (channel IN ('push', 'email', 'sms', 'whatsapp')),
  message_template text NOT NULL DEFAULT '',
  offer jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'completed')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE campaign_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id),
  customer_id uuid NOT NULL REFERENCES customers(id),
  event_type text NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'converted', 'unsubscribed')),
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed default segments
INSERT INTO customer_segments (name, description, criteria) VALUES
  ('New Customers', 'Signed up in last 30 days, no visits yet', '{"days_since_signup": {"lte": 30}, "total_visits": 0}'),
  ('Active', 'Visited in last 45 days', '{"days_since_last_visit": {"lte": 45}}'),
  ('At Risk', 'Visited before but not in 45-90 days', '{"days_since_last_visit": {"gt": 45, "lte": 90}}'),
  ('Churned', 'No visit in 90+ days', '{"days_since_last_visit": {"gt": 90}}'),
  ('VIP', 'Gold or Platinum tier', '{"membership_tier": ["gold", "platinum"]}');

-- Indexes
CREATE INDEX idx_health_scores_customer ON customer_health_scores(customer_id);
CREATE INDEX idx_segment_members_segment ON customer_segment_members(segment_id);
CREATE INDEX idx_segment_members_customer ON customer_segment_members(customer_id);
CREATE INDEX idx_campaign_events_campaign ON campaign_events(campaign_id);

-- RLS (admin-only tables — no customer access)
ALTER TABLE customer_health_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segment_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_events ENABLE ROW LEVEL SECURITY;
