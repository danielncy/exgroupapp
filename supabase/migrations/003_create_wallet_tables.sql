-- 003_create_wallet_tables.sql
-- Wallets, ledger, transactions
-- Agent: PATRICK (Payments & Wallet)

CREATE TABLE wallets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  currency text NOT NULL CHECK (currency IN ('MYR', 'SGD')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(customer_id, currency)
);

-- APPEND-ONLY ledger — balance = SUM(amount_cents)
CREATE TABLE wallet_ledger (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id uuid NOT NULL REFERENCES wallets(id),
  entry_type text NOT NULL CHECK (entry_type IN ('topup', 'topup_bonus', 'payment', 'refund', 'adjustment', 'expiry')),
  amount_cents integer NOT NULL,
  currency text NOT NULL CHECK (currency IN ('MYR', 'SGD')),
  reference_type text,
  reference_id uuid,
  description text NOT NULL DEFAULT '',
  stripe_payment_intent_id text,
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id uuid NOT NULL REFERENCES customers(id),
  booking_id uuid REFERENCES bookings(id),
  outlet_id uuid NOT NULL REFERENCES outlets(id),
  payment_method text NOT NULL CHECK (payment_method IN ('wallet', 'card', 'cash', 'mixed')),
  subtotal_cents integer NOT NULL,
  discount_cents integer NOT NULL DEFAULT 0,
  total_cents integer NOT NULL,
  currency text NOT NULL CHECK (currency IN ('MYR', 'SGD')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),
  receipt_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE packages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id uuid NOT NULL REFERENCES brands(id),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  sessions_total integer NOT NULL,
  price_cents integer NOT NULL,
  currency text NOT NULL CHECK (currency IN ('MYR', 'SGD')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE customer_packages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id uuid NOT NULL REFERENCES customers(id),
  package_id uuid NOT NULL REFERENCES packages(id),
  sessions_remaining integer NOT NULL,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

-- Wallet balance view
CREATE OR REPLACE FUNCTION wallet_balance(wallet_row wallets)
RETURNS integer AS $$
  SELECT COALESCE(SUM(amount_cents), 0)::integer
  FROM wallet_ledger
  WHERE wallet_id = wallet_row.id;
$$ LANGUAGE sql STABLE;

-- Indexes
CREATE INDEX idx_wallet_ledger_wallet ON wallet_ledger(wallet_id);
CREATE INDEX idx_wallet_ledger_idempotency ON wallet_ledger(idempotency_key);
CREATE INDEX idx_transactions_customer ON transactions(customer_id);
CREATE INDEX idx_wallets_customer ON wallets(customer_id);

-- RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wallets_select_own" ON wallets
  FOR SELECT USING (customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid()));

CREATE POLICY "wallet_ledger_select_own" ON wallet_ledger
  FOR SELECT USING (wallet_id IN (
    SELECT w.id FROM wallets w JOIN customers c ON w.customer_id = c.id WHERE c.auth_user_id = auth.uid()
  ));

CREATE POLICY "transactions_select_own" ON transactions
  FOR SELECT USING (customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid()));

CREATE POLICY "packages_public_read" ON packages FOR SELECT USING (true);

CREATE POLICY "customer_packages_select_own" ON customer_packages
  FOR SELECT USING (customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid()));
