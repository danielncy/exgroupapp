export type AdminRole =
  | "hq_admin"
  | "brand_manager"
  | "outlet_manager"
  | "staff";

export interface AdminUser {
  id: string;
  auth_user_id: string;
  email: string;
  display_name: string;
  role: AdminRole;
  brand_id: string | null;   // null for hq_admin (sees all)
  outlet_id: string | null;  // null for hq_admin and brand_manager
  is_active: boolean;
  created_at: string;
}
