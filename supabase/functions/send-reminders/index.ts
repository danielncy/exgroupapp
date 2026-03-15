// supabase/functions/send-reminders/index.ts
// Daily cron job: sends booking reminders for tomorrow's appointments
// Schedule via Supabase dashboard: daily at 10:00 SGT (02:00 UTC)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call the SQL function that handles reminder logic
    const { data, error } = await supabase.rpc("send_booking_reminders");

    if (error) {
      throw new Error(`Failed to send reminders: ${error.message}`);
    }

    const count = data as number;

    // Also trigger push notifications for reminders
    // Fetch customers with push tokens who got reminders today
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    const { data: bookingsWithTokens } = await supabase
      .from("bookings")
      .select(`
        customer_id,
        start_time,
        services:service_id(name),
        outlets:outlet_id(name),
        customer_push_tokens!inner(expo_push_token)
      `)
      .eq("booking_date", tomorrowStr)
      .eq("status", "confirmed")
      .not("reminder_sent_at", "is", null);

    if (bookingsWithTokens && bookingsWithTokens.length > 0) {
      // Send push notifications via Expo Push API
      const messages = [];
      for (const booking of bookingsWithTokens as Array<Record<string, unknown>>) {
        const tokens = booking.customer_push_tokens as Array<{ expo_push_token: string }>;
        const service = booking.services as { name: string } | null;
        const outlet = booking.outlets as { name: string } | null;

        for (const token of tokens) {
          messages.push({
            to: token.expo_push_token,
            sound: "default",
            title: "Reminder: Appointment Tomorrow",
            body: `Your ${service?.name ?? "appointment"} at ${outlet?.name ?? "our outlet"} is tomorrow at ${booking.start_time}.`,
            data: { type: "booking_reminder" },
          });
        }
      }

      if (messages.length > 0) {
        await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(messages),
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, reminders_sent: count }),
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
