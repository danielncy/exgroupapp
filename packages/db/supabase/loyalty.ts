import { supabase } from "./client";
import type {
  CustomerBrandMembership,
  LoyaltyLedgerEntry,
  LoyaltyTier,
  Reward,
  StampCard,
  Brand,
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
