-- 014_create_reviews.sql
-- Review/rating system: one review per completed booking

CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id uuid NOT NULL UNIQUE REFERENCES bookings(id),
  customer_id uuid NOT NULL REFERENCES customers(id),
  outlet_id uuid NOT NULL REFERENCES outlets(id),
  stylist_id uuid REFERENCES stylists(id),
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reviews_customer ON reviews(customer_id);
CREATE INDEX idx_reviews_outlet ON reviews(outlet_id);
CREATE INDEX idx_reviews_stylist ON reviews(stylist_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read published reviews
CREATE POLICY "reviews_select_published" ON reviews
  FOR SELECT USING (is_published = true);

-- Customers can insert their own reviews
CREATE POLICY "reviews_insert_own" ON reviews
  FOR INSERT WITH CHECK (
    customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())
  );

-- Customers can update their own reviews
CREATE POLICY "reviews_update_own" ON reviews
  FOR UPDATE USING (
    customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- Computed functions for average ratings
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION outlet_avg_rating(p_outlet_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0)
  FROM reviews
  WHERE outlet_id = p_outlet_id AND is_published = true;
$$;

CREATE OR REPLACE FUNCTION stylist_avg_rating(p_stylist_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0)
  FROM reviews
  WHERE stylist_id = p_stylist_id AND is_published = true;
$$;

-- ---------------------------------------------------------------------------
-- Trigger: update daily_reports.avg_rating when a review is inserted/updated
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_daily_report_avg_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking_date date;
  v_avg numeric;
BEGIN
  SELECT booking_date INTO v_booking_date
  FROM bookings WHERE id = NEW.booking_id;

  SELECT ROUND(AVG(rating)::numeric, 2) INTO v_avg
  FROM reviews
  WHERE outlet_id = NEW.outlet_id AND is_published = true;

  UPDATE daily_reports
  SET avg_rating = v_avg
  WHERE outlet_id = NEW.outlet_id AND report_date = v_booking_date;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_daily_report_avg_rating
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_report_avg_rating();
