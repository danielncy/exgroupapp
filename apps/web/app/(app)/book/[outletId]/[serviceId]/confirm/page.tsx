"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase, createBooking, getWalletBalance, payWithWallet } from "@ex-group/db";
import { Card, Button, Badge } from "@ex-group/ui";
import type { Outlet, Service } from "@ex-group/shared/types/outlet";

type PaymentOption = "wallet" | "pay_later";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)} SGD`;
}

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

export default function ConfirmBookingPage() {
  const router = useRouter();
  const params = useParams<{ outletId: string; serviceId: string }>();
  const searchParams = useSearchParams();
  const { outletId, serviceId } = params;

  const date = searchParams.get("date") ?? "";
  const time = searchParams.get("time") ?? "";
  const stylistId = searchParams.get("stylist_id") ?? "";
  const stylistName = searchParams.get("stylist_name") ?? "";

  const [outlet, setOutlet] = useState<Outlet | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

  // Wallet payment state
  const [paymentMethod, setPaymentMethod] = useState<PaymentOption>("pay_later");
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletLoading, setWalletLoading] = useState(true);
  const [paidWithWallet, setPaidWithWallet] = useState(false);

  useEffect(() => {
    async function fetchMeta() {
      setLoading(true);

      const [outletRes, serviceRes] = await Promise.all([
        supabase.from("outlets").select("*").eq("id", outletId).single(),
        supabase.from("services").select("*").eq("id", serviceId).single(),
      ]);

      if (outletRes.error || !outletRes.data) {
        setError("Outlet not found.");
        setLoading(false);
        return;
      }
      if (serviceRes.error || !serviceRes.data) {
        setError("Service not found.");
        setLoading(false);
        return;
      }

      setOutlet(outletRes.data as Outlet);
      setService(serviceRes.data as Service);
      setLoading(false);
    }

    void fetchMeta();
  }, [outletId, serviceId]);

  // Load wallet balance
  useEffect(() => {
    async function loadWallet() {
      setWalletLoading(true);
      try {
        const bal = await getWalletBalance();
        setWalletBalance(bal);
      } catch {
        // Wallet not available — that's ok, user can still pay later
        setWalletBalance(0);
      } finally {
        setWalletLoading(false);
      }
    }
    void loadWallet();
  }, []);

  const canPayWithWallet =
    service !== null && walletBalance >= service.price_cents;

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);

    try {
      // 1. Create the booking
      const booking = await createBooking({
        outlet_id: outletId,
        service_id: serviceId,
        booking_date: date,
        start_time: time,
        stylist_id: stylistId || undefined,
        notes: notes.trim() || undefined,
      });

      // 2. If paying with wallet, deduct now
      if (paymentMethod === "wallet" && service) {
        try {
          await payWithWallet(booking.id, service.price_cents, outletId);
          setPaidWithWallet(true);
        } catch (payErr) {
          // Booking was created but payment failed — inform user
          setError(
            `Booking created, but wallet payment failed: ${
              payErr instanceof Error ? payErr.message : "Unknown error"
            }. You can pay at the outlet instead.`
          );
          setBookingId(booking.id);
          return;
        }
      }

      setBookingId(booking.id);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create booking.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  // Success state
  if (bookingId) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card variant="elevated">
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Booking Confirmed!</h2>
            <p className="text-sm text-gray-500">
              Your booking has been created successfully.
            </p>
            {paidWithWallet && (
              <Badge variant="success">Paid with Wallet</Badge>
            )}
            {!paidWithWallet && paymentMethod === "pay_later" && (
              <Badge variant="default">Pay at Outlet</Badge>
            )}
            <div className="rounded-lg bg-gray-50 px-4 py-2">
              <p className="text-xs text-gray-400">Booking ID</p>
              <p className="font-mono text-sm text-gray-700">{bookingId}</p>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="primary"
                size="md"
                onClick={() => router.push("/bookings")}
              >
                View My Bookings
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => router.push("/book")}
              >
                Book Another
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
        </div>
      </div>
    );
  }

  if (!date || !time) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-red-600">Missing booking details.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/book/${outletId}/${serviceId}`)}
            >
              Go Back
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/book/${outletId}/${serviceId}`}
          className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Back to time slots
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Confirm Your Booking</h1>
        <p className="mt-1 text-gray-500">Step 4 of 4 — Review and confirm</p>
      </div>

      {/* Summary */}
      <Card variant="elevated">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Booking Summary</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Outlet
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {outlet?.name ?? "\u2014"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Service
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {service?.name ?? "\u2014"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Date
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {formatDateLabel(date)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Time
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {formatTime(time)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Stylist
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {stylistName || "Any available"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Duration
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {service?.duration_minutes ?? "\u2014"} min
              </p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="text-xl font-bold text-gray-900">
                {service ? formatPrice(service.price_cents) : "\u2014"}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Payment Method */}
      <Card>
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Payment Method</h3>

          {/* Pay with Wallet */}
          <button
            type="button"
            onClick={() => {
              if (canPayWithWallet) {
                setPaymentMethod("wallet");
              }
            }}
            className={`flex w-full items-center gap-3 rounded-lg border-2 p-4 text-left transition-colors ${
              paymentMethod === "wallet"
                ? "border-gray-900 bg-gray-50"
                : "border-gray-200 hover:border-gray-300"
            } ${!canPayWithWallet ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
          >
            <div
              className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                paymentMethod === "wallet"
                  ? "border-gray-900"
                  : "border-gray-300"
              }`}
            >
              {paymentMethod === "wallet" && (
                <div className="h-2.5 w-2.5 rounded-full bg-gray-900" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                Pay with Wallet
              </p>
              <p className="text-xs text-gray-500">
                {walletLoading
                  ? "Loading balance..."
                  : `Balance: $${(walletBalance / 100).toFixed(2)} SGD`}
              </p>
              {!canPayWithWallet && !walletLoading && service && (
                <p className="mt-1 text-xs text-red-500">
                  Insufficient balance. Top up{" "}
                  <Link href="/wallet" className="underline">
                    here
                  </Link>
                  .
                </p>
              )}
            </div>
          </button>

          {/* Pay Later */}
          <button
            type="button"
            onClick={() => setPaymentMethod("pay_later")}
            className={`flex w-full items-center gap-3 rounded-lg border-2 p-4 text-left transition-colors ${
              paymentMethod === "pay_later"
                ? "border-gray-900 bg-gray-50"
                : "border-gray-200 hover:border-gray-300"
            } cursor-pointer`}
          >
            <div
              className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                paymentMethod === "pay_later"
                  ? "border-gray-900"
                  : "border-gray-300"
              }`}
            >
              {paymentMethod === "pay_later" && (
                <div className="h-2.5 w-2.5 rounded-full bg-gray-900" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                Pay Later (at outlet)
              </p>
              <p className="text-xs text-gray-500">
                Pay with cash or card when you arrive
              </p>
            </div>
          </button>
        </div>
      </Card>

      {/* Notes */}
      <Card>
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">
            Additional Notes (Optional)
          </h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special requests or preferences..."
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          />
        </div>
      </Card>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Confirm button */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          size="lg"
          onClick={() => router.push(`/book/${outletId}/${serviceId}`)}
        >
          Go Back
        </Button>
        <Button
          variant="primary"
          size="lg"
          loading={submitting}
          onClick={() => void handleConfirm()}
        >
          {paymentMethod === "wallet"
            ? `Pay ${service ? formatPrice(service.price_cents) : ""} & Confirm`
            : "Confirm Booking"}
        </Button>
      </div>
    </div>
  );
}
