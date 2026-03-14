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
export {
  adminSignIn,
  adminSignOut,
  getAdminUser,
  isAdmin,
} from "./supabase/admin-auth";
export {
  getAvailableSlots,
  createBooking,
  getMyBookings,
  cancelBooking,
} from "./supabase/bookings";
export type {
  AvailableSlot,
  AvailableSlotsResponse,
  BookingWithDetails,
} from "./supabase/bookings";
export {
  getMyMemberships,
  getMyStampCards,
  getMyLoyaltyHistory,
  getRewards,
  getLoyaltyTiers,
} from "./supabase/loyalty";
export type {
  MembershipWithBrand,
  StampCardWithBrand,
} from "./supabase/loyalty";
