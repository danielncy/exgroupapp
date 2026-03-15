"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, Badge } from "@ex-group/ui";
import {
  getMyMemberships,
  getMyStampCards,
  getMyLoyaltyHistory,
  getRewards,
  getMyStreakInfo,
  redeemReward,
} from "@ex-group/db";
import type { MembershipWithBrand, StampCardWithBrand } from "@ex-group/db";
import type {
  LoyaltyLedgerEntry,
  Reward,
  MembershipTier,
  StreakInfo,
} from "@ex-group/shared/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TIER_ORDER: MembershipTier[] = ["bronze", "silver", "gold", "platinum"];

const TIER_COLORS: Record<MembershipTier, string> = {
  bronze: "#CD7F32",
  silver: "#A0AEC0",
  gold: "#D4AF37",
  platinum: "#8B5CF6",
};

const TIER_BG: Record<MembershipTier, string> = {
  bronze: "bg-orange-100 text-orange-800",
  silver: "bg-gray-200 text-gray-800",
  gold: "bg-yellow-100 text-yellow-800",
  platinum: "bg-purple-100 text-purple-800",
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TierBadge({ tier }: { tier: MembershipTier }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${TIER_BG[tier]}`}
    >
      {tier}
    </span>
  );
}

function TierProgress({
  currentPoints,
  currentTier,
}: {
  currentPoints: number;
  currentTier: MembershipTier;
}) {
  const currentIndex = TIER_ORDER.indexOf(currentTier);
  const nextTier = currentIndex < TIER_ORDER.length - 1 ? TIER_ORDER[currentIndex + 1] : null;

  const TIER_THRESHOLDS: Record<MembershipTier, number> = {
    bronze: 0,
    silver: 500,
    gold: 1500,
    platinum: 5000,
  };

  if (!nextTier) {
    return (
      <div className="mt-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Max tier reached</span>
          <span className="font-medium text-purple-600">{currentPoints} pts</span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div className="h-full rounded-full bg-purple-500" style={{ width: "100%" }} />
        </div>
      </div>
    );
  }

  const prevThreshold = TIER_THRESHOLDS[currentTier];
  const nextThreshold = TIER_THRESHOLDS[nextTier];
  const progress = Math.min(
    ((currentPoints - prevThreshold) / (nextThreshold - prevThreshold)) * 100,
    100
  );

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">
          {nextThreshold - currentPoints} pts to{" "}
          <span className="font-medium capitalize">{nextTier}</span>
        </span>
        <span className="font-medium text-gray-800">{currentPoints} pts</span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${progress}%`,
            backgroundColor: TIER_COLORS[currentTier],
          }}
        />
      </div>
    </div>
  );
}

function StampGrid({ card }: { card: StampCardWithBrand }) {
  const stamps = Array.from({ length: card.stamps_required }, (_, i) => i < card.stamps_collected);

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">
          {card.stamps_collected} / {card.stamps_required} stamps
        </p>
        {card.is_completed && <Badge variant="success">Completed!</Badge>}
      </div>
      <div className="flex flex-wrap gap-2">
        {stamps.map((filled, i) => (
          <div
            key={i}
            className={[
              "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors",
              filled
                ? "border-brand-accent bg-brand-accent text-white"
                : "border-gray-300 bg-white text-gray-300",
            ].join(" ")}
          >
            {filled ? "\u2713" : i + 1}
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoryItem({ entry }: { entry: LoyaltyLedgerEntry }) {
  const isEarn = entry.entry_type.startsWith("earn");
  return (
    <div className="flex items-center justify-between border-b border-gray-100 py-3 last:border-0">
      <div className="flex items-center gap-3">
        <div
          className={[
            "flex h-8 w-8 items-center justify-center rounded-full text-sm",
            isEarn ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700",
          ].join(" ")}
        >
          {isEarn ? "+" : "-"}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{entry.description}</p>
          <p className="text-xs text-gray-500">
            {new Date(entry.created_at).toLocaleDateString("en-SG", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-sm font-semibold ${isEarn ? "text-green-600" : "text-red-600"}`}>
          {isEarn ? "+" : ""}{entry.points} pts
        </p>
        {entry.stamps !== 0 && (
          <p className="text-xs text-gray-500">
            {isEarn ? "+" : ""}{entry.stamps} stamp{Math.abs(entry.stamps) !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </div>
  );
}

function RewardCard({
  reward,
  currentPoints,
  currentTier,
  onRedeem,
  isRedeeming,
}: {
  reward: Reward;
  currentPoints: number;
  currentTier: MembershipTier;
  onRedeem: (reward: Reward) => void;
  isRedeeming: boolean;
}) {
  const tierOrder: MembershipTier[] = ["bronze", "silver", "gold", "platinum"];
  const canAfford = currentPoints >= reward.points_cost;
  const meetsMinTier =
    tierOrder.indexOf(currentTier) >= tierOrder.indexOf(reward.min_tier as MembershipTier);
  const canRedeem = canAfford && meetsMinTier && reward.points_cost > 0;

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
      <div>
        <p className="font-medium text-gray-900">{reward.name}</p>
        <p className="mt-0.5 text-sm text-gray-500">{reward.description}</p>
        {!meetsMinTier && (
          <p className="mt-1 text-xs text-amber-600">
            Requires {reward.min_tier} tier
          </p>
        )}
      </div>
      <div className="ml-4 text-right">
        {reward.points_cost > 0 && (
          <p className="text-sm font-semibold text-brand-accent">{reward.points_cost} pts</p>
        )}
        {reward.stamps_cost > 0 && (
          <p className="text-xs text-gray-500">{reward.stamps_cost} stamps</p>
        )}
        {reward.points_cost > 0 && (
          <button
            onClick={() => canRedeem && onRedeem(reward)}
            disabled={!canRedeem || isRedeeming}
            className={`mt-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              canRedeem
                ? "bg-brand-accent text-white hover:opacity-90"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isRedeeming ? "..." : "Redeem"}
          </button>
        )}
      </div>
    </div>
  );
}

function StreakSection({ streak: s }: { streak: StreakInfo }) {
  const nextMilestone = STREAK_MILESTONES.find((m) => m.weeks > s.currentStreak);
  return (
    <Card>
      <div className="flex items-center gap-3">
        <span className="text-3xl">🔥</span>
        <div className="flex-1">
          <p className="font-semibold text-gray-900">
            {s.currentStreak}-week streak
          </p>
          <p className="text-sm text-gray-500">
            {nextMilestone
              ? `${nextMilestone.weeks - s.currentStreak} more weeks for ${nextMilestone.points} pts bonus`
              : "All milestones achieved!"}
          </p>
        </div>
        <p className="text-sm text-gray-400">Best: {s.longestStreak}w</p>
      </div>
      <div className="mt-3 flex gap-2">
        {STREAK_MILESTONES.map((m) => (
          <div
            key={m.weeks}
            className={`flex-1 rounded-lg py-1.5 text-center text-xs ${
              s.currentStreak >= m.weeks
                ? "bg-orange-100 text-orange-700 font-medium"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {m.weeks}w
            <div className="text-[10px]">{m.points}pts</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const STREAK_MILESTONES = [
  { weeks: 4, points: 100 },
  { weeks: 8, points: 250 },
  { weeks: 12, points: 500 },
  { weeks: 24, points: 1000 },
];

export default function LoyaltyPage() {
  const [memberships, setMemberships] = useState<MembershipWithBrand[]>([]);
  const [stampCards, setStampCards] = useState<StampCardWithBrand[]>([]);
  const [history, setHistory] = useState<LoyaltyLedgerEntry[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [streak, setStreak] = useState<StreakInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [membershipData, stampData, historyData] = await Promise.all([
        getMyMemberships(),
        getMyStampCards(),
        getMyLoyaltyHistory(undefined, 20),
      ]);

      setMemberships(membershipData);
      setStampCards(stampData);
      setHistory(historyData);

      // Load rewards + streak for first membership brand (if any)
      if (membershipData.length > 0 && membershipData[0]?.brand) {
        const brandId = membershipData[0].brand.id;
        const [rewardData, streakData] = await Promise.all([
          getRewards(brandId),
          getMyStreakInfo(brandId),
        ]);
        setRewards(rewardData);
        setStreak(streakData);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load loyalty data";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  async function handleRedeem(reward: Reward) {
    if (!memberships[0]?.brand) return;
    setRedeeming(reward.id);
    try {
      const result = await redeemReward(reward.id, memberships[0].brand.id);
      if (result.success) {
        await load();
      } else {
        alert(result.error ?? "Redemption failed");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Redemption failed");
    } finally {
      setRedeeming(null);
    }
  }

  useEffect(() => {
    void load();
  }, [load]);

  // Loading state
  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Loyalty</h1>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-brand-accent" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Loyalty</h1>
        <Card>
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => void load()}
              className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Retry
            </button>
          </div>
        </Card>
      </div>
    );
  }

  // Empty state
  if (memberships.length === 0) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Loyalty</h1>
        <Card>
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="text-5xl text-gray-300">&#11088;</span>
            <p className="font-medium text-gray-600">No memberships yet</p>
            <p className="text-sm text-gray-400">
              Complete your first booking to start earning loyalty stamps and points.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Active stamp card (first non-completed)
  const activeCard = stampCards.find((c) => !c.is_completed) ?? stampCards[0];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Loyalty</h1>

      {/* Membership cards */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Your Memberships</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {memberships.map((m) => (
            <Card key={m.id} variant="elevated">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {m.brand?.name ?? "Brand"}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <TierBadge tier={m.membership_tier} />
                  </div>
                </div>
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-white text-sm font-bold"
                  style={{ backgroundColor: m.brand?.accent_color ?? "#6B7280" }}
                >
                  {m.brand?.name?.charAt(0) ?? "?"}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Points</p>
                  <p className="text-lg font-semibold text-gray-900">{m.total_points}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Visits</p>
                  <p className="text-lg font-semibold text-gray-900">{m.total_visits}</p>
                </div>
              </div>

              <TierProgress currentPoints={m.total_points} currentTier={m.membership_tier} />
            </Card>
          ))}
        </div>
      </section>

      {/* Stamp card */}
      {activeCard && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Stamp Card</h2>
          <Card>
            <div className="flex items-center justify-between">
              <p className="font-medium text-gray-900">
                {activeCard.brand?.name ?? "Brand"} — {activeCard.card_type}
              </p>
              {activeCard.is_completed && (
                <Badge variant="success">Complete</Badge>
              )}
            </div>
            <StampGrid card={activeCard} />
          </Card>
        </section>
      )}

      {/* Streak */}
      {streak && streak.currentStreak > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Visit Streak</h2>
          <StreakSection streak={streak} />
        </section>
      )}

      {/* Recent history */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent Activity</h2>
        {history.length === 0 ? (
          <Card>
            <p className="py-6 text-center text-sm text-gray-500">No loyalty activity yet.</p>
          </Card>
        ) : (
          <Card>
            {history.map((entry) => (
              <HistoryItem key={entry.id} entry={entry} />
            ))}
          </Card>
        )}
      </section>

      {/* Available rewards */}
      {rewards.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Available Rewards</h2>
          <div className="space-y-3">
            {rewards.map((reward) => (
              <RewardCard
                key={reward.id}
                reward={reward}
                currentPoints={memberships[0]?.total_points ?? 0}
                currentTier={memberships[0]?.membership_tier ?? "bronze"}
                onRedeem={handleRedeem}
                isRedeeming={redeeming === reward.id}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
