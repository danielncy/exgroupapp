-- 010_earn_stamps_on_booking.sql
-- Auto-earn loyalty stamps + points when a booking is completed
-- Agent: YUKAI (Loyalty & Gamification)

-- Determine stamps_required based on brand type
CREATE OR REPLACE FUNCTION get_stamps_required_for_brand(p_brand_id uuid)
RETURNS integer AS $$
DECLARE
  v_brand_type text;
BEGIN
  SELECT type INTO v_brand_type FROM brands WHERE id = p_brand_id;
  CASE v_brand_type
    WHEN 'hair_salon' THEN RETURN 10;
    WHEN 'beauty' THEN RETURN 8;
    WHEN 'scalp_specialist' THEN RETURN 6;
    ELSE RETURN 10;
  END CASE;
END;
$$ LANGUAGE plpgsql STABLE;

-- Main trigger function: fires when booking status changes to 'completed'
CREATE OR REPLACE FUNCTION earn_stamps_on_booking_complete()
RETURNS trigger AS $$
DECLARE
  v_brand_id uuid;
  v_customer_id uuid;
  v_stamp_card_id uuid;
  v_stamps_collected integer;
  v_stamps_required integer;
  v_is_completed boolean;
BEGIN
  -- Only fire when status transitions TO 'completed'
  IF NEW.status <> 'completed' OR OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;

  v_customer_id := NEW.customer_id;

  -- Resolve brand_id from the outlet
  SELECT o.brand_id INTO v_brand_id
  FROM outlets o
  WHERE o.id = NEW.outlet_id;

  IF v_brand_id IS NULL THEN
    RAISE WARNING 'earn_stamps: outlet % has no brand_id', NEW.outlet_id;
    RETURN NEW;
  END IF;

  v_stamps_required := get_stamps_required_for_brand(v_brand_id);

  -- -----------------------------------------------------------------------
  -- 1. Upsert customer_brand_membership
  -- -----------------------------------------------------------------------
  INSERT INTO customer_brand_memberships (customer_id, brand_id, total_points, total_visits, first_visit_at, last_visit_at)
  VALUES (v_customer_id, v_brand_id, 10, 1, now(), now())
  ON CONFLICT (customer_id, brand_id) DO UPDATE SET
    total_points  = customer_brand_memberships.total_points + 10,
    total_visits  = customer_brand_memberships.total_visits + 1,
    last_visit_at = now();

  -- -----------------------------------------------------------------------
  -- 2. Get or create active stamp card
  -- -----------------------------------------------------------------------
  SELECT id, stamps_collected INTO v_stamp_card_id, v_stamps_collected
  FROM stamp_cards
  WHERE customer_id = v_customer_id
    AND brand_id = v_brand_id
    AND is_completed = false
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_stamp_card_id IS NULL THEN
    INSERT INTO stamp_cards (customer_id, brand_id, card_type, stamps_collected, stamps_required)
    VALUES (v_customer_id, v_brand_id, 'standard', 0, v_stamps_required)
    RETURNING id, stamps_collected INTO v_stamp_card_id, v_stamps_collected;
  END IF;

  -- Increment stamps
  v_stamps_collected := v_stamps_collected + 1;
  v_is_completed := v_stamps_collected >= v_stamps_required;

  UPDATE stamp_cards
  SET stamps_collected = v_stamps_collected,
      is_completed     = v_is_completed,
      completed_at     = CASE WHEN v_is_completed THEN now() ELSE NULL END
  WHERE id = v_stamp_card_id;

  -- If card completed, automatically create a new one for next round
  IF v_is_completed THEN
    INSERT INTO stamp_cards (customer_id, brand_id, card_type, stamps_collected, stamps_required)
    VALUES (v_customer_id, v_brand_id, 'standard', 0, v_stamps_required);
  END IF;

  -- -----------------------------------------------------------------------
  -- 3. Insert loyalty_ledger entry
  -- -----------------------------------------------------------------------
  INSERT INTO loyalty_ledger (customer_id, brand_id, entry_type, points, stamps, reference_type, reference_id, description)
  VALUES (
    v_customer_id,
    v_brand_id,
    'earn_booking',
    10,
    1,
    'booking',
    NEW.id,
    'Earned from completed booking'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to bookings table
DROP TRIGGER IF EXISTS trg_earn_stamps_on_booking ON bookings;
CREATE TRIGGER trg_earn_stamps_on_booking
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION earn_stamps_on_booking_complete();
