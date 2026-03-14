"use client";

import { useEffect, useState } from "react";
import { getAdminUser, getAdminStats, getAdminBookings, getAdminCustomers } from "@ex-group/db";
import type { AdminUser } from "@ex-group/shared/types/admin";
import type { AdminStats, AdminBooking } from "@ex-group/db";

interface DashboardData {
  todayStats: AdminStats;
  monthStats: AdminStats;
  recentBookings: AdminBooking[];
  activeCustomerCount: number;
}

export default function AdminDashboardPage() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const user = await getAdminUser();
        if (cancelled || !user) return;
        setAdmin(user);

        const today = new Date().toISOString().slice(0, 10);
        const monthStart = today.slice(0, 7) + "-01";

        const [todayStats, monthStats, recentBookings, customers] =
          await Promise.all([
            getAdminStats(undefined, { from: today, to: today }),
            getAdminStats(undefined, { from: monthStart, to: today }),
            getAdminBookings({ date: today }),
            getAdminCustomers({ limit: 1000 }),
          ]);

        if (cancelled) return;

        setData({
          todayStats,
          monthStats,
          recentBookings,
          activeCustomerCount: customers.length,
        });
      } catch (err) {
        // Silently fail — stats show as 0
        console.error("Failed to load dashboard data:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const greeting = getGreeting();

  const stats = [
    {
      label: "Bookings Today",
      value: data ? String(data.todayStats.totalBookings) : "—",
      badge: data
        ? `${data.todayStats.completedBookings} completed`
        : "—",
      color: "bg-blue-50 text-blue-700",
    },
    {
      label: "Revenue (MTD)",
      value: data
        ? formatCurrency(data.monthStats.revenueCents, data.monthStats.currency)
        : "—",
      badge: data
        ? `${data.monthStats.completedBookings} bookings`
        : "—",
      color: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Active Customers",
      value: data ? String(data.activeCustomerCount) : "—",
      badge: null,
      color: "bg-violet-50 text-violet-700",
    },
    {
      label: "Cancellations (MTD)",
      value: data ? String(data.monthStats.cancellations) : "—",
      badge: data && data.monthStats.totalBookings > 0
        ? `${Math.round(
            (data.monthStats.cancellations / data.monthStats.totalBookings) * 100
          )}% rate`
        : "—",
      color: "bg-amber-50 text-amber-700",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          {greeting}
          {admin ? `, ${admin.display_name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Here&#39;s what&#39;s happening across your outlets today.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              {stat.badge && (
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${stat.color}`}
                >
                  {stat.badge}
                </span>
              )}
            </div>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              {loading ? (
                <span className="inline-block h-8 w-20 animate-pulse rounded bg-slate-200" />
              ) : (
                stat.value
              )}
            </p>
          </div>
        ))}
      </div>

      {/* Recent bookings & summary */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Today&#39;s Bookings
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Latest bookings for today
          </p>
          {loading ? (
            <div className="mt-6 flex h-48 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
            </div>
          ) : data && data.recentBookings.length > 0 ? (
            <div className="mt-4 divide-y divide-slate-100">
              {data.recentBookings.slice(0, 8).map((b) => (
                <div key={b.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {b.customer?.display_name ?? "Unknown"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {b.start_time?.slice(0, 5)} — {b.service?.name ?? "Service"}
                      {b.stylist ? ` with ${b.stylist.name}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-slate-200">
              <p className="text-sm text-slate-400">No bookings today</p>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Month-to-Date Summary
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Performance metrics for this month
          </p>
          {loading ? (
            <div className="mt-6 flex h-48 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
            </div>
          ) : data ? (
            <div className="mt-4 space-y-4">
              <SummaryRow
                label="Total Bookings"
                value={String(data.monthStats.totalBookings)}
              />
              <SummaryRow
                label="Completed"
                value={String(data.monthStats.completedBookings)}
              />
              <SummaryRow
                label="Cancellations"
                value={String(data.monthStats.cancellations)}
              />
              <SummaryRow
                label="Revenue"
                value={formatCurrency(data.monthStats.revenueCents, data.monthStats.currency)}
              />
            </div>
          ) : (
            <div className="mt-6 flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-slate-200">
              <p className="text-sm text-slate-400">No data yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
    confirmed: "bg-blue-50 text-blue-700 border-blue-200",
    in_progress: "bg-indigo-50 text-indigo-700 border-indigo-200",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
    no_show: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <span
      className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${
        map[status] ?? "bg-slate-50 text-slate-600 border-slate-200"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatCurrency(cents: number, currency: string): string {
  const amount = cents / 100;
  const symbol = currency === "SGD" ? "S$" : "RM";
  return `${symbol}${amount.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
