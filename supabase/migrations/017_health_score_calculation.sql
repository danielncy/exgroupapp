-- 017_health_score_calculation.sql
-- RFM health score calculation function + admin RLS policies

-- ---------------------------------------------------------------------------
-- calculate_health_scores() — RFM scoring for all active customers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION calculate_health_scores()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer := 0;
  v_customer record;
  v_recency integer;
  v_frequency integer;
  v_monetary integer;
  v_score integer;
  v_risk text;
  v_days_since_visit integer;
  v_visit_count integer;
  v_total_spend bigint;
BEGIN
  -- Clear previous scores
  DELETE FROM customer_health_scores;

  FOR v_customer IN
    SELECT id FROM customers WHERE deleted_at IS NULL
  LOOP
    -- Recency: days since last completed booking
    SELECT COALESCE(
      EXTRACT(DAY FROM now() - MAX(b.updated_at))::integer,
      365
    ) INTO v_days_since_visit
    FROM bookings b
    WHERE b.customer_id = v_customer.id AND b.status = 'completed';

    -- Recency score (0-33): fewer days = higher score
    v_recency := GREATEST(0, LEAST(33, 33 - (v_days_since_visit / 3)));

    -- Frequency: completed bookings in last 180 days
    SELECT COUNT(*) INTO v_visit_count
    FROM bookings
    WHERE customer_id = v_customer.id
      AND status = 'completed'
      AND updated_at >= now() - interval '180 days';

    -- Frequency score (0-33): more visits = higher score
    v_frequency := LEAST(33, v_visit_count * 5);

    -- Monetary: total spend in last 180 days
    SELECT COALESCE(SUM(total_cents), 0) INTO v_total_spend
    FROM transactions
    WHERE customer_id = v_customer.id
      AND status = 'completed'
      AND created_at >= now() - interval '180 days';

    -- Monetary score (0-34): higher spend = higher score
    v_monetary := LEAST(34, (v_total_spend / 5000)::integer);

    -- Combined score
    v_score := v_recency + v_frequency + v_monetary;

    -- Risk level
    v_risk := CASE
      WHEN v_score >= 70 THEN 'healthy'
      WHEN v_score >= 50 THEN 'cooling'
      WHEN v_score >= 30 THEN 'at_risk'
      WHEN v_score >= 10 THEN 'churning'
      ELSE 'churned'
    END;

    INSERT INTO customer_health_scores (
      customer_id, score, recency_score, frequency_score, monetary_score,
      risk_level, calculated_at
    ) VALUES (
      v_customer.id, v_score, v_recency, v_frequency, v_monetary,
      v_risk, now()
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- ---------------------------------------------------------------------------
-- Admin RLS policies for CRM tables (service role bypasses, but explicit)
-- ---------------------------------------------------------------------------

CREATE POLICY "health_scores_admin_select" ON customer_health_scores
  FOR SELECT USING (true);

CREATE POLICY "segments_admin_select" ON customer_segments
  FOR SELECT USING (true);

CREATE POLICY "segments_admin_insert" ON customer_segments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "segments_admin_update" ON customer_segments
  FOR UPDATE USING (true);

CREATE POLICY "segment_members_admin_select" ON customer_segment_members
  FOR SELECT USING (true);

CREATE POLICY "campaigns_admin_select" ON campaigns
  FOR SELECT USING (true);

CREATE POLICY "campaigns_admin_insert" ON campaigns
  FOR INSERT WITH CHECK (true);

CREATE POLICY "campaigns_admin_update" ON campaigns
  FOR UPDATE USING (true);

CREATE POLICY "campaign_events_admin_select" ON campaign_events
  FOR SELECT USING (true);
