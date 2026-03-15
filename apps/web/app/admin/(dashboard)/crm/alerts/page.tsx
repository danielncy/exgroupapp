"use client";

import { useEffect, useState } from "react";
import { getChurnAlerts } from "@ex-group/db";
import Link from "next/link";

interface ChurnAlert {
  id: string;
  customer_id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export default function ChurnAlertsPage() {
  const [alerts, setAlerts] = useState<ChurnAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getChurnAlerts(50);
        setAlerts(data);
      } catch (err) {
        console.error("Failed to load alerts:", err);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
      </div>
    );
  }

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Churn Alerts</h1>
          <p className="mt-1 text-sm text-slate-500">
            {unreadCount} unread alert{unreadCount !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/admin/crm"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Back to CRM
        </Link>
      </div>

      {alerts.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
          <p className="text-4xl mb-3">🎉</p>
          <p className="text-lg font-medium text-slate-700">No churn alerts</p>
          <p className="mt-1 text-sm text-slate-500">
            All customers are in good standing
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => {
            const data = alert.data;
            return (
              <div
                key={alert.id}
                className={`rounded-lg border p-4 transition-colors ${
                  alert.is_read
                    ? "border-slate-200 bg-white"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {!alert.is_read && (
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                      )}
                      <span className="font-medium text-slate-900">
                        {(data.customer_name as string) ?? "Customer"}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{alert.body}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(alert.created_at).toLocaleString("en-SG", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="ml-3 flex items-center gap-2">
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                      {(data.from_level as string) ?? "?"} → {(data.to_level as string) ?? "?"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
