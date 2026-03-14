"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@ex-group/db";
import { Card, Input, Badge } from "@ex-group/ui";
import type { Outlet } from "@ex-group/shared/types/outlet";

interface Brand {
  id: string;
  name: string;
  code: string;
}

const BRAND_LABELS: Record<string, string> = {
  ex_style: "EX Style",
  ex_beauty: "EX Beauty",
  uhair: "UHair",
  coulisse: "Coulisse",
};

export default function SelectOutletPage() {
  const router = useRouter();
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchOutlets() {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("outlets")
        .select("*")
        .eq("is_active", true)
        .eq("country", "SG")
        .order("name");

      if (fetchError) {
        setError("Failed to load outlets. Please try again.");
        setLoading(false);
        return;
      }

      setOutlets((data as Outlet[]) ?? []);
      setLoading(false);
    }

    void fetchOutlets();
  }, []);

  const brandIds = Array.from(new Set(outlets.map((o) => o.brand_id)));

  const filtered = outlets.filter((outlet) => {
    if (brandFilter !== "all" && outlet.brand_id !== brandFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        outlet.name.toLowerCase().includes(q) ||
        outlet.address.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const grouped = filtered.reduce<Record<string, Outlet[]>>((acc, outlet) => {
    const key = outlet.brand_id;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key]!.push(outlet);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Book an Appointment</h1>
        <p className="mt-1 text-gray-500">Step 1 of 4 — Select an outlet</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <Input
            placeholder="Search outlets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setBrandFilter("all")}
            className={[
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              brandFilter === "all"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200",
            ].join(" ")}
          >
            All Brands
          </button>
          {brandIds.map((bid) => (
            <button
              key={bid}
              onClick={() => setBrandFilter(bid)}
              className={[
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                brandFilter === bid
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              ].join(" ")}
            >
              {BRAND_LABELS[bid] ?? bid}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
        </div>
      )}

      {/* Error */}
      {error && (
        <Card>
          <p className="text-center text-red-600">{error}</p>
        </Card>
      )}

      {/* Empty */}
      {!loading && !error && filtered.length === 0 && (
        <Card>
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-4xl text-gray-300">&#x1F50D;</p>
            <p className="font-medium text-gray-600">No outlets found</p>
            <p className="text-sm text-gray-400">
              Try adjusting your search or filter.
            </p>
          </div>
        </Card>
      )}

      {/* Outlets grouped by brand */}
      {!loading &&
        !error &&
        Object.entries(grouped).map(([brandId, brandOutlets]) => (
          <section key={brandId}>
            <h2 className="mb-3 text-lg font-semibold text-gray-900">
              {BRAND_LABELS[brandId] ?? brandId}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {brandOutlets.map((outlet) => (
                <Card
                  key={outlet.id}
                  className="cursor-pointer transition-shadow hover:shadow-md"
                  onClick={() => router.push(`/book/${outlet.id}`)}
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-gray-900">
                        {outlet.name}
                      </h3>
                      <Badge>{BRAND_LABELS[outlet.brand_id] ?? outlet.brand_id}</Badge>
                    </div>
                    <p className="text-sm text-gray-500">{outlet.address}</p>
                    <p className="text-xs text-gray-400">{outlet.phone}</p>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}
