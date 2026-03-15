export { supabase, createServiceClient } from "./supabase/client";
export {
  signInWithPhone,
  verifyOtp,
  signOut,
  getSession,
  onAuthStateChange,
} from "./supabase/auth";
export type { AuthChangeEvent, AuthSession, Session, User } from "./supabase/auth";
export { useSession, useUser, useBrandDetection } from "./supabase/hooks";
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
  getAdminBookings,
  updateBookingStatus,
  getAdminOutlets,
  getAdminStats,
  getAdminCustomers,
  getAdminReviews,
} from "./supabase/admin";
export type {
  AdminBooking,
  AdminBookingFilters,
  AdminStats,
  AdminCustomerRow,
  AdminOutletRow,
} from "./supabase/admin";
export {
  getMyMemberships,
  getMyStampCards,
  getMyLoyaltyHistory,
  getRewards,
  getLoyaltyTiers,
  getTierBenefits,
  getMyTierProgress,
  getMyStreakInfo,
  redeemReward,
  getMyRedemptions,
  updateDateOfBirth,
} from "./supabase/loyalty";
export type {
  MembershipWithBrand,
  StampCardWithBrand,
} from "./supabase/loyalty";
export {
  getMyReferralCode,
  applyReferralCode,
  getMyReferrals,
  getMyReferralStats,
} from "./supabase/referrals";
export {
  getOrCreateWallet,
  getWalletBalance,
  getWalletHistory,
  topUpWallet,
  getCheckoutSessionStatus,
  payWithWallet,
  getPackages,
  getMyPackages,
  purchasePackage,
} from "./supabase/wallet";
export type {
  PackageWithDetails,
  CustomerPackageWithDetails,
} from "./supabase/wallet";
export {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  subscribeToNotifications,
  unsubscribeNotifications,
} from "./supabase/notifications";
export type { RealtimeNotification } from "./supabase/notifications";
export {
  submitReview,
  getReviewForBooking,
  getOutletReviews,
  getStylistReviews,
} from "./supabase/reviews";
export {
  getBrands,
  getCustomerPrimaryBrand,
} from "./supabase/brand";
export {
  calculateHealthScores,
  getHealthScores,
  getSegments,
  getSegmentMembers,
  createCampaign,
  getCampaigns,
  getCampaignStats,
  getRiskTransitions,
  getChurnAlerts,
} from "./supabase/crm";
export type {
  HealthScore,
  Segment,
  Campaign,
  CampaignStats,
  CreateCampaignInput,
  RiskTransition,
} from "./supabase/crm";
export {
  registerPushToken,
  deactivatePushToken,
} from "./supabase/push";
