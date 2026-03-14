"use client";

import { useEffect, useState } from "react";
import { getAdminOutlets } from "@ex-group/db";
import type { AdminOutletRow } from "@ex-group/db";

export default function AdminOutletsPage() {
  const [outlets, setOutlets] = useState<AdminOutletRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getAdminOutlets();
        if (!cancelled) setOutlets(data);
      } catch (err) {
        console.error("Failed to fetch outlets:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Outlets</h1>
        <p className="mt-1 text-sm text-slate-500">
          Overview of outlets you manage.
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
            <span className="text-sm text-slate-500">Loading outlets...</span>
          </div>
        </div>
      ) : outlets.length === 0 ? (
        <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-20">
          <p className="text-sm text-slate-400">
            No outlets found for your account.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {outlets.map((outlet) => (
            <OutletCard key={outlet.id} outlet={outlet} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// OutletCard
// ---------------------------------------------------------------------------

function OutletCard({ outlet }: { outlet: AdminOutletRow }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold text-slate-900">
            {outlet.name}
          </h3>
          <p className="mt-0.5 text-sm text-slate-500">{outlet.address}</p>
          <p className="text-xs text-slate-400">
            {outlet.city}, {outlet.country}
          </p>
        </div>
        <span
          className={`ml-2 inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            outlet.is_active
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {outlet.is_active ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Stats */}
      <div className="mt-5 grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-slate-50 px-3 py-2.5">
          <p className="text-xs font-medium text-slate-500">
            Today&#39;s Bookings
          </p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {outlet.todayBookings}
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2.5">
          <p className="text-xs font-medium text-slate-500">
            Active Stylists
          </p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {outlet.activeStylistCount}
          </p>
        </div>
      </div>

      {/* Contact */}
      {outlet.phone && (
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
          <PhoneIcon className="h-3.5 w-3.5" />
          <span>{outlet.phone}</span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
      />
    </svg>
  );
}
