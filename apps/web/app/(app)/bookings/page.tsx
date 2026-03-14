"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyBookings, cancelBooking } from "@ex-group/db";
import type { BookingWithDetails } from "@ex-group/db";
import { Card, Button, Badge } from "@ex-group/ui";
import type { BookingStatus } from "@ex-group/shared/types/booking";

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-SG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h ?? "0", 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${display}:${m} ${ampm}`;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)} SGD`;
}

const STATUS_BADGE: Record<BookingStatus, { label: string; variant: "default" | "success" | "warning" | "danger" }> = {
  pending: { label: "Pending", variant: "warning" },
  confirmed: { label: "Confirmed", variant: "success" },
  in_progress: { label: "In Progress", variant: "success" },
  completed: { label: "Completed", variant: "default" },
  cancelled: { label: "Cancelled", variant: "danger" },
  no_show: { label: "No Show", variant: "danger" },
};

function isUpcoming(booking: BookingWithDetails): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const bookingDate = new Date(booking.booking_date + "T00:00:00");
  return (
    bookingDate >= today &&
    booking.status !== "cancelled" &&
    booking.status !== "completed" &&
    booking.status !== "no_show"
  );
}

export default function MyBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBookings() {
      setLoading(true);
      setError(null);

      try {
        const data = await getMyBookings();
        setBookings(data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load bookings.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    void fetchBookings();
  }, []);

  async function handleCancel(bookingId: string) {
    setCancellingId(bookingId);
    try {
      await cancelBooking(bookingId);
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId
            ? { ...b, status: "cancelled" as const, cancelled_at: new Date().toISOString() }
            : b
        )
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to cancel booking.";
      setError(message);
    } finally {
      setCancellingId(null);
      setShowCancelDialog(null);
    }
  }

  const upcoming = bookings.filter(isUpcoming);
  const past = bookings.filter((b) => !isUpcoming(b));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
          <p className="mt-1 text-gray-500">
            View and manage your appointments.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => router.push("/book")}
        >
          Book New
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && bookings.length === 0 && (
        <Card>
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-4xl text-gray-300">&#x1F4C5;</p>
            <p className="font-medium text-gray-600">No bookings yet</p>
            <p className="text-sm text-gray-400">
              Book your first appointment to get started.
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={() => router.push("/book")}
            >
              Book Now
            </Button>
          </div>
        </Card>
      )}

      {/* Upcoming */}
      {!loading && upcoming.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Upcoming ({upcoming.length})
          </h2>
          <div className="space-y-4">
            {upcoming.map((booking) => {
              const statusInfo = STATUS_BADGE[booking.status];
              return (
                <Card key={booking.id} className="relative">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {booking.service?.name ?? "Service"}
                        </h3>
                        <Badge variant={statusInfo.variant}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {booking.outlet?.name ?? "Outlet"} &mdash;{" "}
                        {booking.outlet?.address ?? ""}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                        <span>{formatDateLabel(booking.booking_date)}</span>
                        <span>
                          {formatTime(booking.start_time)} &ndash;{" "}
                          {formatTime(booking.end_time)}
                        </span>
                        {booking.stylist?.name && (
                          <span>with {booking.stylist.name}</span>
                        )}
                      </div>
                      {booking.service && (
                        <p className="text-sm font-medium text-gray-900">
                          {formatPrice(booking.service.price_cents)}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 gap-2">
                      {showCancelDialog === booking.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            Cancel this booking?
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowCancelDialog(null)}
                            disabled={cancellingId === booking.id}
                          >
                            No
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            className="bg-red-600 hover:bg-red-700"
                            loading={cancellingId === booking.id}
                            onClick={() => void handleCancel(booking.id)}
                          >
                            Yes, Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowCancelDialog(booking.id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Past */}
      {!loading && past.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Past ({past.length})
          </h2>
          <div className="space-y-4">
            {past.map((booking) => {
              const statusInfo = STATUS_BADGE[booking.status];
              return (
                <Card key={booking.id} className="opacity-75">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">
                        {booking.service?.name ?? "Service"}
                      </h3>
                      <Badge variant={statusInfo.variant}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {booking.outlet?.name ?? "Outlet"}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                      <span>{formatDateLabel(booking.booking_date)}</span>
                      <span>
                        {formatTime(booking.start_time)} &ndash;{" "}
                        {formatTime(booking.end_time)}
                      </span>
                      {booking.stylist?.name && (
                        <span>with {booking.stylist.name}</span>
                      )}
                    </div>
                    {booking.service && (
                      <p className="text-sm font-medium text-gray-900">
                        {formatPrice(booking.service.price_cents)}
                      </p>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
