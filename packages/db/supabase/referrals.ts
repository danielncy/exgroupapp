import { supabase, createServiceClient } from "./client";
import type { Referral, ReferralStats } from "@ex-group/shared/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getCurrentCustomerId(): Promise<string> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
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

  return customer.id as string;
}

// ---------------------------------------------------------------------------
// getMyReferralCode — current user's referral code
// ---------------------------------------------------------------------------

export async function getMyReferralCode(): Promise<string | null> {
  const customerId = await getCurrentCustomerId();

  const { data } = await supabase
    .from("customers")
    .select("referral_code")
    .eq("id", customerId)
    .single();

  return (data?.referral_code as string) ?? null;
}

// ---------------------------------------------------------------------------
// applyReferralCode — apply a friend's referral code
// ---------------------------------------------------------------------------

export async function applyReferralCode(
  code: string,
  brandId: string
): Promise<{ success: boolean; error?: string; referrer_name?: string }> {
  const customerId = await getCurrentCustomerId();
  const sb = createServiceClient();

  const { data, error } = await sb.rpc("apply_referral_code", {
    p_customer_id: customerId,
    p_referral_code: code,
    p_brand_id: brandId,
  });

  if (error) {
    throw new Error(`Failed to apply referral code: ${error.message}`);
  }

  return data as { success: boolean; error?: string; referrer_name?: string };
}

// ---------------------------------------------------------------------------
// getMyReferrals — list of customers I've referred
// ---------------------------------------------------------------------------

export async function getMyReferrals(brandId: string): Promise<Referral[]> {
  const customerId = await getCurrentCustomerId();

  const { data, error } = await supabase
    .from("referrals")
    .select(`
      *,
      referred:referred_id(display_name)
    `)
    .eq("referrer_id", customerId)
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch referrals: ${error.message}`);
  }

  return (data ?? []).map((d: Record<string, unknown>) => ({
    ...(d as unknown as Referral),
    referred: d.referred
      ? { display_name: (d.referred as { display_name: string }).display_name }
      : undefined,
  }));
}

// ---------------------------------------------------------------------------
// getMyReferralStats — referral statistics
// ---------------------------------------------------------------------------

export async function getMyReferralStats(
  brandId: string
): Promise<ReferralStats> {
  const customerId = await getCurrentCustomerId();

  const [referralsRes, pointsRes] = await Promise.all([
    supabase
      .from("referrals")
      .select("status")
      .eq("referrer_id", customerId)
      .eq("brand_id", brandId),
    supabase
      .from("loyalty_ledger")
      .select("points")
      .eq("customer_id", customerId)
      .eq("brand_id", brandId)
      .eq("entry_type", "earn_referral"),
  ]);

  const all = (referralsRes.data ?? []) as Array<{ status: string }>;
  const points = (pointsRes.data ?? []) as Array<{ points: number }>;

  return {
    totalInvited: all.length,
    totalCompleted: all.filter(
      (r) => r.status === "completed" || r.status === "rewarded"
    ).length,
    totalRewarded: all.filter((r) => r.status === "rewarded").length,
    totalPointsEarned: points.reduce((sum, p) => sum + p.points, 0),
  };
}
