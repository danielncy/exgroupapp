import { supabase } from "./client";
import type { AdminUser } from "@ex-group/shared/types/admin";
import type { Session } from "@supabase/supabase-js";

/**
 * Sign in an admin user with email and password.
 * Returns the session on success.
 */
export async function adminSignIn(
  email: string,
  password: string
): Promise<Session> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.session) {
    throw new Error("Sign-in succeeded but no session was returned");
  }

  // Verify this auth user actually has an admin_users record
  const { data: adminRecord, error: adminError } = await supabase
    .from("admin_users")
    .select("id, is_active")
    .eq("auth_user_id", data.session.user.id)
    .single();

  if (adminError || !adminRecord) {
    // Sign them out — they're not an admin
    await supabase.auth.signOut();
    throw new Error("This account does not have admin access");
  }

  if (!adminRecord.is_active) {
    await supabase.auth.signOut();
    throw new Error("This admin account has been deactivated");
  }

  return data.session;
}

/**
 * Sign out the current admin user.
 */
export async function adminSignOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Get the current admin user record from the admin_users table.
 * Returns null if the current auth user is not an admin.
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data, error } = await supabase
    .from("admin_users")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (error || !data) {
    return null;
  }

  return data as AdminUser;
}

/**
 * Check if the current auth user has an active admin_users record.
 */
export async function isAdmin(): Promise<boolean> {
  const adminUser = await getAdminUser();
  return adminUser !== null && adminUser.is_active;
}
