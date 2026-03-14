"use client";

import { useEffect, useState, useCallback, type ReactNode } from "react";
import { getAdminCustomers } from "@ex-group/db";
import type { AdminCustomerRow } from "@ex-group/db";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SortField = "display_name" | "phone" | "total_visits" | "last_visit" | "created_at";
type SortDir = "asc" | "desc";

const TIER_COLORS: Record<string, string> = {
  bronze: "bg-orange-50 text-orange-700 border-orange-200",
  silver: "bg-slate-100 text-slate-700 border-slate-300",
  gold: "bg-yellow-50 text-yellow-700 border-yellow-200",
  platinum: "bg-violet-50 text-violet-700 border-violet-200",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminCustomers({
        search: search || undefined,
        limit: 200,
      });
      setCustomers(data);
    } catch (err) {
      console.error("Failed to fetch customers:", err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchCustomers();
    }, 300); // debounce search
    return () => clearTimeout(timeout);
  }, [fetchCustomers]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  // Client-side sort
  const sorted = [...customers].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;

    switch (sortField) {
      case "display_name":
        return dir * a.display_name.localeCompare(b.display_name);
      case "phone":
        return dir * a.phone.localeCompare(b.phone);
      case "total_visits": {
        const aVisits = getTotalVisits(a);
        const bVisits = getTotalVisits(b);
        return dir * (aVisits - bVisits);
      }
      case "last_visit": {
        const aLast = getLastVisit(a) ?? "";
        const bLast = getLastVisit(b) ?? "";
        return dir * aLast.localeCompare(bLast);
      }
      case "created_at":
        return dir * a.created_at.localeCompare(b.created_at);
      default:
        return 0;
    }
  });

  const SortHeader = ({
    field,
    children,
  }: {
    field: SortField;
    children: ReactNode;
  }) => (
    <th
      className="cursor-pointer whitespace-nowrap px-4 py-3 font-medium text-slate-600 transition-colors hover:text-slate-900"
      onClick={() => handleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sortField === field && (
          <span className="text-xs">{sortDir === "asc" ? "\u2191" : "\u2193"}</span>
        )}
      </span>
    </th>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Customers</h1>
        <p className="mt-1 text-sm text-slate-500">
          Browse and manage customer profiles.
        </p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
        <span className="text-sm text-slate-500">
          {loading ? "Loading..." : `${customers.length} customer${customers.length === 1 ? "" : "s"}`}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <SortHeader field="display_name">Name</SortHeader>
                <SortHeader field="phone">Phone</SortHeader>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">
                  Memberships
                </th>
                <SortHeader field="total_visits">Total Visits</SortHeader>
                <SortHeader field="last_visit">Last Visit</SortHeader>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">
                  Tier
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
                      <span className="text-slate-500">Loading customers...</span>
                    </div>
                  </td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    No customers found.
                  </td>
                </tr>
              ) : (
                sorted.map((c) => {
                  const expanded = expandedId === c.id;
                  const totalVisits = getTotalVisits(c);
                  const lastVisit = getLastVisit(c);
                  const highestTier = getHighestTier(c);

                  return (
                    <CustomerRow
                      key={c.id}
                      customer={c}
                      expanded={expanded}
                      totalVisits={totalVisits}
                      lastVisit={lastVisit}
                      highestTier={highestTier}
                      onToggle={() =>
                        setExpandedId(expanded ? null : c.id)
                      }
                    />
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CustomerRow component
// ---------------------------------------------------------------------------

function CustomerRow({
  customer: c,
  expanded,
  totalVisits,
  lastVisit,
  highestTier,
  onToggle,
}: {
  customer: AdminCustomerRow;
  expanded: boolean;
  totalVisits: number;
  lastVisit: string | null;
  highestTier: string | null;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        className="cursor-pointer transition-colors hover:bg-slate-50"
        onClick={onToggle}
      >
        <td className="px-4 py-3">
          <p className="font-medium text-slate-900">
            {c.display_name || "—"}
          </p>
          {c.email && (
            <p className="text-xs text-slate-400">{c.email}</p>
          )}
        </td>
        <td className="px-4 py-3 text-slate-700">{c.phone}</td>
        <td className="px-4 py-3">
          {c.memberships.length > 0
            ? `${c.memberships.length} brand${c.memberships.length > 1 ? "s" : ""}`
            : "—"}
        </td>
        <td className="px-4 py-3 text-slate-700">{totalVisits}</td>
        <td className="px-4 py-3 text-slate-700">
          {lastVisit
            ? new Date(lastVisit).toLocaleDateString()
            : "—"}
        </td>
        <td className="px-4 py-3">
          {highestTier ? (
            <span
              className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${
                TIER_COLORS[highestTier] ??
                "bg-slate-50 text-slate-600 border-slate-200"
              }`}
            >
              {highestTier}
            </span>
          ) : (
            "—"
          )}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} className="p-0">
            <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">
              <h4 className="text-xs font-semibold uppercase text-slate-500">
                Brand Memberships
              </h4>
              {c.memberships.length === 0 ? (
                <p className="mt-2 text-sm text-slate-400">
                  No memberships yet.
                </p>
              ) : (
                <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {c.memberships.map((m) => (
                    <div
                      key={m.brand_id}
                      className="rounded-lg border border-slate-200 bg-white p-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-slate-500">
                          Brand
                        </p>
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${
                            TIER_COLORS[m.membership_tier] ??
                            "bg-slate-50 text-slate-600 border-slate-200"
                          }`}
                        >
                          {m.membership_tier}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-slate-900">
                        {m.total_visits} visits
                      </p>
                      <p className="text-xs text-slate-400">
                        Last:{" "}
                        {m.last_visit_at
                          ? new Date(m.last_visit_at).toLocaleDateString()
                          : "Never"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 text-xs text-slate-400">
                Customer since {new Date(c.created_at).toLocaleDateString()}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTotalVisits(c: AdminCustomerRow): number {
  return c.memberships.reduce((sum, m) => sum + m.total_visits, 0);
}

function getLastVisit(c: AdminCustomerRow): string | null {
  const dates = c.memberships
    .map((m) => m.last_visit_at)
    .filter((d): d is string => d !== null);
  if (dates.length === 0) return null;
  return dates.sort().reverse()[0] ?? null;
}

function getHighestTier(c: AdminCustomerRow): string | null {
  const order = ["platinum", "gold", "silver", "bronze"];
  for (const tier of order) {
    if (c.memberships.some((m) => m.membership_tier === tier)) {
      return tier;
    }
  }
  return c.memberships.length > 0
    ? c.memberships[0]?.membership_tier ?? null
    : null;
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function SearchIcon({ className }: { className?: string }) {
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
        d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
      />
    </svg>
  );
}
