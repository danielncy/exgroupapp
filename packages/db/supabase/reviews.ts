import { supabase } from "./client";
import type {
  Review,
  ReviewWithDetails,
  CreateReviewInput,
} from "@ex-group/shared/types/review";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getCurrentCustomerId(): Promise<string> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Not authenticated");

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (customerError || !customer) throw new Error("Customer profile not found");
  return customer.id as string;
}

// ---------------------------------------------------------------------------
// submitReview — create or update a review for a completed booking
// ---------------------------------------------------------------------------

export async function submitReview(input: CreateReviewInput): Promise<Review> {
  const customerId = await getCurrentCustomerId();

  // Verify booking belongs to customer and is completed
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, customer_id, outlet_id, stylist_id, status")
    .eq("id", input.booking_id)
    .single();

  if (bookingError || !booking) {
    throw new Error("Booking not found");
  }

  const typedBooking = booking as {
    id: string;
    customer_id: string;
    outlet_id: string;
    stylist_id: string | null;
    status: string;
  };

  if (typedBooking.customer_id !== customerId) {
    throw new Error("This booking does not belong to you");
  }

  if (typedBooking.status !== "completed") {
    throw new Error("You can only review completed bookings");
  }

  if (input.rating < 1 || input.rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  // Upsert: insert or update existing review
  const { data: review, error } = await supabase
    .from("reviews")
    .upsert(
      {
        booking_id: input.booking_id,
        customer_id: customerId,
        outlet_id: typedBooking.outlet_id,
        stylist_id: typedBooking.stylist_id,
        rating: input.rating,
        comment: input.comment ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "booking_id" }
    )
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to submit review: ${error.message}`);
  }

  return review as Review;
}

// ---------------------------------------------------------------------------
// getReviewForBooking — get the review for a specific booking
// ---------------------------------------------------------------------------

export async function getReviewForBooking(
  bookingId: string
): Promise<Review | null> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("booking_id", bookingId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch review: ${error.message}`);
  }

  return data as Review | null;
}

// ---------------------------------------------------------------------------
// getOutletReviews — published reviews for an outlet
// ---------------------------------------------------------------------------

export async function getOutletReviews(
  outletId: string,
  limit = 20
): Promise<ReviewWithDetails[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select(`
      *,
      customer:customers(id, display_name, avatar_url),
      stylist:stylists(id, name)
    `)
    .eq("outlet_id", outletId)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch outlet reviews: ${error.message}`);
  }

  return (data ?? []) as unknown as ReviewWithDetails[];
}

// ---------------------------------------------------------------------------
// getStylistReviews — published reviews for a stylist
// ---------------------------------------------------------------------------

export async function getStylistReviews(
  stylistId: string,
  limit = 20
): Promise<ReviewWithDetails[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select(`
      *,
      customer:customers(id, display_name, avatar_url)
    `)
    .eq("stylist_id", stylistId)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch stylist reviews: ${error.message}`);
  }

  return (data ?? []) as unknown as ReviewWithDetails[];
}
