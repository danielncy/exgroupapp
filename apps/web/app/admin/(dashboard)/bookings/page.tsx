"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getAdminUser,
  getAdminBookings,
  getAdminOutlets,
  updateBookingStatus,
} from "@ex-group/db";
import type { AdminBooking, AdminOutletRow } from "@ex-group/db";
import type { AdminUser } from "@ex-group/shared/types/admin";
import type { BookingStatus } from "@ex-group/shared/types/booking";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No Show" },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  in_progress: "bg-indigo-50 text-indigo-700 border-indigo-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  no_show: "bg-slate-100 text-slate-600 border-slate-200",
};

type DatePreset = "today" | "week" | "custom";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminBookingsPage() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [outlets, setOutlets] = useState<AdminOutletRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filters
  const [datePreset, setDatePreset] = useState<DatePreset>("today");
  const [customDate, setCustomDate] = useState(getTodayString());
  const [statusFilter, setStatusFilter] = useState("");
  const [outletFilter, setOutletFilter] = useState("");

  const showOutletFilter =
    admin?.role === "hq_admin" || admin?.role === "brand_manager";

  const getFilterDate = useCallback((): string | undefined => {
    if (datePreset === "today") return getTodayString();
    if (datePreset === "custom") return customDate;
    return undefined; // "week" — no date filter, shows all recent
  }, [datePreset, customDate]);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminBookings({
        date: getFilterDate(),
        status: statusFilter ? (statusFilter as BookingStatus) : undefined,
        outletId: outletFilter || undefined,
      });
      setBookings(data);
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
    } finally {
      setLoading(false);
    }
  }, [getFilterDate, statusFilter, outletFilter]);

  // Initial load
  useEffect(() => {
    let cancelled = false;

    async function init() {
      const user = await getAdminUser();
      if (cancelled || !user) return;
      setAdmin(user);

      if (user.role === "hq_admin" || user.role === "brand_manager") {
        const outletList = await getAdminOutlets(user);
        if (!cancelled) setOutlets(outletList);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch bookings when filters change
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleStatusChange = async (
    bookingId: string,
    newStatus: BookingStatus
  ) => {
    setActionLoading(bookingId);
    try {
      await updateBookingStatus(bookingId, newStatus);
      await fetchBookings();
    } catch (err) {
      console.error("Failed to update status:", err);
      alert(
        err instanceof Error ? err.message : "Failed to update booking status"
      );
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Bookings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage and track all bookings across your outlets.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        {/* Date preset */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Date Range
          </label>
          <div className="flex rounded-lg border border-slate-200 bg-white">
            {(["today", "week", "custom"] as DatePreset[]).map((preset) => (
              <button
                key={preset}
                onClick={() => setDatePreset(preset)}
                className={`px-3 py-2 text-sm font-medium capitalize transition-colors first:rounded-l-lg last:rounded-r-lg ${
                  datePreset === preset
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {preset === "week" ? "This Week" : preset}
              </button>
            ))}
          </div>
        </div>

        {datePreset === "custom" && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Date
            </label>
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            />
          </div>
        )}

        {/* Status filter */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Outlet filter */}
        {showOutletFilter && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Outlet
            </label>
            <select
              value={outletFilter}
              onChange={(e) => setOutletFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            >
              <option value="">All outlets</option>
              {outlets.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Booking count */}
        <div className="ml-auto text-sm text-slate-500">
          {loading ? "Loading..." : `${bookings.length} booking${bookings.length === 1 ? "" : "s"}`}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">
                  Time
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">
                  Customer
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">
                  Service
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">
                  Stylist
                </th>
                {showOutletFilter && (
                  <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">
                    Outlet
                  </th>
                )}
                <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">
                  Status
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={showOutletFilter ? 7 : 6} className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
                      <span className="text-slate-500">Loading bookings...</span>
                    </div>
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={showOutletFilter ? 7 : 6} className="px-4 py-12 text-center text-slate-400">
                    No bookings found for the selected filters.
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr
                    key={b.id}
                    className="transition-colors hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-4 py-3">
                      <p className="font-medium text-slate-900">
                        {b.start_time?.slice(0, 5)}–{b.end_time?.slice(0, 5)}
                      </p>
                      <p className="text-xs text-slate-400">{b.booking_date}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">
                        {b.customer?.display_name ?? "Unknown"}
                      </p>
                      <p className="text-xs text-slate-400">
                        {b.customer?.phone ?? "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-900">
                        {b.service?.name ?? "—"}
                      </p>
                      {b.service && (
                        <p className="text-xs text-slate-400">
                          {formatPrice(b.service.price_cents, b.service.currency)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {b.stylist?.name ?? "—"}
                    </td>
                    {showOutletFilter && (
                      <td className="px-4 py-3 text-slate-700">
                        {b.outlet?.name ?? "—"}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${
                          STATUS_COLORS[b.status] ?? "bg-slate-50 text-slate-600 border-slate-200"
                        }`}
                      >
                        {b.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {actionLoading === b.id ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
                      ) : (
                        <ActionButtons
                          status={b.status}
                          onAction={(newStatus) =>
                            handleStatusChange(b.id, newStatus)
                          }
                        />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ActionButtons({
  status,
  onAction,
}: {
  status: BookingStatus;
  onAction: (newStatus: BookingStatus) => void;
}) {
  if (status === "completed" || status === "cancelled" || status === "no_show") {
    return <span className="text-xs text-slate-400">—</span>;
  }

  return (
    <div className="flex gap-1">
      {status === "pending" && (
        <button
          onClick={() => onAction("confirmed")}
          className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
        >
          Confirm
        </button>
      )}
      {(status === "pending" || status === "confirmed" || status === "in_progress") && (
        <button
          onClick={() => onAction("completed")}
          className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
        >
          Complete
        </button>
      )}
      {(status === "pending" || status === "confirmed") && (
        <button
          onClick={() => onAction("no_show")}
          className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200"
        >
          No-show
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatPrice(cents: number, currency: string): string {
  const amount = cents / 100;
  const symbol = currency === "SGD" ? "S$" : "RM";
  return `${symbol}${amount.toFixed(2)}`;
}
