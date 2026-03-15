import { supabase, createServiceClient } from "./client";
import type {
  CustomerBrandMembership,
  LoyaltyLedgerEntry,
  LoyaltyTier,
  Reward,
  RewardRedemption,
  StampCard,
  TierProgress,
  StreakInfo,
  Brand,
  MembershipTier,
} from "@ex-group/shared/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MembershipWithBrand extends CustomerBrandMembership {
  brand?: Pick<Brand, "id" | "code" | "name" | "type" | "primary_color" | "accent_color">;
}

export interface StampCardWithBrand extends StampCard {
  brand?: Pick<Brand, "id" | "code" | "name" | "type">;
}

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
// getMyMemberships — current user's brand memberships with brand info
// ---------------------------------------------------------------------------

export async function getMyMemberships(): Promise<MembershipWithBrand[]> {
  const customerId = await getCurrentCustomerId();

  const { data, error } = await supabase
    .from("customer_brand_memberships")
    .select(`
      *,
      brand:brands(id, code, name, type, primary_color, accent_color)
    `)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch memberships: ${error.message}`);
  }

  return (data ?? []) as MembershipWithBrand[];
}

// ---------------------------------------------------------------------------
// getMyStampCards — current user's stamp cards, optionally filtered by brand
// ---------------------------------------------------------------------------

export async function getMyStampCards(
  brandId?: string
): Promise<StampCardWithBrand[]> {
  const customerId = await getCurrentCustomerId();

  let query = supabase
    .from("stamp_cards")
    .select(`
      *,
      brand:brands(id, code, name, type)
    `)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (brandId) {
    query = query.eq("brand_id", brandId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch stamp cards: ${error.message}`);
  }

  return (data ?? []) as StampCardWithBrand[];
}

// ---------------------------------------------------------------------------
// getMyLoyaltyHistory — loyalty ledger entries for the current user
// ---------------------------------------------------------------------------

export async function getMyLoyaltyHistory(
  brandId?: string,
  limit?: number
): Promise<LoyaltyLedgerEntry[]> {
  const customerId = await getCurrentCustomerId();

  let query = supabase
    .from("loyalty_ledger")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (brandId) {
    query = query.eq("brand_id", brandId);
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch loyalty history: ${error.message}`);
  }

  return (data ?? []) as LoyaltyLedgerEntry[];
}

// ---------------------------------------------------------------------------
// getRewards — available rewards for a brand
// ---------------------------------------------------------------------------

export async function getRewards(brandId: string): Promise<Reward[]> {
  const { data, error } = await supabase
    .from("rewards")
    .select("*")
    .eq("brand_id", brandId)
    .eq("is_active", true)
    .order("points_cost", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch rewards: ${error.message}`);
  }

  return (data ?? []) as Reward[];
}

// ---------------------------------------------------------------------------
// getLoyaltyTiers — tier definitions for a brand
// ---------------------------------------------------------------------------

export async function getLoyaltyTiers(
  brandId: string
): Promise<LoyaltyTier[]> {
  const { data, error } = await supabase
    .from("loyalty_tiers")
    .select("*")
    .eq("brand_id", brandId)
    .order("min_points", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch loyalty tiers: ${error.message}`);
  }

  return (data ?? []) as LoyaltyTier[];
}

// ---------------------------------------------------------------------------
// getTierBenefits — benefits for a specific tier
// ---------------------------------------------------------------------------

export async function getTierBenefits(brandId: string, tierName: string) {
  const { data, error } = await supabase
    .from("loyalty_tiers")
    .select("benefits")
    .eq("brand_id", brandId)
    .eq("tier_name", tierName)
    .single();

  if (error) {
    throw new Error(`Failed to fetch tier benefits: ${error.message}`);
  }

  return data?.benefits;
}

// ---------------------------------------------------------------------------
// getMyTierProgress — tier progress for the current user
// ---------------------------------------------------------------------------

export async function getMyTierProgress(
  brandId: string
): Promise<TierProgress | null> {
  const customerId = await getCurrentCustomerId();

  const [membership, tiers] = await Promise.all([
    supabase
      .from("customer_brand_memberships")
      .select("*")
      .eq("customer_id", customerId)
      .eq("brand_id", brandId)
      .single()
      .then((r) => r.data as CustomerBrandMembership | null),
    getLoyaltyTiers(brandId),
  ]);

  if (!membership || tiers.length === 0) return null;

  const currentTier =
    tiers.find((t) => t.tier_name === membership.membership_tier) ?? tiers[0]!;
  const currentIdx = tiers.findIndex(
    (t) => t.tier_name === membership.membership_tier
  );
  const nextTier =
    currentIdx < tiers.length - 1 ? tiers[currentIdx + 1]! : null;

  const pointsToNextTier = nextTier
    ? Math.max(0, nextTier.min_points - membership.total_points)
    : 0;
  const progressPercent = nextTier
    ? Math.min(
        100,
        ((membership.total_points - currentTier.min_points) /
          (nextTier.min_points - currentTier.min_points)) *
          100
      )
    : 100;

  return {
    currentTier,
    nextTier,
    totalPoints: membership.total_points,
    pointsToNextTier,
    progressPercent,
  };
}

// ---------------------------------------------------------------------------
// getMyStreakInfo — streak info for the current user
// ---------------------------------------------------------------------------

const STREAK_MILESTONES: Record<number, number> = {
  4: 100,
  8: 250,
  12: 500,
  24: 1000,
};

export async function getMyStreakInfo(
  brandId: string
): Promise<StreakInfo | null> {
  const customerId = await getCurrentCustomerId();

  const { data } = await supabase
    .from("customer_brand_memberships")
    .select("current_streak, longest_streak, last_visit_at")
    .eq("customer_id", customerId)
    .eq("brand_id", brandId)
    .single();

  if (!data) return null;

  const milestones = [4, 8, 12, 24];
  const nextMilestone =
    milestones.find((m) => m > (data.current_streak ?? 0)) ?? null;

  return {
    currentStreak: data.current_streak ?? 0,
    longestStreak: data.longest_streak ?? 0,
    lastVisitAt: data.last_visit_at ?? null,
    nextMilestone,
    nextMilestonePoints: nextMilestone ? STREAK_MILESTONES[nextMilestone]! : null,
  };
}

// ---------------------------------------------------------------------------
// redeemReward — redeem a reward for points
// ---------------------------------------------------------------------------

export async function redeemReward(
  rewardId: string,
  brandId: string
): Promise<{ success: boolean; error?: string; remaining_points?: number; redemption_id?: string }> {
  const customerId = await getCurrentCustomerId();
  const sb = createServiceClient();

  const { data, error } = await sb.rpc("redeem_reward", {
    p_customer_id: customerId,
    p_reward_id: rewardId,
    p_brand_id: brandId,
  });

  if (error) {
    throw new Error(`Failed to redeem reward: ${error.message}`);
  }

  return data as { success: boolean; error?: string; remaining_points?: number; redemption_id?: string };
}

// ---------------------------------------------------------------------------
// getMyRedemptions — redemption history for the current user
// ---------------------------------------------------------------------------

export async function getMyRedemptions(
  brandId: string
): Promise<RewardRedemption[]> {
  const customerId = await getCurrentCustomerId();

  const { data, error } = await supabase
    .from("reward_redemptions")
    .select("*, rewards(*)")
    .eq("customer_id", customerId)
    .eq("brand_id", brandId)
    .order("redeemed_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch redemptions: ${error.message}`);
  }

  return (data ?? []).map((d: Record<string, unknown>) => ({
    ...(d as unknown as RewardRedemption),
    reward: d.rewards as Reward | undefined,
  }));
}

// ---------------------------------------------------------------------------
// updateDateOfBirth — set customer date of birth for birthday rewards
// ---------------------------------------------------------------------------

export async function updateDateOfBirth(dob: string): Promise<void> {
  const customerId = await getCurrentCustomerId();

  const { error } = await supabase
    .from("customers")
    .update({ date_of_birth: dob })
    .eq("id", customerId);

  if (error) {
    throw new Error(`Failed to update date of birth: ${error.message}`);
  }
}
