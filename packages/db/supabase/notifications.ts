import { supabase } from "./client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export async function getMyNotifications(limit = 50) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!customer) throw new Error("Customer not found");

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getUnreadCount(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!customer) return 0;

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", customer.id)
    .eq("is_read", false);

  if (error) return 0;
  return count ?? 0;
}

export async function markAsRead(notificationId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);

  if (error) throw new Error(error.message);
}

export async function markAllAsRead() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!customer) throw new Error("Customer not found");

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("customer_id", customer.id)
    .eq("is_read", false);

  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Realtime subscriptions
// ---------------------------------------------------------------------------

let realtimeChannel: RealtimeChannel | null = null;

export interface RealtimeNotification {
  id: string;
  customer_id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

/**
 * Subscribe to realtime notification inserts for the current customer.
 * Calls `onNewNotification` whenever a new row is inserted.
 */
export async function subscribeToNotifications(
  onNewNotification: (notification: RealtimeNotification) => void
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!customer) return;

  const customerId = (customer as { id: string }).id;

  // Unsubscribe existing channel if any
  if (realtimeChannel) {
    await supabase.removeChannel(realtimeChannel);
  }

  realtimeChannel = supabase
    .channel("notifications-realtime")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `customer_id=eq.${customerId}`,
      },
      (payload) => {
        onNewNotification(payload.new as RealtimeNotification);
      }
    )
    .subscribe();
}

/**
 * Unsubscribe from realtime notifications.
 */
export async function unsubscribeNotifications(): Promise<void> {
  if (realtimeChannel) {
    await supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
}
