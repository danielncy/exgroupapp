"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  submitReview,
  getReviewForBooking,
  getMyBookings,
} from "@ex-group/db";
import type { Review } from "@ex-group/shared/types/review";
import { Card, Button } from "@ex-group/ui";

interface BookingInfo {
  id: string;
  booking_date: string;
  start_time: string;
  status: string;
  service: { name: string } | null;
  outlet: { name: string } | null;
  stylist: { name: string } | null;
}

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;

  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [bookings, review] = await Promise.all([
        getMyBookings(),
        getReviewForBooking(bookingId),
      ]);

      const found = (bookings as BookingInfo[]).find((b) => b.id === bookingId);
      if (!found) {
        setError("Booking not found");
        return;
      }

      setBooking(found);

      if (review) {
        setExistingReview(review);
        setRating(review.rating);
        setComment(review.comment ?? "");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load booking");
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleSubmit() {
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await submitReview({
        booking_id: bookingId,
        rating,
        comment: comment.trim() || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg py-16">
        <div className="flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg py-16">
        <Card variant="elevated">
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              Thank you for your review!
            </h1>
            <p className="text-sm text-gray-500">
              Your feedback helps us improve our services.
            </p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} className="text-2xl">
                  {star <= rating ? "\u2605" : "\u2606"}
                </span>
              ))}
            </div>
            <Button variant="primary" onClick={() => router.push("/bookings")}>
              Back to Bookings
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {existingReview ? "Update Your Review" : "Rate Your Experience"}
        </h1>
        <p className="mt-1 text-gray-500">
          Share your feedback about your visit
        </p>
      </div>

      {/* Booking info */}
      {booking && (
        <Card className="mb-6">
          <div className="space-y-1">
            <p className="font-semibold text-gray-900">
              {booking.service?.name ?? "Appointment"}
            </p>
            <p className="text-sm text-gray-500">
              {booking.outlet?.name}
              {booking.stylist ? ` \u00b7 ${booking.stylist.name}` : ""}
            </p>
            <p className="text-sm text-gray-400">
              {new Date(booking.booking_date).toLocaleDateString("en-SG", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </Card>
      )}

      {/* Star rating */}
      <Card className="mb-6">
        <p className="mb-3 text-sm font-medium text-gray-700">
          How was your experience?
        </p>
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="text-4xl transition-transform hover:scale-110"
            >
              <span className={star <= rating ? "text-yellow-400" : "text-gray-300"}>
                {star <= rating ? "\u2605" : "\u2606"}
              </span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-center text-sm text-gray-500">
          {rating === 0 && "Tap a star to rate"}
          {rating === 1 && "Poor"}
          {rating === 2 && "Fair"}
          {rating === 3 && "Good"}
          {rating === 4 && "Very Good"}
          {rating === 5 && "Excellent"}
        </p>
      </Card>

      {/* Comment */}
      <Card className="mb-6">
        <label
          htmlFor="comment"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Comments (optional)
        </label>
        <textarea
          id="comment"
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell us about your experience..."
          className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          maxLength={500}
        />
        <p className="mt-1 text-right text-xs text-gray-400">
          {comment.length}/500
        </p>
      </Card>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          size="lg"
          className="flex-1"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          size="lg"
          className="flex-1"
          loading={submitting}
          onClick={() => void handleSubmit()}
        >
          {existingReview ? "Update Review" : "Submit Review"}
        </Button>
      </div>
    </div>
  );
}
