export type MembershipTier = "bronze" | "silver" | "gold" | "platinum";

export interface Customer {
  id: string;
  auth_user_id: string;
  phone: string;
  email: string | null;
  display_name: string;
  avatar_url: string | null;
  preferred_language: "en" | "ms" | "zh";
  referral_code: string;
  marketing_consent: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CustomerBrandMembership {
  id: string;
  customer_id: string;
  brand_id: string;
  membership_tier: MembershipTier;
  total_points: number;
  first_visit_at: string | null;
  last_visit_at: string | null;
  total_visits: number;
  created_at: string;
}

export interface CustomerPreferences {
  id: string;
  customer_id: string;
  preferred_outlet_id: string | null;
  preferred_stylist_id: string | null;
  hair_type: string | null;
  skin_type: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
