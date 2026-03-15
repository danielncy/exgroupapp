import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import {
  getMyMemberships,
  getMyStampCards,
  getMyLoyaltyHistory,
  getRewards,
  getMyStreakInfo,
  redeemReward,
} from "@ex-group/db";
import type { StreakInfo } from "@ex-group/shared/types";
import type { MembershipWithBrand, StampCardWithBrand } from "@ex-group/db";
import type {
  LoyaltyLedgerEntry,
  Reward,
  MembershipTier,
} from "@ex-group/shared/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TIER_ORDER: MembershipTier[] = ["bronze", "silver", "gold", "platinum"];

const TIER_COLORS: Record<MembershipTier, { bg: string; text: string }> = {
  bronze: { bg: "#FDE8CD", text: "#92400E" },
  silver: { bg: "#E5E7EB", text: "#374151" },
  gold: { bg: "#FEF3C7", text: "#92400E" },
  platinum: { bg: "#EDE9FE", text: "#5B21B6" },
};

const TIER_THRESHOLDS: Record<MembershipTier, number> = {
  bronze: 0,
  silver: 500,
  gold: 1500,
  platinum: 5000,
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TierBadge({ tier }: { tier: MembershipTier }) {
  const colors = TIER_COLORS[tier];
  return (
    <View style={[s.tierBadge, { backgroundColor: colors.bg }]}>
      <Text style={[s.tierBadgeText, { color: colors.text }]}>
        {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </Text>
    </View>
  );
}

function TierProgressBar({
  currentPoints,
  currentTier,
}: {
  currentPoints: number;
  currentTier: MembershipTier;
}) {
  const currentIndex = TIER_ORDER.indexOf(currentTier);
  const nextTier =
    currentIndex < TIER_ORDER.length - 1 ? TIER_ORDER[currentIndex + 1] : null;

  if (!nextTier) {
    return (
      <View style={s.progressContainer}>
        <View style={s.progressLabelRow}>
          <Text style={s.progressLabel}>Max tier reached</Text>
          <Text style={s.progressPoints}>{currentPoints} pts</Text>
        </View>
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: "100%", backgroundColor: "#8B5CF6" }]} />
        </View>
      </View>
    );
  }

  const prevThreshold = TIER_THRESHOLDS[currentTier];
  const nextThreshold = TIER_THRESHOLDS[nextTier];
  const pct = Math.min(
    ((currentPoints - prevThreshold) / (nextThreshold - prevThreshold)) * 100,
    100
  );

  return (
    <View style={s.progressContainer}>
      <View style={s.progressLabelRow}>
        <Text style={s.progressLabel}>
          {nextThreshold - currentPoints} pts to {nextTier}
        </Text>
        <Text style={s.progressPoints}>{currentPoints} pts</Text>
      </View>
      <View style={s.progressTrack}>
        <View
          style={[
            s.progressFill,
            { width: `${pct}%`, backgroundColor: TIER_COLORS[currentTier].text },
          ]}
        />
      </View>
    </View>
  );
}

function MembershipCard({ membership }: { membership: MembershipWithBrand }) {
  const brand = membership.brand;
  return (
    <View style={s.card}>
      <View style={s.membershipHeader}>
        <View>
          <Text style={s.brandName}>{brand?.name ?? "Brand"}</Text>
          <TierBadge tier={membership.membership_tier} />
        </View>
        <View
          style={[
            s.brandIcon,
            { backgroundColor: brand?.accent_color ?? "#6B7280" },
          ]}
        >
          <Text style={s.brandIconText}>{brand?.name?.charAt(0) ?? "?"}</Text>
        </View>
      </View>

      <View style={s.statsRow}>
        <View style={s.statItem}>
          <Text style={s.statLabel}>Points</Text>
          <Text style={s.statValue}>{membership.total_points}</Text>
        </View>
        <View style={s.statItem}>
          <Text style={s.statLabel}>Visits</Text>
          <Text style={s.statValue}>{membership.total_visits}</Text>
        </View>
      </View>

      <TierProgressBar
        currentPoints={membership.total_points}
        currentTier={membership.membership_tier}
      />
    </View>
  );
}

function StampCircle({ filled, index }: { filled: boolean; index: number }) {
  return (
    <View
      style={[
        s.stampCircle,
        filled ? s.stampFilled : s.stampEmpty,
      ]}
    >
      <Text style={filled ? s.stampFilledText : s.stampEmptyText}>
        {filled ? "\u2713" : String(index + 1)}
      </Text>
    </View>
  );
}

function StampCardSection({ card }: { card: StampCardWithBrand }) {
  const stamps = Array.from(
    { length: card.stamps_required },
    (_, i) => i < card.stamps_collected
  );

  return (
    <View style={s.card}>
      <View style={s.stampCardHeader}>
        <Text style={s.sectionSubtitle}>
          {card.brand?.name ?? "Brand"} — {card.card_type}
        </Text>
        {card.is_completed && (
          <View style={s.completedBadge}>
            <Text style={s.completedBadgeText}>Completed!</Text>
          </View>
        )}
      </View>
      <Text style={s.stampCountText}>
        {card.stamps_collected} / {card.stamps_required} stamps
      </Text>
      <View style={s.stampGrid}>
        {stamps.map((filled, i) => (
          <StampCircle key={i} filled={filled} index={i} />
        ))}
      </View>
    </View>
  );
}

function HistoryItem({ entry }: { entry: LoyaltyLedgerEntry }) {
  const isEarn = entry.entry_type.startsWith("earn");
  return (
    <View style={s.historyItem}>
      <View style={s.historyLeft}>
        <View
          style={[
            s.historyIcon,
            { backgroundColor: isEarn ? "#D1FAE5" : "#FEE2E2" },
          ]}
        >
          <Text
            style={{ color: isEarn ? "#065F46" : "#991B1B", fontWeight: "700" }}
          >
            {isEarn ? "+" : "-"}
          </Text>
        </View>
        <View>
          <Text style={s.historyDesc}>{entry.description}</Text>
          <Text style={s.historyDate}>
            {new Date(entry.created_at).toLocaleDateString("en-SG", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </Text>
        </View>
      </View>
      <View style={s.historyRight}>
        <Text
          style={[
            s.historyPoints,
            { color: isEarn ? "#059669" : "#DC2626" },
          ]}
        >
          {isEarn ? "+" : ""}
          {entry.points} pts
        </Text>
        {entry.stamps !== 0 && (
          <Text style={s.historyStamps}>
            {isEarn ? "+" : ""}
            {entry.stamps} stamp{Math.abs(entry.stamps) !== 1 ? "s" : ""}
          </Text>
        )}
      </View>
    </View>
  );
}

function StreakSection({ streak: si }: { streak: StreakInfo }) {
  const milestones = [4, 8, 12, 24];
  return (
    <View style={s.card}>
      <View style={s.streakHeader}>
        <Text style={s.streakFlame}>🔥</Text>
        <Text style={s.streakCount}>{si.currentStreak}</Text>
        <Text style={s.streakLabel}>week streak</Text>
      </View>
      <View style={s.streakMilestones}>
        {milestones.map((m) => (
          <View
            key={m}
            style={[
              s.milestoneDot,
              si.currentStreak >= m ? s.milestoneReached : s.milestonePending,
            ]}
          >
            <Text
              style={
                si.currentStreak >= m
                  ? s.milestoneReachedText
                  : s.milestonePendingText
              }
            >
              {m}w
            </Text>
          </View>
        ))}
      </View>
      {si.longestStreak > 0 && (
        <Text style={s.longestStreak}>
          Longest streak: {si.longestStreak} weeks
        </Text>
      )}
    </View>
  );
}

function RewardItem({
  reward,
  currentPoints,
  currentTier,
  onRedeem,
  isRedeeming,
}: {
  reward: Reward;
  currentPoints: number;
  currentTier: MembershipTier;
  onRedeem: (rewardId: string) => void;
  isRedeeming: boolean;
}) {
  const tierIndex = TIER_ORDER.indexOf(currentTier);
  const requiredIndex = reward.min_tier ? TIER_ORDER.indexOf(reward.min_tier as MembershipTier) : 0;
  const tierLocked = tierIndex < requiredIndex;
  const pointsLocked = currentPoints < reward.points_cost;
  const canRedeem = !tierLocked && !pointsLocked && reward.points_cost > 0;

  return (
    <View style={s.rewardItem}>
      <View style={s.rewardLeft}>
        <Text style={s.rewardName}>{reward.name}</Text>
        <Text style={s.rewardDesc}>{reward.description}</Text>
        {tierLocked && reward.min_tier && (
          <Text style={s.rewardTierLock}>
            Requires {reward.min_tier} tier
          </Text>
        )}
      </View>
      <View style={s.rewardRight}>
        {reward.points_cost > 0 && (
          <Text style={s.rewardCost}>{reward.points_cost} pts</Text>
        )}
        {reward.stamps_cost > 0 && (
          <Text style={s.rewardStampCost}>{reward.stamps_cost} stamps</Text>
        )}
        {canRedeem && (
          <TouchableOpacity
            style={s.redeemButton}
            activeOpacity={0.7}
            disabled={isRedeeming}
            onPress={() => onRedeem(reward.id)}
          >
            <Text style={s.redeemButtonText}>
              {isRedeeming ? "..." : "Redeem"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function LoyaltyTab() {
  const [memberships, setMemberships] = useState<MembershipWithBrand[]>([]);
  const [stampCards, setStampCards] = useState<StampCardWithBrand[]>([]);
  const [history, setHistory] = useState<LoyaltyLedgerEntry[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [streak, setStreak] = useState<StreakInfo | null>(null);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [membershipData, stampData, historyData] = await Promise.all([
        getMyMemberships(),
        getMyStampCards(),
        getMyLoyaltyHistory(undefined, 20),
      ]);

      setMemberships(membershipData);
      setStampCards(stampData);
      setHistory(historyData);

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
      const message =
        err instanceof Error ? err.message : "Failed to load loyalty data";
      setError(message);
    }
  }, []);

  const initialLoad = useCallback(async () => {
    setLoading(true);
    await load();
    setLoading(false);
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  useEffect(() => {
    void initialLoad();
  }, [initialLoad]);

  // Loading state
  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#E94560" />
        <Text style={s.loadingText}>Loading loyalty...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={s.center}>
        <Text style={s.errorText}>{error}</Text>
        <TouchableOpacity
          style={s.retryButton}
          onPress={() => void initialLoad()}
        >
          <Text style={s.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state
  if (memberships.length === 0) {
    return (
      <ScrollView
        style={s.container}
        contentContainerStyle={s.emptyContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
        }
      >
        <Text style={s.emptyIcon}>&#11088;</Text>
        <Text style={s.emptyTitle}>No memberships yet</Text>
        <Text style={s.emptySubtitle}>
          Complete your first booking to start earning loyalty stamps and points.
        </Text>
      </ScrollView>
    );
  }

  const activeCard = stampCards.find((c) => !c.is_completed) ?? stampCards[0];
  const activeMembership = memberships[0];
  const currentPoints = activeMembership?.total_points ?? 0;
  const currentTier = activeMembership?.membership_tier ?? "bronze";

  async function handleRedeem(rewardId: string) {
    if (!activeMembership?.brand) return;
    setRedeemingId(rewardId);
    try {
      await redeemReward(rewardId, activeMembership.brand.id);
      Alert.alert("Success", "Reward redeemed!");
      await load();
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to redeem"
      );
    } finally {
      setRedeemingId(null);
    }
  }

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
      }
    >
      <Text style={s.pageTitle}>Loyalty</Text>

      {/* Memberships */}
      <Text style={s.sectionTitle}>Your Memberships</Text>
      {memberships.map((m) => (
        <MembershipCard key={m.id} membership={m} />
      ))}

      {/* Stamp card */}
      {activeCard && (
        <>
          <Text style={s.sectionTitle}>Stamp Card</Text>
          <StampCardSection card={activeCard} />
        </>
      )}

      {/* Streak */}
      {streak && streak.currentStreak > 0 && (
        <>
          <Text style={s.sectionTitle}>Visit Streak</Text>
          <StreakSection streak={streak} />
        </>
      )}

      {/* History */}
      <Text style={s.sectionTitle}>Recent Activity</Text>
      {history.length === 0 ? (
        <View style={s.card}>
          <Text style={s.emptySection}>No loyalty activity yet.</Text>
        </View>
      ) : (
        <View style={s.card}>
          {history.map((entry) => (
            <HistoryItem key={entry.id} entry={entry} />
          ))}
        </View>
      )}

      {/* Rewards */}
      {rewards.length > 0 && (
        <>
          <Text style={s.sectionTitle}>Available Rewards</Text>
          {rewards.map((reward) => (
            <RewardItem
              key={reward.id}
              reward={reward}
              currentPoints={currentPoints}
              currentTier={currentTier}
              onRedeem={(id) => void handleRedeem(id)}
              isRedeeming={redeemingId === reward.id}
            />
          ))}
        </>
      )}

      {/* Bottom spacing */}
      <View style={s.bottomSpacer} />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  scrollContent: {
    padding: 20,
  },
  center: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  errorText: {
    fontSize: 14,
    color: "#DC2626",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#E94560",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
    marginTop: 24,
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  membershipHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  brandName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 6,
  },
  brandIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  brandIconText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  tierBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  tierBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    marginTop: 16,
    gap: 24,
  },
  statItem: {},
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    marginTop: 2,
  },
  progressContainer: {
    marginTop: 16,
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  progressPoints: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  progressTrack: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  stampCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
  },
  completedBadge: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  completedBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#065F46",
  },
  stampCountText: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 12,
  },
  stampGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  stampCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  stampFilled: {
    backgroundColor: "#E94560",
    borderColor: "#E94560",
  },
  stampEmpty: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D1D5DB",
  },
  stampFilledText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  stampEmptyText: {
    color: "#D1D5DB",
    fontSize: 12,
    fontWeight: "600",
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  historyLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  historyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  historyDesc: {
    fontSize: 13,
    fontWeight: "500",
    color: "#111827",
  },
  historyDate: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
  },
  historyRight: {
    alignItems: "flex-end",
    marginLeft: 8,
  },
  historyPoints: {
    fontSize: 13,
    fontWeight: "600",
  },
  historyStamps: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  rewardItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  rewardLeft: {
    flex: 1,
    marginRight: 12,
  },
  rewardName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  rewardDesc: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 3,
  },
  rewardRight: {
    alignItems: "flex-end",
  },
  rewardCost: {
    fontSize: 13,
    fontWeight: "600",
    color: "#E94560",
  },
  rewardStampCost: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  rewardTypeBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  rewardTypeText: {
    fontSize: 10,
    fontWeight: "500",
    color: "#6B7280",
    textTransform: "capitalize",
  },
  emptySection: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 13,
    paddingVertical: 20,
  },
  streakHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  streakFlame: {
    fontSize: 24,
  },
  streakCount: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
  },
  streakLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  streakMilestones: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
  milestoneDot: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  milestoneReached: {
    backgroundColor: "#FEF3C7",
  },
  milestonePending: {
    backgroundColor: "#F3F4F6",
  },
  milestoneReachedText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#92400E",
  },
  milestonePendingText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  longestStreak: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  redeemButton: {
    backgroundColor: "#E94560",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 6,
  },
  redeemButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  rewardTierLock: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 4,
  },
  bottomSpacer: {
    height: 40,
  },
});
