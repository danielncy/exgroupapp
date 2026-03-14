import { supabase } from "./client";
import type {
  AuthChangeEvent,
  AuthSession,
  Session,
  Subscription,
  User,
} from "@supabase/supabase-js";

/**
 * Send an OTP to a Singapore phone number.
 * Expects a local number (e.g. "91234567") — the +65 prefix is added automatically.
 */
export async function signInWithPhone(phone: string): Promise<void> {
  const formattedPhone = phone.startsWith("+65") ? phone : `+65${phone}`;

  const { error } = await supabase.auth.signInWithOtp({
    phone: formattedPhone,
  });

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Verify the 6-digit OTP sent to a phone number.
 * Returns the session on success.
 */
export async function verifyOtp(
  phone: string,
  token: string
): Promise<Session> {
  const formattedPhone = phone.startsWith("+65") ? phone : `+65${phone}`;

  const { data, error } = await supabase.auth.verifyOtp({
    phone: formattedPhone,
    token,
    type: "sms",
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.session) {
    throw new Error("Verification succeeded but no session was returned");
  }

  return data.session;
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Get the current session (or null if not authenticated).
 */
export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  return data.session;
}

/**
 * Subscribe to auth state changes (sign in, sign out, token refresh, etc.).
 * Returns an unsubscribe function.
 */
export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void
): Subscription {
  const { data } = supabase.auth.onAuthStateChange(callback);
  return data.subscription;
}

export type { AuthChangeEvent, AuthSession, Session, User };
