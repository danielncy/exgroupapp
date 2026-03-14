export type BookingStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export interface Booking {
  id: string;
  customer_id: string;
  outlet_id: string;
  stylist_id: string | null;
  service_id: string;
  booking_date: string;     // "2026-03-15"
  start_time: string;       // "14:00"
  end_time: string;         // "15:00"
  status: BookingStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  cancelled_at: string | null;
  cancellation_reason: string | null;
}

export interface CreateBookingInput {
  outlet_id: string;
  stylist_id?: string;
  service_id: string;
  booking_date: string;
  start_time: string;
  notes?: string;
}
