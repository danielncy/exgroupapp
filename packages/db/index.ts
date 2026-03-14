export { supabase, createServiceClient } from "./supabase/client";
export {
  signInWithPhone,
  verifyOtp,
  signOut,
  getSession,
  onAuthStateChange,
} from "./supabase/auth";
export type { AuthChangeEvent, AuthSession, Session, User } from "./supabase/auth";
export { useSession, useUser } from "./supabase/hooks";
