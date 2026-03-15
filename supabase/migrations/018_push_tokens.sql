-- 018_push_tokens.sql
-- Push notification token storage for Expo Push API

CREATE TABLE customer_push_tokens (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id uuid NOT NULL REFERENCES customers(id),
  expo_push_token text NOT NULL,
  device_type text NOT NULL CHECK (device_type IN ('ios', 'android')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (customer_id, expo_push_token)
);

CREATE INDEX idx_push_tokens_customer ON customer_push_tokens(customer_id);
CREATE INDEX idx_push_tokens_active ON customer_push_tokens(is_active) WHERE is_active = true;

-- RLS: customers manage own tokens
ALTER TABLE customer_push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_tokens_select_own" ON customer_push_tokens
  FOR SELECT USING (
    customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "push_tokens_insert_own" ON customer_push_tokens
  FOR INSERT WITH CHECK (
    customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "push_tokens_update_own" ON customer_push_tokens
  FOR UPDATE USING (
    customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())
  );
