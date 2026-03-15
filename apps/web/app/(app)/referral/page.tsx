"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, Badge } from "@ex-group/ui";
import {
  getMyReferralCode,
  getMyReferrals,
  getMyReferralStats,
  applyReferralCode,
  getMyMemberships,
} from "@ex-group/db";
import type { Referral, ReferralStats } from "@ex-group/shared/types";

const STATUS_STYLES: Record<string, { label: string; variant: "default" | "success" }> = {
  pending: { label: "Pending", variant: "default" },
  completed: { label: "Completed", variant: "default" },
  rewarded: { label: "Rewarded", variant: "success" },
};

export default function ReferralPage() {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<ReferralStats>({
    totalInvited: 0,
    totalCompleted: 0,
    totalRewarded: 0,
    totalPointsEarned: 0,
  });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [inputCode, setInputCode] = useState("");
  const [applyResult, setApplyResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [applying, setApplying] = useState(false);

  const load = useCallback(async () => {
    try {
      const [code, memberships] = await Promise.all([
        getMyReferralCode(),
        getMyMemberships(),
      ]);
      setReferralCode(code);

      if (memberships.length > 0 && memberships[0]?.brand) {
        const brandId = memberships[0].brand.id;
        const [refs, st] = await Promise.all([
          getMyReferrals(brandId),
          getMyReferralStats(brandId),
        ]);
        setReferrals(refs);
        setStats(st);
      }
    } catch (err) {
      console.error("Failed to load referral data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function copyCode() {
    if (!referralCode) return;
    await navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleApply() {
    if (!inputCode.trim()) return;
    setApplying(true);
    setApplyResult(null);
    try {
      const memberships = await getMyMemberships();
      if (!memberships.length || !memberships[0]?.brand) return;
      const result = await applyReferralCode(
        inputCode.trim(),
        memberships[0].brand.id
      );
      if (result.success) {
        setApplyResult({
          success: true,
          message: `Code applied! Referred by: ${result.referrer_name}`,
        });
        setInputCode("");
      } else {
        setApplyResult({
          success: false,
          message: result.error ?? "Failed to apply code",
        });
      }
    } catch (err) {
      setApplyResult({
        success: false,
        message: err instanceof Error ? err.message : "Failed",
      });
    } finally {
      setApplying(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Refer a Friend</h1>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-brand-accent" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Refer a Friend</h1>

      {/* My referral code */}
      <Card>
        <p className="text-sm text-gray-500 mb-2">Your Referral Code</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-center text-xl font-mono font-bold tracking-widest">
            {referralCode ?? "—"}
          </div>
          <button
            onClick={() => void copyCode()}
            className="rounded-lg bg-brand-accent px-4 py-3 text-sm font-medium text-white hover:opacity-90"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <p className="mt-3 text-sm text-gray-500">
          Share this code with friends. When they complete their first booking,
          you&apos;ll earn 100 bonus points!
        </p>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <p className="text-2xl font-bold text-gray-900">{stats.totalInvited}</p>
          <p className="text-xs text-gray-500">Invited</p>
        </Card>
        <Card>
          <p className="text-2xl font-bold text-gray-900">{stats.totalRewarded}</p>
          <p className="text-xs text-gray-500">Completed</p>
        </Card>
        <Card>
          <p className="text-2xl font-bold text-green-600">+{stats.totalPointsEarned}</p>
          <p className="text-xs text-gray-500">Points earned</p>
        </Card>
      </div>

      {/* Apply code */}
      <Card>
        <p className="text-sm font-medium text-gray-900 mb-2">
          Have a referral code?
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder="Enter code"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            onClick={() => void handleApply()}
            disabled={applying || !inputCode.trim()}
            className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {applying ? "..." : "Apply"}
          </button>
        </div>
        {applyResult && (
          <p
            className={`mt-2 text-sm ${
              applyResult.success ? "text-green-600" : "text-red-600"
            }`}
          >
            {applyResult.message}
          </p>
        )}
      </Card>

      {/* Referral history */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          Referral History
        </h2>
        {referrals.length === 0 ? (
          <Card>
            <p className="py-6 text-center text-sm text-gray-500">
              No referrals yet. Share your code to get started!
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {referrals.map((ref) => {
              const st = STATUS_STYLES[ref.status] ?? { label: "Pending", variant: "default" as const };
              return (
                <Card key={ref.id}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {ref.referred?.display_name ?? "Friend"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(ref.created_at).toLocaleDateString("en-SG", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
