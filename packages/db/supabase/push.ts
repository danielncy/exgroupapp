import { supabase } from "./client";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getCurrentCustomerId(): Promise<string> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Not authenticated");

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (customerError || !customer) throw new Error("Customer profile not found");
  return customer.id as string;
}

// ---------------------------------------------------------------------------
// registerPushToken — store or re-activate an Expo push token
// ---------------------------------------------------------------------------

export async function registerPushToken(
  expoPushToken: string,
  deviceType: "ios" | "android"
): Promise<void> {
  const customerId = await getCurrentCustomerId();

  const { error } = await supabase
    .from("customer_push_tokens")
    .upsert(
      {
        customer_id: customerId,
        expo_push_token: expoPushToken,
        device_type: deviceType,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "customer_id,expo_push_token" }
    );

  if (error) {
    throw new Error(`Failed to register push token: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// deactivatePushToken — mark a token as inactive (e.g. on sign-out)
// ---------------------------------------------------------------------------

export async function deactivatePushToken(
  expoPushToken: string
): Promise<void> {
  const customerId = await getCurrentCustomerId();

  const { error } = await supabase
    .from("customer_push_tokens")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("customer_id", customerId)
    .eq("expo_push_token", expoPushToken);

  if (error) {
    throw new Error(`Failed to deactivate push token: ${error.message}`);
  }
}
