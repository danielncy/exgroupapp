"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase, getAvailableSlots } from "@ex-group/db";
import type { AvailableSlot } from "@ex-group/db";
import { Card, Button } from "@ex-group/ui";
import type { Outlet, Service } from "@ex-group/shared/types/outlet";

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-SG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getNext14Days(): string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    days.push(`${yyyy}-${mm}-${dd}`);
  }
  return days;
}

function formatTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h ?? "0", 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${display}:${m} ${ampm}`;
}

export default function SelectSlotPage() {
  const router = useRouter();
  const params = useParams<{ outletId: string; serviceId: string }>();
  const { outletId, serviceId } = params;

  const [outlet, setOutlet] = useState<Outlet | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getNext14Days()[0]!);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch outlet and service metadata
  useEffect(() => {
    async function fetchMeta() {
      setLoadingMeta(true);

      const [outletRes, serviceRes] = await Promise.all([
        supabase.from("outlets").select("*").eq("id", outletId).single(),
        supabase.from("services").select("*").eq("id", serviceId).single(),
      ]);

      if (outletRes.error || !outletRes.data) {
        setError("Outlet not found.");
        setLoadingMeta(false);
        return;
      }
      if (serviceRes.error || !serviceRes.data) {
        setError("Service not found.");
        setLoadingMeta(false);
        return;
      }

      setOutlet(outletRes.data as Outlet);
      setService(serviceRes.data as Service);
      setLoadingMeta(false);
    }

    void fetchMeta();
  }, [outletId, serviceId]);

  // Fetch slots when date changes
  const fetchSlots = useCallback(async () => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    setError(null);
    setSlots([]);

    try {
      const response = await getAvailableSlots(outletId, serviceId, selectedDate);
      setSlots(response.slots);
    } catch (err) {
      // Fallback: if edge function is not deployed, show a helpful message
      const message = err instanceof Error ? err.message : "Failed to fetch slots";
      setError(message);
    } finally {
      setLoadingSlots(false);
    }
  }, [outletId, serviceId, selectedDate]);

  useEffect(() => {
    if (!loadingMeta && outlet && service) {
      void fetchSlots();
    }
  }, [loadingMeta, outlet, service, fetchSlots]);

  // Group slots by stylist
  const slotsByStylist = slots.reduce<
    Record<string, { stylistName: string; slots: AvailableSlot[] }>
  >((acc, slot) => {
    if (!acc[slot.stylist_id]) {
      acc[slot.stylist_id] = { stylistName: slot.stylist_name, slots: [] };
    }
    acc[slot.stylist_id]!.slots.push(slot);
    return acc;
  }, {});

  const days = getNext14Days();

  function handleSlotClick(slot: AvailableSlot) {
    if (!slot.available) return;
    const searchParams = new URLSearchParams({
      date: selectedDate,
      time: slot.time,
      stylist_id: slot.stylist_id,
      stylist_name: slot.stylist_name,
    });
    router.push(
      `/book/${outletId}/${serviceId}/confirm?${searchParams.toString()}`
    );
  }

  if (loadingMeta) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/book/${outletId}`}
          className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Back to services
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Pick a Date &amp; Time</h1>
        <p className="mt-1 text-gray-500">
          Step 3 of 4 — {outlet?.name ?? ""} / {service?.name ?? ""}
        </p>
      </div>

      {/* Date Picker */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Select Date
        </h2>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {days.map((day) => {
            const d = new Date(day + "T00:00:00");
            const isSelected = day === selectedDate;
            return (
              <button
                key={day}
                onClick={() => setSelectedDate(day)}
                className={[
                  "flex min-w-[4.5rem] flex-col items-center rounded-xl px-3 py-3 text-sm transition-colors",
                  isSelected
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200",
                ].join(" ")}
              >
                <span className="text-xs font-medium">
                  {d.toLocaleDateString("en-SG", { weekday: "short" })}
                </span>
                <span className="text-lg font-bold">{d.getDate()}</span>
                <span className="text-xs">
                  {d.toLocaleDateString("en-SG", { month: "short" })}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Loading slots */}
      {loadingSlots && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
        </div>
      )}

      {/* Error */}
      {error && !loadingSlots && (
        <Card>
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-red-600">{error}</p>
            <Button variant="outline" size="sm" onClick={() => void fetchSlots()}>
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* No slots */}
      {!loadingSlots && !error && slots.length === 0 && (
        <Card>
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="font-medium text-gray-600">No available slots</p>
            <p className="text-sm text-gray-400">
              Try selecting a different date.
            </p>
          </div>
        </Card>
      )}

      {/* Slots grouped by stylist */}
      {!loadingSlots &&
        !error &&
        Object.entries(slotsByStylist).map(([stylistId, group]) => (
          <section key={stylistId}>
            <h2 className="mb-3 text-base font-semibold text-gray-900">
              {group.stylistName}
            </h2>
            <div className="flex flex-wrap gap-2">
              {group.slots.map((slot) => (
                <button
                  key={`${stylistId}-${slot.time}`}
                  onClick={() => handleSlotClick(slot)}
                  disabled={!slot.available}
                  className={[
                    "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                    slot.available
                      ? "bg-white border border-gray-300 text-gray-900 hover:border-gray-900 hover:bg-gray-50"
                      : "cursor-not-allowed bg-gray-100 text-gray-300 line-through",
                  ].join(" ")}
                >
                  {formatTime(slot.time)}
                </button>
              ))}
            </div>
          </section>
        ))}

      {/* Selected date label */}
      {!loadingSlots && !error && slots.length > 0 && (
        <p className="text-center text-xs text-gray-400">
          Showing slots for {formatDateLabel(selectedDate)}
        </p>
      )}
    </div>
  );
}
