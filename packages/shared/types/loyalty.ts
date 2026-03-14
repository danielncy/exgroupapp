export type LoyaltyEntryType =
  | "earn_booking"
  | "earn_referral"
  | "earn_streak"
  | "earn_birthday"
  | "earn_cross_brand"
  | "redeem"
  | "expire"
  | "adjust";

export interface LoyaltyLedgerEntry {
  id: string;
  customer_id: string;
  brand_id: string;
  entry_type: LoyaltyEntryType;
  points: number;
  stamps: number;
  reference_type: string | null;
  reference_id: string | null;
  description: string;
  created_at: string;
}

export interface StampCard {
  id: string;
  customer_id: string;
  brand_id: string;
  card_type: string;
  stamps_collected: number;
  stamps_required: number;
  is_completed: boolean;
  reward_claimed: boolean;
  created_at: string;
  completed_at: string | null;
}

export interface LoyaltyTier {
  id: string;
  brand_id: string;
  tier_name: string;
  min_points: number;
  benefits: Record<string, unknown>;
  created_at: string;
}

export interface Reward {
  id: string;
  brand_id: string;
  name: string;
  description: string;
  points_cost: number;
  stamps_cost: number;
  reward_type: "discount" | "free_service" | "product" | "upgrade";
  is_active: boolean;
  created_at: string;
}
