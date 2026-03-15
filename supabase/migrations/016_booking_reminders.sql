-- 016_booking_reminders.sql
-- Booking reminder system: daily job inserts reminder notifications

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;

-- ---------------------------------------------------------------------------
-- send_booking_reminders() — finds tomorrow's bookings without reminders
-- and creates booking_reminder notifications
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION send_booking_reminders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tomorrow date;
  v_count integer := 0;
  v_booking record;
BEGIN
  -- Tomorrow in Singapore timezone
  v_tomorrow := (now() AT TIME ZONE 'Asia/Singapore' + interval '1 day')::date;

  FOR v_booking IN
    SELECT
      b.id,
      b.customer_id,
      b.start_time,
      s.name AS service_name,
      o.name AS outlet_name
    FROM bookings b
    JOIN services s ON s.id = b.service_id
    JOIN outlets o ON o.id = b.outlet_id
    WHERE b.booking_date = v_tomorrow
      AND b.status = 'confirmed'
      AND b.reminder_sent_at IS NULL
  LOOP
    -- Insert reminder notification
    INSERT INTO notifications (customer_id, type, title, body, data)
    VALUES (
      v_booking.customer_id,
      'booking_reminder',
      'Reminder: Appointment Tomorrow',
      'Your ' || COALESCE(v_booking.service_name, 'appointment') ||
        ' at ' || COALESCE(v_booking.outlet_name, 'our outlet') ||
        ' is tomorrow at ' || to_char(v_booking.start_time, 'HH12:MI AM') || '.',
      jsonb_build_object(
        'booking_id', v_booking.id,
        'service_name', v_booking.service_name,
        'outlet_name', v_booking.outlet_name,
        'start_time', v_booking.start_time
      )
    );

    -- Mark reminder as sent
    UPDATE bookings SET reminder_sent_at = now() WHERE id = v_booking.id;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;
