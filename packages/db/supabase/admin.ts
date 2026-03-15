import { createServiceClient } from "./client";
import { getAdminUser } from "./admin-auth";
import type { AdminUser } from "@ex-group/shared/types/admin";
import type { BookingStatus } from "@ex-group/shared/types/booking";
import type { ReviewWithDetails } from "@ex-group/shared/types/review";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdminBookingFilters {
  outletId?: string;
  date?: string;
  status?: BookingStatus;
}

export interface AdminBooking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  customer: { id: string; display_name: string; phone: string } | null;
  service: { id: string; name: string; price_cents: number; currency: string } | null;
  stylist: { id: string; name: string } | null;
  outlet: { id: string; name: string } | null;
}

export interface AdminStats {
  totalBookings: number;
  completedBookings: number;
  cancellations: number;
  revenueCents: number;
  currency: string;
}

export interface AdminCustomerRow {
  id: string;
  display_name: string;
  phone: string;
  email: string | null;
  created_at: string;
  memberships: Array<{
    brand_id: string;
    membership_tier: string;
    total_visits: number;
    last_visit_at: string | null;
  }>;
}

export interface AdminOutletRow {
  id: string;
  brand_id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  phone: string | null;
  is_active: boolean;
  todayBookings: number;
  activeStylistCount: number;
}

// ---------------------------------------------------------------------------
// Helpers — scope queries based on admin role
// ---------------------------------------------------------------------------

function getServiceSupabase() {
  // Use service role client to bypass RLS for admin operations
  return createServiceClient();
}

async function getOutletIdsForAdmin(admin: AdminUser): Promise<string[] | null> {
  // Returns null if admin can see ALL outlets (hq_admin)
  if (admin.role === "hq_admin") return null;

  const sb = getServiceSupabase();

  if (admin.role === "outlet_manager" || admin.role === "staff") {
    if (!admin.outlet_id) return [];
    return [admin.outlet_id];
  }

  if (admin.role === "brand_manager") {
    if (!admin.brand_id) return [];
    const { data } = await sb
      .from("outlets")
      .select("id")
      .eq("brand_id", admin.brand_id)
      .eq("is_active", true);
    return (data ?? []).map((o) => (o as { id: string }).id);
  }

  return [];
}

// ---------------------------------------------------------------------------
// getAdminBookings
// ---------------------------------------------------------------------------

export async function getAdminBookings(
  filters?: AdminBookingFilters
): Promise<AdminBooking[]> {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Not authenticated as admin");

  const sb = getServiceSupabase();
  const outletIds = await getOutletIdsForAdmin(admin);

  let query = sb
    .from("bookings")
    .select(`
      id, booking_date, start_time, end_time, status, notes, created_at, updated_at,
      customer:customers(id, display_name, phone),
      service:services(id, name, price_cents, currency),
      stylist:stylists(id, name),
      outlet:outlets(id, name)
    `)
    .order("booking_date", { ascending: false })
    .order("start_time", { ascending: false })
    .limit(200);

  // Scope by admin's accessible outlets
  if (outletIds !== null) {
    if (outletIds.length === 0) return [];
    query = query.in("outlet_id", outletIds);
  }

  // Apply optional filters
  if (filters?.outletId) {
    query = query.eq("outlet_id", filters.outletId);
  }
  if (filters?.date) {
    query = query.eq("booking_date", filters.date);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch admin bookings: ${error.message}`);
  }

  return (data ?? []) as unknown as AdminBooking[];
}

// ---------------------------------------------------------------------------
// updateBookingStatus
// ---------------------------------------------------------------------------

export async function updateBookingStatus(
  bookingId: string,
  newStatus: BookingStatus
): Promise<void> {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Not authenticated as admin");

  const sb = getServiceSupabase();

  // Verify the booking belongs to an outlet the admin can access
  const outletIds = await getOutletIdsForAdmin(admin);

  const { data: booking, error: fetchError } = await sb
    .from("bookings")
    .select("id, outlet_id")
    .eq("id", bookingId)
    .single();

  if (fetchError || !booking) {
    throw new Error("Booking not found");
  }

  const bookingOutlet = (booking as { id: string; outlet_id: string }).outlet_id;
  if (outletIds !== null && !outletIds.includes(bookingOutlet)) {
    throw new Error("You do not have access to this booking");
  }

  const updatePayload: Record<string, unknown> = { status: newStatus };
  if (newStatus === "cancelled") {
    updatePayload.cancelled_at = new Date().toISOString();
  }

  const { error: updateError } = await sb
    .from("bookings")
    .update(updatePayload)
    .eq("id", bookingId);

  if (updateError) {
    throw new Error(`Failed to update booking status: ${updateError.message}`);
  }
}

// ---------------------------------------------------------------------------
// getAdminOutlets
// ---------------------------------------------------------------------------

export async function getAdminOutlets(
  adminUser?: AdminUser
): Promise<AdminOutletRow[]> {
  const admin = adminUser ?? (await getAdminUser());
  if (!admin) throw new Error("Not authenticated as admin");

  const sb = getServiceSupabase();
  const outletIds = await getOutletIdsForAdmin(admin);

  let outletQuery = sb
    .from("outlets")
    .select("id, brand_id, name, address, city, country, phone, is_active")
    .eq("is_active", true);

  if (outletIds !== null) {
    if (outletIds.length === 0) return [];
    outletQuery = outletQuery.in("id", outletIds);
  }

  const { data: outlets, error: outletError } = await outletQuery;

  if (outletError) {
    throw new Error(`Failed to fetch outlets: ${outletError.message}`);
  }

  if (!outlets || outlets.length === 0) return [];

  const ids = (outlets as Array<{ id: string }>).map((o) => o.id);
  const today = new Date().toISOString().slice(0, 10);

  // Fetch today's bookings count per outlet
  const { data: bookingCounts } = await sb
    .from("bookings")
    .select("outlet_id")
    .in("outlet_id", ids)
    .eq("booking_date", today)
    .not("status", "in", '("cancelled","no_show")');

  const countMap = new Map<string, number>();
  for (const row of bookingCounts ?? []) {
    const oid = (row as { outlet_id: string }).outlet_id;
    countMap.set(oid, (countMap.get(oid) ?? 0) + 1);
  }

  // Fetch active stylist counts per outlet
  const { data: stylistRows } = await sb
    .from("stylists")
    .select("outlet_id")
    .in("outlet_id", ids)
    .eq("is_active", true);

  const stylistMap = new Map<string, number>();
  for (const row of stylistRows ?? []) {
    const oid = (row as { outlet_id: string }).outlet_id;
    stylistMap.set(oid, (stylistMap.get(oid) ?? 0) + 1);
  }

  return (outlets as Array<Record<string, unknown>>).map((o) => ({
    id: o.id as string,
    brand_id: o.brand_id as string,
    name: o.name as string,
    address: o.address as string,
    city: o.city as string,
    country: o.country as string,
    phone: o.phone as string | null,
    is_active: o.is_active as boolean,
    todayBookings: countMap.get(o.id as string) ?? 0,
    activeStylistCount: stylistMap.get(o.id as string) ?? 0,
  }));
}

// ---------------------------------------------------------------------------
// getAdminStats
// ---------------------------------------------------------------------------

export async function getAdminStats(
  outletId?: string,
  dateRange?: { from: string; to: string }
): Promise<AdminStats> {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Not authenticated as admin");

  const sb = getServiceSupabase();
  const outletIds = await getOutletIdsForAdmin(admin);

  const from = dateRange?.from ?? new Date().toISOString().slice(0, 10);
  const to = dateRange?.to ?? new Date().toISOString().slice(0, 10);

  let query = sb
    .from("bookings")
    .select("id, status, outlet_id")
    .gte("booking_date", from)
    .lte("booking_date", to);

  if (outletId) {
    query = query.eq("outlet_id", outletId);
  } else if (outletIds !== null) {
    if (outletIds.length === 0) {
      return { totalBookings: 0, completedBookings: 0, cancellations: 0, revenueCents: 0, currency: "MYR" };
    }
    query = query.in("outlet_id", outletIds);
  }

  const { data: bookings, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch admin stats: ${error.message}`);
  }

  const rows = (bookings ?? []) as Array<{ id: string; status: string; outlet_id: string }>;
  const totalBookings = rows.length;
  const completedBookings = rows.filter((b) => b.status === "completed").length;
  const cancellations = rows.filter((b) => b.status === "cancelled").length;

  // Get revenue from daily_reports if available
  let revenueCents = 0;
  let currency = "MYR";

  let revenueQuery = sb
    .from("daily_reports")
    .select("revenue_cents, currency")
    .gte("report_date", from)
    .lte("report_date", to);

  if (outletId) {
    revenueQuery = revenueQuery.eq("outlet_id", outletId);
  } else if (outletIds !== null && outletIds.length > 0) {
    revenueQuery = revenueQuery.in("outlet_id", outletIds);
  }

  const { data: reports } = await revenueQuery;

  for (const report of (reports ?? []) as Array<{ revenue_cents: number; currency: string }>) {
    revenueCents += report.revenue_cents;
    currency = report.currency;
  }

  return { totalBookings, completedBookings, cancellations, revenueCents, currency };
}

// ---------------------------------------------------------------------------
// getAdminCustomers
// ---------------------------------------------------------------------------

export async function getAdminCustomers(
  filters?: { search?: string; limit?: number }
): Promise<AdminCustomerRow[]> {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Not authenticated as admin");

  const sb = getServiceSupabase();
  const limit = filters?.limit ?? 100;

  let query = sb
    .from("customers")
    .select(`
      id, display_name, phone, email, created_at,
      memberships:customer_brand_memberships(brand_id, membership_tier, total_visits, last_visit_at)
    `)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  // For brand_manager, filter customers who have a membership for their brand
  // For outlet_manager, we still show customers but we cannot scope by outlet easily here,
  // so we show all customers (they see them through bookings scope anyway)

  if (filters?.search) {
    const term = `%${filters.search}%`;
    query = query.or(`display_name.ilike.${term},phone.ilike.${term}`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch admin customers: ${error.message}`);
  }

  return (data ?? []) as unknown as AdminCustomerRow[];
}

// ---------------------------------------------------------------------------
// getAdminReviews — list reviews (admin scoped by outlet access)
// ---------------------------------------------------------------------------

export async function getAdminReviews(
  filters?: { outletId?: string; limit?: number }
): Promise<ReviewWithDetails[]> {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Not authenticated as admin");

  const sb = getServiceSupabase();
  const outletIds = await getOutletIdsForAdmin(admin);
  const limit = filters?.limit ?? 100;

  let query = sb
    .from("reviews")
    .select(`
      *,
      customer:customers(id, display_name, avatar_url),
      outlet:outlets(id, name),
      stylist:stylists(id, name),
      booking:bookings(id, booking_date, service:services(id, name))
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters?.outletId) {
    query = query.eq("outlet_id", filters.outletId);
  } else if (outletIds !== null) {
    if (outletIds.length === 0) return [];
    query = query.in("outlet_id", outletIds);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch admin reviews: ${error.message}`);
  }

  return (data ?? []) as unknown as ReviewWithDetails[];
}
