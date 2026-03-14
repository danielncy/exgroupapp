import { supabase } from "./client";
import type { Booking, CreateBookingInput } from "@ex-group/shared/types/booking";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AvailableSlot {
  stylist_id: string;
  stylist_name: string;
  time: string;
  available: boolean;
}

export interface AvailableSlotsResponse {
  slots: AvailableSlot[];
}

export interface BookingWithDetails extends Booking {
  outlet?: { id: string; name: string; address: string };
  service?: { id: string; name: string; duration_minutes: number; price_cents: number; currency: string };
  stylist?: { id: string; name: string; avatar_url: string | null };
}

// ---------------------------------------------------------------------------
// getAvailableSlots — calls the Supabase Edge Function
// ---------------------------------------------------------------------------

export async function getAvailableSlots(
  outletId: string,
  serviceId: string,
  date: string,
  stylistId?: string
): Promise<AvailableSlotsResponse> {
  const { data, error } = await supabase.functions.invoke<AvailableSlotsResponse>(
    "get-available-slots",
    {
      body: {
        outlet_id: outletId,
        service_id: serviceId,
        date,
        ...(stylistId ? { stylist_id: stylistId } : {}),
      },
    }
  );

  if (error) {
    throw new Error(`Failed to fetch available slots: ${error.message}`);
  }

  if (!data) {
    throw new Error("No data returned from get-available-slots");
  }

  return data;
}

// ---------------------------------------------------------------------------
// createBooking — inserts a booking with end_time calculation + conflict guard
// ---------------------------------------------------------------------------

export async function createBooking(
  input: CreateBookingInput
): Promise<Booking> {
  // 1. Get the current user's customer_id
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("Not authenticated");
  }

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (customerError || !customer) {
    throw new Error("Customer profile not found");
  }

  // 2. Fetch the service to calculate end_time
  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("duration_minutes, buffer_minutes")
    .eq("id", input.service_id)
    .single();

  if (serviceError || !service) {
    throw new Error("Service not found");
  }

  // 3. Calculate end_time from start_time + duration + buffer
  const totalMinutes = (service as { duration_minutes: number; buffer_minutes: number }).duration_minutes
    + (service as { duration_minutes: number; buffer_minutes: number }).buffer_minutes;
  const endTime = addMinutesToTime(input.start_time, totalMinutes);

  // 4. Insert the booking — the DB trigger will reject conflicts
  const { data: booking, error: insertError } = await supabase
    .from("bookings")
    .insert({
      customer_id: customer.id as string,
      outlet_id: input.outlet_id,
      stylist_id: input.stylist_id ?? null,
      service_id: input.service_id,
      booking_date: input.booking_date,
      start_time: input.start_time,
      end_time: endTime,
      status: "pending",
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (insertError) {
    // Surface conflict errors with a clear message
    if (insertError.code === "P0001" || insertError.message.includes("Booking conflict")) {
      throw new Error(
        "This time slot is no longer available. Please choose a different time."
      );
    }
    throw new Error(`Failed to create booking: ${insertError.message}`);
  }

  return booking as Booking;
}

// ---------------------------------------------------------------------------
// getMyBookings — returns the current user's bookings with related data
// ---------------------------------------------------------------------------

export async function getMyBookings(): Promise<BookingWithDetails[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("Not authenticated");
  }

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (customerError || !customer) {
    throw new Error("Customer profile not found");
  }

  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select(`
      *,
      outlet:outlets(id, name, address),
      service:services(id, name, duration_minutes, price_cents, currency),
      stylist:stylists(id, name, avatar_url)
    `)
    .eq("customer_id", customer.id as string)
    .order("booking_date", { ascending: false })
    .order("start_time", { ascending: false });

  if (bookingsError) {
    throw new Error(`Failed to fetch bookings: ${bookingsError.message}`);
  }

  return (bookings ?? []) as BookingWithDetails[];
}

// ---------------------------------------------------------------------------
// cancelBooking — soft-cancels a booking with optional reason
// ---------------------------------------------------------------------------

export async function cancelBooking(
  bookingId: string,
  reason?: string
): Promise<Booking> {
  const { data: booking, error } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason ?? null,
    })
    .eq("id", bookingId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to cancel booking: ${error.message}`);
  }

  return booking as Booking;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function addMinutesToTime(time: string, minutes: number): string {
  const parts = time.split(":");
  const totalMinutes = parseInt(parts[0] ?? "0", 10) * 60 + parseInt(parts[1] ?? "0", 10) + minutes;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}
