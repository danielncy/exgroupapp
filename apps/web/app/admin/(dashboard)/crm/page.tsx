"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { calculateHealthScores, getHealthScores, getRiskTransitions } from "@ex-group/db";
import type { HealthScore, RiskTransition } from "@ex-group/db";

const RISK_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  healthy: { bg: "bg-green-100", text: "text-green-700", label: "Healthy" },
  cooling: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Cooling" },
  at_risk: { bg: "bg-orange-100", text: "text-orange-700", label: "At Risk" },
  churning: { bg: "bg-red-100", text: "text-red-700", label: "Churning" },
  churned: { bg: "bg-gray-100", text: "text-gray-700", label: "Churned" },
};

export default function CRMPage() {
  const [scores, setScores] = useState<HealthScore[]>([]);
  const [riskChanges, setRiskChanges] = useState<RiskTransition[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [filterRisk, setFilterRisk] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const loadScores = useCallback(async () => {
    try {
      const [data, transitions] = await Promise.all([
        getHealthScores({
          risk_level: filterRisk || undefined,
          limit: 100,
        }),
        getRiskTransitions(undefined, 10),
      ]);
      setScores(data);
      setRiskChanges(transitions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load scores");
    } finally {
      setLoading(false);
    }
  }, [filterRisk]);

  useEffect(() => {
    void loadScores();
  }, [loadScores]);

  async function handleRecalculate() {
    setRecalculating(true);
    setError(null);
    try {
      const count = await calculateHealthScores();
      await loadScores();
      setError(null);
      alert(`Health scores recalculated for ${count} customers`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Recalculation failed");
    } finally {
      setRecalculating(false);
    }
  }

  // Distribution summary
  const distribution = {
    healthy: scores.filter((s) => s.risk_level === "healthy").length,
    cooling: scores.filter((s) => s.risk_level === "cooling").length,
    at_risk: scores.filter((s) => s.risk_level === "at_risk").length,
    churning: scores.filter((s) => s.risk_level === "churning").length,
    churned: scores.filter((s) => s.risk_level === "churned").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">CRM Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Customer health scores and risk analysis
          </p>
        </div>
        <button
          onClick={() => void handleRecalculate()}
          disabled={recalculating}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
        >
          {recalculating ? "Recalculating..." : "Recalculate Scores"}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Distribution cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {Object.entries(RISK_COLORS).map(([key, style]) => (
          <button
            key={key}
            onClick={() => setFilterRisk(filterRisk === key ? "" : key)}
            className={`rounded-lg border p-4 text-center transition-colors ${
              filterRisk === key
                ? "border-slate-900 ring-2 ring-slate-900/10"
                : "border-slate-200"
            }`}
          >
            <p className="text-2xl font-bold text-slate-900">
              {distribution[key as keyof typeof distribution]}
            </p>
            <span
              className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
            >
              {style.label}
            </span>
          </button>
        ))}
      </div>

      {/* Recent risk changes */}
      {riskChanges.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-900">
              Recent Risk Changes
            </h2>
            <Link
              href="/admin/crm/alerts"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              View all alerts →
            </Link>
          </div>
          <div className="space-y-2">
            {riskChanges.map((t) => {
              const fromStyle = RISK_COLORS[t.from_level] ?? { bg: "bg-gray-100", text: "text-gray-700", label: t.from_level };
              const toStyle = RISK_COLORS[t.to_level] ?? { bg: "bg-gray-100", text: "text-gray-700", label: t.to_level };
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-medium text-slate-900">
                      {t.customer?.display_name ?? "Customer"}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span
                        className={`rounded-full px-2 py-0.5 font-medium ${fromStyle.bg} ${fromStyle.text}`}
                      >
                        {fromStyle.label}
                      </span>
                      <span className="text-slate-400">→</span>
                      <span
                        className={`rounded-full px-2 py-0.5 font-medium ${toStyle.bg} ${toStyle.text}`}
                      >
                        {toStyle.label}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    {new Date(t.detected_at).toLocaleDateString("en-SG", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Customer table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
                Score
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
                R / F / M
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
                Risk
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
                Calculated
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {scores.map((score) => {
              const risk = RISK_COLORS[score.risk_level] ?? { bg: "bg-gray-100", text: "text-gray-700", label: "Unknown" };
              return (
                <tr key={score.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-slate-900">
                      {score.customer?.display_name ?? "Unknown"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {score.customer?.phone ?? ""}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-slate-900"
                          style={{ width: `${score.score}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-900">
                        {score.score}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {score.recency_score} / {score.frequency_score} /{" "}
                    {score.monetary_score}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${risk.bg} ${risk.text}`}
                    >
                      {risk.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {new Date(score.calculated_at).toLocaleDateString("en-SG", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              );
            })}
            {scores.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                  No health scores calculated yet. Click &ldquo;Recalculate
                  Scores&rdquo; to generate.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
