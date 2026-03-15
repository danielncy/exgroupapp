import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { brandTokens } from "@ex-group/ui/tokens/brands";
import {
  getWalletBalance,
  getMyBookings,
  getMyStampCards,
  getUnreadCount,
  getCustomerPrimaryBrand,
} from "@ex-group/db";
import type { BrandId } from "@ex-group/shared/types/brand";

interface BookingSummary {
  id: string;
  booking_date: string;
  start_time: string;
  status: string;
  service: { name: string } | null;
  outlet: { name: string } | null;
}

interface StampCardSummary {
  id: string;
  stamps_collected: number;
  stamps_required: number;
  brand?: { name: string } | null;
}

export default function HomeTab() {
  const router = useRouter();
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [upcoming, setUpcoming] = useState<BookingSummary[]>([]);
  const [stampCards, setStampCards] = useState<StampCardSummary[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeBrand, setActiveBrand] = useState<BrandId>("ex_style");

  useEffect(() => {
    async function load() {
      try {
        const [balance, bookings, stamps, notifCount, primaryBrand] = await Promise.allSettled([
          getWalletBalance(),
          getMyBookings(),
          getMyStampCards(),
          getUnreadCount(),
          getCustomerPrimaryBrand(),
        ]);

        if (balance.status === "fulfilled") setWalletBalance(balance.value);
        if (bookings.status === "fulfilled") {
          const now = new Date().toISOString().split("T")[0]!;
          const up = (bookings.value as BookingSummary[]).filter(
            (b) => b.status !== "cancelled" && b.booking_date >= now
          );
          setUpcoming(up.slice(0, 3));
        }
        if (stamps.status === "fulfilled")
          setStampCards(stamps.value as StampCardSummary[]);
        if (notifCount.status === "fulfilled") setUnreadCount(notifCount.value);
        if (primaryBrand.status === "fulfilled") setActiveBrand(primaryBrand.value);
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const brand = brandTokens[activeBrand] ?? brandTokens.ex_style;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Welcome + notification bell */}
      <View style={styles.welcomeRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.welcomeTitle, { color: brand.primary }]}>Welcome back!</Text>
          <Text style={styles.welcomeSubtitle}>Your account overview.</Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.bellContainer}
            activeOpacity={0.7}
            onPress={() => router.push("/notifications" as never)}
          >
            <Text style={styles.bellIcon}>🔔</Text>
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>
                {unreadCount > 9 ? "9+" : String(unreadCount)}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <TouchableOpacity
          style={styles.statCard}
          activeOpacity={0.7}
          onPress={() => router.push("/(tabs)/wallet" as never)}
        >
          <Text style={styles.statLabel}>Wallet</Text>
          <Text style={styles.statValue}>
            ${walletBalance !== null ? (walletBalance / 100).toFixed(2) : "0.00"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.statCard}
          activeOpacity={0.7}
          onPress={() => router.push("/(tabs)/loyalty" as never)}
        >
          <Text style={styles.statLabel}>Stamp Cards</Text>
          <Text style={styles.statValue}>{stampCards.length}</Text>
        </TouchableOpacity>
      </View>

      {/* Quick actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {[
            { title: "Book", icon: "📅", route: "/book" },
            { title: "Top Up", icon: "💳", route: "/(tabs)/wallet" },
            { title: "Rewards", icon: "🏆", route: "/(tabs)/loyalty" },
            { title: "Refer", icon: "🤝", route: "/referral" },
          ].map((action) => (
            <TouchableOpacity
              key={action.title}
              style={styles.actionCard}
              activeOpacity={0.7}
              onPress={() => router.push(action.route as never)}
            >
              <Text style={styles.actionIcon}>{action.icon}</Text>
              <Text style={styles.actionTitle}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Upcoming bookings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Bookings</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/bookings" as never)}>
            <Text style={[styles.viewAll, { color: brand.accent }]}>View all →</Text>
          </TouchableOpacity>
        </View>
        {upcoming.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyText}>No upcoming bookings</Text>
            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.8}
              onPress={() => router.push("/book" as never)}
            >
              <Text style={styles.primaryButtonText}>Book Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          upcoming.map((b) => (
            <View key={b.id} style={styles.bookingCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.bookingService}>
                  {(b.service as { name: string } | null)?.name ?? "Appointment"}
                </Text>
                <Text style={styles.bookingOutlet}>
                  {(b.outlet as { name: string } | null)?.name ?? ""}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.bookingDate}>{b.booking_date}</Text>
                <Text style={styles.bookingTime}>{b.start_time}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Stamp card preview */}
      {stampCards.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Stamps</Text>
          {stampCards.slice(0, 2).map((sc) => (
            <View key={sc.id} style={styles.stampCard}>
              <Text style={styles.stampBrand}>
                {(sc.brand as { name: string } | null)?.name ?? "Brand"}
              </Text>
              <View style={styles.stampBarBg}>
                <View
                  style={[
                    styles.stampBarFill,
                    {
                      width: `${Math.min((sc.stamps_collected / sc.stamps_required) * 100, 100)}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.stampCount}>
                {sc.stamps_collected}/{sc.stamps_required}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  content: { padding: 20, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FAFAFA" },
  loadingText: { fontSize: 15, color: "#6B7280" },
  welcomeRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  welcomeTitle: { fontSize: 26, fontWeight: "bold", color: "#1A1A2E" },
  welcomeSubtitle: { fontSize: 15, color: "#6B7280", marginTop: 4 },
  bellContainer: { position: "relative", padding: 8 },
  bellIcon: { fontSize: 24 },
  bellBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  bellBadgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "bold" },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statLabel: { fontSize: 12, color: "#6B7280" },
  statValue: { fontSize: 24, fontWeight: "bold", color: "#111827", marginTop: 4 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#111827", marginBottom: 12 },
  viewAll: { fontSize: 13, color: "#6366F1", fontWeight: "500" },
  actionsGrid: { flexDirection: "row", gap: 12 },
  actionCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  actionIcon: { fontSize: 28, marginBottom: 8 },
  actionTitle: { fontSize: 14, fontWeight: "600", color: "#111827" },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emptyIcon: { fontSize: 40, marginBottom: 12, opacity: 0.3 },
  emptyText: { fontSize: 15, fontWeight: "500", color: "#4B5563", marginBottom: 16 },
  primaryButton: {
    backgroundColor: "#6366F1",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 15 },
  bookingCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  bookingService: { fontSize: 15, fontWeight: "600", color: "#111827" },
  bookingOutlet: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  bookingDate: { fontSize: 13, fontWeight: "500", color: "#111827" },
  bookingTime: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  stampCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  stampBrand: { fontSize: 14, fontWeight: "600", color: "#111827", marginBottom: 8 },
  stampBarBg: { height: 8, borderRadius: 4, backgroundColor: "#E5E7EB" },
  stampBarFill: { height: 8, borderRadius: 4, backgroundColor: "#6366F1" },
  stampCount: { fontSize: 12, color: "#6B7280", marginTop: 4, textAlign: "right" },
});
