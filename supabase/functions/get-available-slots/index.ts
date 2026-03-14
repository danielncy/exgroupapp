// supabase/functions/get-available-slots/index.ts
// Returns available booking time slots for a given outlet, service, and date.
// Agent: MIKHAIL (Booking Engine)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface SlotResult {
  stylist_id: string;
  stylist_name: string;
  time: string;
  available: boolean;
}

interface ServiceRow {
  id: string;
  duration_minutes: number;
  buffer_minutes: number;
}

interface StylistRow {
  id: string;
  name: string;
}

interface ScheduleRow {
  stylist_id: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface BookingRow {
  stylist_id: string;
  start_time: string;
  end_time: string;
}

/**
 * Parse a time string "HH:MM" or "HH:MM:SS" into total minutes since midnight.
 */
function timeToMinutes(time: string): number {
  const parts = time.split(":");
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

/**
 * Convert total minutes since midnight to "HH:MM" string.
 */
function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

/**
 * Check if a proposed slot [slotStart, slotEnd) overlaps with any existing booking.
 */
function hasConflict(
  slotStart: number,
  slotEnd: number,
  bookings: BookingRow[]
): boolean {
  for (const booking of bookings) {
    const bStart = timeToMinutes(booking.start_time);
    const bEnd = timeToMinutes(booking.end_time);
    // Overlap: slotStart < bEnd AND slotEnd > bStart
    if (slotStart < bEnd && slotEnd > bStart) {
      return true;
    }
  }
  return false;
}

/**
 * Get the day_of_week (0=Sunday, 6=Saturday) for a date string "YYYY-MM-DD"
 * interpreted in Asia/Singapore timezone.
 */
function getDayOfWeek(dateStr: string): number {
  // Create date at noon UTC to avoid DST edge cases, then convert to SG
  const date = new Date(`${dateStr}T12:00:00+08:00`);
  return date.getDay();
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { outlet_id, service_id, date, stylist_id } = await req.json();

    // Validate required inputs
    if (!outlet_id || !service_id || !date) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: outlet_id, service_id, date",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return new Response(
        JSON.stringify({ error: "Invalid date format. Use YYYY-MM-DD." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch the service to get duration + buffer
    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select("id, duration_minutes, buffer_minutes")
      .eq("id", service_id)
      .eq("is_active", true)
      .single();

    if (serviceError || !service) {
      return new Response(
        JSON.stringify({ error: "Service not found or inactive" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const typedService = service as ServiceRow;
    const totalMinutes = typedService.duration_minutes + typedService.buffer_minutes;

    // 2. Fetch stylists at the outlet (or the specific stylist)
    let stylistQuery = supabase
      .from("stylists")
      .select("id, name")
      .eq("outlet_id", outlet_id)
      .eq("is_active", true);

    if (stylist_id) {
      stylistQuery = stylistQuery.eq("id", stylist_id);
    }

    const { data: stylists, error: stylistsError } = await stylistQuery;

    if (stylistsError) {
      throw stylistsError;
    }

    if (!stylists || stylists.length === 0) {
      return new Response(
        JSON.stringify({ slots: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const typedStylists = stylists as StylistRow[];
    const stylistIds = typedStylists.map((s) => s.id);
    const dayOfWeek = getDayOfWeek(date);

    // 3. Fetch schedules for all relevant stylists on this day_of_week
    const { data: schedules, error: schedulesError } = await supabase
      .from("stylist_schedules")
      .select("stylist_id, start_time, end_time, is_available")
      .in("stylist_id", stylistIds)
      .eq("day_of_week", dayOfWeek)
      .eq("is_available", true);

    if (schedulesError) {
      throw schedulesError;
    }

    const typedSchedules = (schedules ?? []) as ScheduleRow[];
    const scheduleMap = new Map<string, ScheduleRow>();
    for (const s of typedSchedules) {
      scheduleMap.set(s.stylist_id, s);
    }

    // 4. Fetch existing bookings for all relevant stylists on this date
    //    Exclude cancelled and no_show statuses
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("stylist_id, start_time, end_time")
      .in("stylist_id", stylistIds)
      .eq("booking_date", date)
      .not("status", "in", '("cancelled","no_show")');

    if (bookingsError) {
      throw bookingsError;
    }

    const typedBookings = (bookings ?? []) as BookingRow[];

    // Group bookings by stylist_id
    const bookingsByStylist = new Map<string, BookingRow[]>();
    for (const b of typedBookings) {
      const existing = bookingsByStylist.get(b.stylist_id) ?? [];
      existing.push(b);
      bookingsByStylist.set(b.stylist_id, existing);
    }

    // 5. Generate available slots for each stylist
    const SLOT_INTERVAL = 30; // Generate slots every 30 minutes
    const slots: SlotResult[] = [];

    for (const stylist of typedStylists) {
      const schedule = scheduleMap.get(stylist.id);

      // If stylist has no schedule for this day, skip them
      if (!schedule) {
        continue;
      }

      const schedStart = timeToMinutes(schedule.start_time);
      const schedEnd = timeToMinutes(schedule.end_time);
      const stylistBookings = bookingsByStylist.get(stylist.id) ?? [];

      // Generate slots from schedule start to schedule end
      for (
        let slotStart = schedStart;
        slotStart + totalMinutes <= schedEnd;
        slotStart += SLOT_INTERVAL
      ) {
        const slotEnd = slotStart + totalMinutes;
        const conflict = hasConflict(slotStart, slotEnd, stylistBookings);

        slots.push({
          stylist_id: stylist.id,
          stylist_name: stylist.name,
          time: minutesToTime(slotStart),
          available: !conflict,
        });
      }
    }

    return new Response(
      JSON.stringify({ slots }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
