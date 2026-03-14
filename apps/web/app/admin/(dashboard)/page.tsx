"use client";

import { useEffect, useState } from "react";
import { getAdminUser } from "@ex-group/db";
import type { AdminUser } from "@ex-group/shared/types/admin";

const STATS = [
  {
    label: "Bookings Today",
    value: "—",
    change: null,
    color: "bg-blue-50 text-blue-700",
  },
  {
    label: "Revenue (MTD)",
    value: "—",
    change: null,
    color: "bg-emerald-50 text-emerald-700",
  },
  {
    label: "Active Customers",
    value: "—",
    change: null,
    color: "bg-violet-50 text-violet-700",
  },
  {
    label: "Outlets Online",
    value: "—",
    change: null,
    color: "bg-amber-50 text-amber-700",
  },
] as const;

export default function AdminDashboardPage() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const user = await getAdminUser();
      if (!cancelled && user) {
        setAdmin(user);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const greeting = getGreeting();

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
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${stat.color}`}
              >
                —
              </span>
            </div>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Data will appear once connected
            </p>
          </div>
        ))}
      </div>

      {/* Placeholder sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Recent Bookings
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Latest bookings will show here once the booking engine is connected.
          </p>
          <div className="mt-6 flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-slate-200">
            <p className="text-sm text-slate-400">No data yet</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Outlet Performance
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Outlet-level metrics will appear here once daily reports are
            generated.
          </p>
          <div className="mt-6 flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-slate-200">
            <p className="text-sm text-slate-400">No data yet</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
