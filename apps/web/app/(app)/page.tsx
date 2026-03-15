"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Button, Badge } from "@ex-group/ui";
import {
  getWalletBalance,
  getMyBookings,
  getMyStampCards,
  getMyMemberships,
  getUnreadCount,
} from "@ex-group/db";

interface BookingSummary {
  id: string;
  booking_date: string;
  start_time: string;
  status: string;
  service: { name: string } | null;
  outlet: { name: string } | null;
}

interface StampCardSummary {
  id: string;
  stamps_collected: number;
  stamps_required: number;
  brand?: { name: string } | null;
}

export default function DashboardPage() {
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [upcoming, setUpcoming] = useState<BookingSummary[]>([]);
  const [stampCards, setStampCards] = useState<StampCardSummary[]>([]);
  const [membershipCount, setMembershipCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [balance, bookings, stamps, memberships, notifCount] =
          await Promise.allSettled([
            getWalletBalance(),
            getMyBookings(),
            getMyStampCards(),
            getMyMemberships(),
            getUnreadCount(),
          ]);

        if (balance.status === "fulfilled") setWalletBalance(balance.value);
        if (bookings.status === "fulfilled") {
          const now = new Date().toISOString().split("T")[0]!;
          const upcomingBookings = (bookings.value as BookingSummary[]).filter(
            (b) => b.status !== "cancelled" && b.booking_date >= now
          );
          setUpcoming(upcomingBookings.slice(0, 3));
        }
        if (stamps.status === "fulfilled")
          setStampCards(stamps.value as StampCardSummary[]);
        if (memberships.status === "fulfilled")
          setMembershipCount((memberships.value as unknown[]).length);
        if (notifCount.status === "fulfilled")
          setUnreadCount(notifCount.value);
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-brand-primary" />
      </div>
    );

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
          <p className="mt-1 text-gray-500">
            Here&apos;s your account overview.
          </p>
        </div>
        {unreadCount > 0 && (
          <Link
            href="/notifications"
            className="relative rounded-full bg-gray-100 p-2.5 hover:bg-gray-200 transition"
          >
            <span className="text-xl">🔔</span>
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </Link>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-gray-500">Wallet Balance</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            ${walletBalance !== null ? (walletBalance / 100).toFixed(2) : "0.00"}
          </p>
          <Link href="/wallet" className="mt-2 inline-block text-sm text-brand-accent hover:underline">
            Top up →
          </Link>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Stamp Cards</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{stampCards.length}</p>
          <Link href="/loyalty" className="mt-2 inline-block text-sm text-brand-accent hover:underline">
            View stamps →
          </Link>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Memberships</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{membershipCount}</p>
          <Link href="/loyalty" className="mt-2 inline-block text-sm text-brand-accent hover:underline">
            View tiers →
          </Link>
        </Card>
      </div>

      {/* Quick actions */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link href="/book">
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <div className="flex flex-col items-center gap-3 text-center">
                <span className="text-3xl">📅</span>
                <div>
                  <h3 className="font-semibold text-gray-900">Book</h3>
                  <p className="mt-0.5 text-sm text-gray-500">
                    Schedule your next appointment
                  </p>
                </div>
              </div>
            </Card>
          </Link>
          <Link href="/wallet">
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <div className="flex flex-col items-center gap-3 text-center">
                <span className="text-3xl">💳</span>
                <div>
                  <h3 className="font-semibold text-gray-900">Top Up</h3>
                  <p className="mt-0.5 text-sm text-gray-500">
                    Add funds to your wallet
                  </p>
                </div>
              </div>
            </Card>
          </Link>
          <Link href="/loyalty">
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <div className="flex flex-col items-center gap-3 text-center">
                <span className="text-3xl">🏆</span>
                <div>
                  <h3 className="font-semibold text-gray-900">Rewards</h3>
                  <p className="mt-0.5 text-sm text-gray-500">
                    Check your loyalty stamps
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </section>

      {/* Upcoming bookings */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Upcoming Bookings
          </h2>
          <Link href="/bookings" className="text-sm text-brand-accent hover:underline">
            View all →
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <span className="text-4xl text-gray-300">📅</span>
              <p className="font-medium text-gray-600">No upcoming bookings</p>
              <p className="text-sm text-gray-400">
                Book your next appointment to get started.
              </p>
              <Link href="/book">
                <Button variant="primary" size="md">
                  Book Now
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcoming.map((b) => (
              <Card key={b.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {(b.service as { name: string } | null)?.name ?? "Appointment"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {(b.outlet as { name: string } | null)?.name ?? ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {b.booking_date}
                    </p>
                    <p className="text-xs text-gray-500">{b.start_time}</p>
                    <Badge variant={b.status === "confirmed" ? "success" : "default"}>
                      {b.status}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Stamp card preview */}
      {stampCards.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Your Stamps</h2>
            <Link href="/loyalty" className="text-sm text-brand-accent hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {stampCards.slice(0, 2).map((sc) => (
              <Card key={sc.id}>
                <p className="font-medium text-gray-900">
                  {(sc.brand as { name: string } | null)?.name ?? "Brand"}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-brand-accent transition-all"
                      style={{ width: `${Math.min((sc.stamps_collected / sc.stamps_required) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    {sc.stamps_collected}/{sc.stamps_required}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
