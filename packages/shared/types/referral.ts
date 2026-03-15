export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  brand_id: string;
  status: "pending" | "completed" | "rewarded";
  completed_at: string | null;
  rewarded_at: string | null;
  created_at: string;
  referred?: { display_name: string };
}

export interface ReferralStats {
  totalInvited: number;
  totalCompleted: number;
  totalRewarded: number;
  totalPointsEarned: number;
}
