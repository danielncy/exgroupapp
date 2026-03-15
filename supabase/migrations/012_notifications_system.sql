-- 012_notifications_system.sql
-- Notifications table, RLS, and booking-triggered notifications
-- Agent: ANDREW (CRM & Intelligence)

-- ---------------------------------------------------------------------------
-- 1. Notifications table
-- ---------------------------------------------------------------------------

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id uuid NOT NULL REFERENCES customers(id),
  type text NOT NULL CHECK (type IN (
    'booking_confirmed',
    'booking_reminder',
    'post_visit',
    'loyalty_reward',
    'promotion',
    'system'
  )),
  title text NOT NULL,
  body text NOT NULL,
  data jsonb DEFAULT '{}',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_notifications_customer ON notifications(customer_id);
CREATE INDEX idx_notifications_customer_unread ON notifications(customer_id)
  WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ---------------------------------------------------------------------------
-- 2. RLS — customers can read/update their own notifications
-- ---------------------------------------------------------------------------

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (
    customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (
    customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- 3. Trigger: post-visit notifications (booking completed)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION create_post_visit_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_service_name text;
  v_outlet_name text;
BEGIN
  -- Only fire when status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    -- Look up service and outlet names
    SELECT s.name INTO v_service_name
    FROM services s WHERE s.id = NEW.service_id;

    SELECT o.name INTO v_outlet_name
    FROM outlets o WHERE o.id = NEW.outlet_id;

    -- "Thanks for visiting" notification
    INSERT INTO notifications (customer_id, type, title, body, data)
    VALUES (
      NEW.customer_id,
      'post_visit',
      'Thanks for visiting!',
      'We hope you enjoyed your ' || COALESCE(v_service_name, 'appointment') ||
        ' at ' || COALESCE(v_outlet_name, 'our outlet') || '. See you again soon!',
      jsonb_build_object(
        'booking_id', NEW.id,
        'service_name', v_service_name,
        'outlet_name', v_outlet_name
      )
    );

    -- "Rate your experience" follow-up notification
    INSERT INTO notifications (customer_id, type, title, body, data)
    VALUES (
      NEW.customer_id,
      'post_visit',
      'Rate your experience',
      'How was your ' || COALESCE(v_service_name, 'visit') ||
        '? Your feedback helps us improve.',
      jsonb_build_object(
        'booking_id', NEW.id,
        'action', 'rate',
        'action_url', '/bookings/' || NEW.id || '/review'
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_post_visit_notification
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION create_post_visit_notification();

-- ---------------------------------------------------------------------------
-- 4. Trigger: booking confirmed notification
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION create_booking_confirmed_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_service_name text;
  v_outlet_name text;
BEGIN
  -- Only fire when status changes to 'confirmed'
  IF NEW.status = 'confirmed' AND (OLD.status IS DISTINCT FROM 'confirmed') THEN
    SELECT s.name INTO v_service_name
    FROM services s WHERE s.id = NEW.service_id;

    SELECT o.name INTO v_outlet_name
    FROM outlets o WHERE o.id = NEW.outlet_id;

    INSERT INTO notifications (customer_id, type, title, body, data)
    VALUES (
      NEW.customer_id,
      'booking_confirmed',
      'Your booking is confirmed',
      'Your ' || COALESCE(v_service_name, 'appointment') ||
        ' at ' || COALESCE(v_outlet_name, 'our outlet') ||
        ' on ' || to_char(NEW.booking_date, 'DD Mon YYYY') ||
        ' at ' || to_char(NEW.start_time, 'HH12:MI AM') ||
        ' is confirmed.',
      jsonb_build_object(
        'booking_id', NEW.id,
        'booking_date', NEW.booking_date,
        'start_time', NEW.start_time,
        'service_name', v_service_name,
        'outlet_name', v_outlet_name
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_booking_confirmed_notification
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION create_booking_confirmed_notification();
