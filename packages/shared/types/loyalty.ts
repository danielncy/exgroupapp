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
  benefits: TierBenefits;
  created_at: string;
}

export interface TierBenefits {
  discount_pct: number;
  points_multiplier: number;
  priority_booking?: boolean;
  birthday_bonus_multiplier: number;
  free_birthday_service?: boolean;
}

export interface TierProgress {
  currentTier: LoyaltyTier;
  nextTier: LoyaltyTier | null;
  totalPoints: number;
  pointsToNextTier: number;
  progressPercent: number;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastVisitAt: string | null;
  nextMilestone: number | null;
  nextMilestonePoints: number | null;
}

export interface Reward {
  id: string;
  brand_id: string;
  name: string;
  description: string;
  points_cost: number;
  stamps_cost: number;
  reward_type: "discount" | "free_service" | "product" | "upgrade";
  min_tier: string;
  is_active: boolean;
  created_at: string;
}

export interface RewardRedemption {
  id: string;
  customer_id: string;
  reward_id: string;
  brand_id: string;
  points_spent: number;
  status: "pending" | "used" | "expired";
  redeemed_at: string;
  expires_at: string;
  reward?: Reward;
}

export interface CustomerRiskEvent {
  id: string;
  customer_id: string;
  brand_id: string;
  from_level: string;
  to_level: string;
  detected_at: string;
  customer?: { display_name: string };
}
