"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@ex-group/db";
import { Card, Badge, Button } from "@ex-group/ui";
import type { Outlet, Service } from "@ex-group/shared/types/outlet";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)} SGD`;
}

export default function SelectServicePage() {
  const router = useRouter();
  const params = useParams<{ outletId: string }>();
  const outletId = params.outletId;

  const [outlet, setOutlet] = useState<Outlet | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      // Fetch outlet
      const { data: outletData, error: outletError } = await supabase
        .from("outlets")
        .select("*")
        .eq("id", outletId)
        .single();

      if (outletError || !outletData) {
        setError("Outlet not found.");
        setLoading(false);
        return;
      }

      const fetchedOutlet = outletData as Outlet;
      setOutlet(fetchedOutlet);

      // Fetch services for this outlet's brand
      const { data: servicesData, error: servicesError } = await supabase
        .from("services")
        .select("*")
        .eq("brand_id", fetchedOutlet.brand_id)
        .eq("is_active", true)
        .order("category")
        .order("name");

      if (servicesError) {
        setError("Failed to load services.");
        setLoading(false);
        return;
      }

      setServices((servicesData as Service[]) ?? []);
      setLoading(false);
    }

    void fetchData();
  }, [outletId]);

  // Group services by category
  const grouped = services.reduce<Record<string, Service[]>>((acc, svc) => {
    const key = svc.category;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key]!.push(svc);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/book"
          className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Back to outlets
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Select a Service</h1>
        <p className="mt-1 text-gray-500">
          Step 2 of 4{outlet ? ` — ${outlet.name}` : ""}
        </p>
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
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-red-600">{error}</p>
            <Button variant="outline" size="sm" onClick={() => router.push("/book")}>
              Go Back
            </Button>
          </div>
        </Card>
      )}

      {/* Empty */}
      {!loading && !error && services.length === 0 && (
        <Card>
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="font-medium text-gray-600">No services available</p>
            <p className="text-sm text-gray-400">
              This outlet currently has no active services.
            </p>
          </div>
        </Card>
      )}

      {/* Services grouped by category */}
      {!loading &&
        !error &&
        Object.entries(grouped).map(([category, categoryServices]) => (
          <section key={category}>
            <h2 className="mb-3 text-lg font-semibold capitalize text-gray-900">
              {category}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {categoryServices.map((service) => (
                <Card
                  key={service.id}
                  className="cursor-pointer transition-shadow hover:shadow-md"
                  onClick={() =>
                    router.push(`/book/${outletId}/${service.id}`)
                  }
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-gray-900">
                        {service.name}
                      </h3>
                      <Badge variant="success">
                        {formatPrice(service.price_cents)}
                      </Badge>
                    </div>
                    {service.description && (
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {service.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{service.duration_minutes} min</span>
                      <span className="capitalize">{service.category}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}
