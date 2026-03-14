-- 011_wallet_payment_functions.sql
-- Atomic wallet payment processing
-- Agent: PATRICK (Payments & Wallet)

-- process_wallet_payment: atomically deducts from wallet and creates a transaction
CREATE OR REPLACE FUNCTION process_wallet_payment(
  p_wallet_id uuid,
  p_amount_cents integer,
  p_booking_id uuid,
  p_outlet_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance integer;
  v_customer_id uuid;
  v_transaction_id uuid;
  v_idempotency_key text;
BEGIN
  -- 1. Lock the wallet row to prevent concurrent modifications
  SELECT customer_id INTO v_customer_id
  FROM wallets
  WHERE id = p_wallet_id
  FOR UPDATE;

  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'Wallet not found: %', p_wallet_id;
  END IF;

  -- 2. Calculate current balance
  SELECT COALESCE(SUM(amount_cents), 0)::integer INTO v_balance
  FROM wallet_ledger
  WHERE wallet_id = p_wallet_id;

  -- 3. Check sufficient balance
  IF v_balance < p_amount_cents THEN
    RAISE EXCEPTION 'Insufficient wallet balance. Available: %, Required: %', v_balance, p_amount_cents;
  END IF;

  -- 4. Generate idempotency key
  v_idempotency_key := 'payment-' || p_booking_id::text || '-' || extract(epoch from now())::text;

  -- 5. Insert negative ledger entry (payment)
  INSERT INTO wallet_ledger (
    wallet_id,
    entry_type,
    amount_cents,
    currency,
    reference_type,
    reference_id,
    description,
    idempotency_key
  ) VALUES (
    p_wallet_id,
    'payment',
    -p_amount_cents,
    'SGD',
    'booking',
    p_booking_id,
    'Payment for booking',
    v_idempotency_key
  );

  -- 6. Create transaction record
  INSERT INTO transactions (
    customer_id,
    booking_id,
    outlet_id,
    payment_method,
    subtotal_cents,
    discount_cents,
    total_cents,
    currency,
    status
  ) VALUES (
    v_customer_id,
    p_booking_id,
    p_outlet_id,
    'wallet',
    p_amount_cents,
    0,
    p_amount_cents,
    'SGD',
    'completed'
  )
  RETURNING id INTO v_transaction_id;

  -- 7. Return the transaction id
  RETURN v_transaction_id;
END;
$$;

-- RLS insert policies for wallet operations from client
-- Allow customers to insert into their own wallets
CREATE POLICY "wallets_insert_own" ON wallets
  FOR INSERT WITH CHECK (
    customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())
  );

-- Allow customers to insert ledger entries for their own wallets
CREATE POLICY "wallet_ledger_insert_own" ON wallet_ledger
  FOR INSERT WITH CHECK (
    wallet_id IN (
      SELECT w.id FROM wallets w
      JOIN customers c ON w.customer_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );

-- Allow customers to insert their own transactions
CREATE POLICY "transactions_insert_own" ON transactions
  FOR INSERT WITH CHECK (
    customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())
  );

-- Allow customers to insert their own customer_packages
CREATE POLICY "customer_packages_insert_own" ON customer_packages
  FOR INSERT WITH CHECK (
    customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())
  );
