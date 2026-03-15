-- 013_stripe_checkout_tracking.sql
-- Tracks Stripe Checkout Sessions for wallet top-ups
-- Wallet credited ONLY via webhook — never client-side

CREATE TABLE stripe_checkout_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  stripe_session_id text NOT NULL UNIQUE,
  wallet_id uuid NOT NULL REFERENCES wallets(id),
  customer_id uuid NOT NULL REFERENCES customers(id),
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  currency text NOT NULL DEFAULT 'SGD',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  stripe_payment_intent_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX idx_stripe_sessions_customer ON stripe_checkout_sessions(customer_id);
CREATE INDEX idx_stripe_sessions_status ON stripe_checkout_sessions(status);

-- RLS: customers read own sessions
ALTER TABLE stripe_checkout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stripe_sessions_select_own" ON stripe_checkout_sessions
  FOR SELECT USING (
    customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())
  );
