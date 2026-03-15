import { supabase } from "./client";
import type { Brand, BrandId } from "@ex-group/shared/types/brand";

// ---------------------------------------------------------------------------
// getBrands — fetch all brands
// ---------------------------------------------------------------------------

export async function getBrands(): Promise<Brand[]> {
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .order("name");

  if (error) {
    throw new Error(`Failed to fetch brands: ${error.message}`);
  }

  return (data ?? []) as Brand[];
}

// ---------------------------------------------------------------------------
// getCustomerPrimaryBrand — detect the customer's primary brand
// Priority: highest total_visits across memberships, fallback "ex_style"
// ---------------------------------------------------------------------------

export async function getCustomerPrimaryBrand(): Promise<BrandId> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return "ex_style";

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!customer) return "ex_style";

  const { data: memberships } = await supabase
    .from("customer_brand_memberships")
    .select("brand_id, total_visits")
    .eq("customer_id", (customer as { id: string }).id)
    .order("total_visits", { ascending: false })
    .limit(1);

  if (memberships && memberships.length > 0) {
    return (memberships[0] as { brand_id: BrandId }).brand_id;
  }

  return "ex_style";
}
