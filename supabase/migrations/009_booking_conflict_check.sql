-- 009_booking_conflict_check.sql
-- Database-level booking conflict detection
-- Agent: MIKHAIL (Booking Engine)

-- Function: returns TRUE if a conflict exists (i.e. the proposed time overlaps
-- with an existing active booking for the same stylist on the same date).
CREATE OR REPLACE FUNCTION check_booking_conflict(
  p_stylist_id uuid,
  p_booking_date date,
  p_start_time time,
  p_end_time time
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM bookings
    WHERE stylist_id = p_stylist_id
      AND booking_date = p_booking_date
      AND status NOT IN ('cancelled', 'no_show')
      AND start_time < p_end_time
      AND end_time > p_start_time
  );
END;
$$;

-- Trigger function: raises an exception if a conflict is detected on INSERT.
-- This is the last line of defense — the app layer should check first via
-- the get-available-slots Edge Function, but the DB enforces it regardless.
CREATE OR REPLACE FUNCTION prevent_booking_conflict()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only check if a stylist is assigned and the booking is active
  IF NEW.stylist_id IS NOT NULL
    AND NEW.status NOT IN ('cancelled', 'no_show')
  THEN
    IF check_booking_conflict(
      NEW.stylist_id,
      NEW.booking_date,
      NEW.start_time,
      NEW.end_time
    ) THEN
      RAISE EXCEPTION 'Booking conflict: stylist % already has an overlapping booking on % between % and %',
        NEW.stylist_id, NEW.booking_date, NEW.start_time, NEW.end_time
        USING ERRCODE = 'exclusion_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_booking_conflict
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION prevent_booking_conflict();
