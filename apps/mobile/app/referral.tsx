import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Share,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import {
  getMyReferralCode,
  getMyReferrals,
  getMyReferralStats,
  applyReferralCode,
  getMyMemberships,
} from "@ex-group/db";
import type { Referral, ReferralStats } from "@ex-group/shared/types";

export default function ReferralScreen() {
  const router = useRouter();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<ReferralStats>({
    totalInvited: 0,
    totalCompleted: 0,
    totalRewarded: 0,
    totalPointsEarned: 0,
  });
  const [loading, setLoading] = useState(true);
  const [inputCode, setInputCode] = useState("");
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

  async function handleShare() {
    if (!referralCode) return;
    try {
      await Share.share({
        message: `Use my referral code ${referralCode} to get started! Download the app and enter my code when you sign up.`,
      });
    } catch {
      /* cancelled */
    }
  }

  async function handleApply() {
    if (!inputCode.trim()) return;
    setApplying(true);
    try {
      const memberships = await getMyMemberships();
      if (!memberships.length || !memberships[0]?.brand) return;
      const result = await applyReferralCode(
        inputCode.trim(),
        memberships[0].brand.id
      );
      if (result.success) {
        Alert.alert("Success", `Code applied! Referred by: ${result.referrer_name}`);
        setInputCode("");
        await load();
      } else {
        Alert.alert("Error", result.error ?? "Failed to apply code");
      }
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to apply code"
      );
    } finally {
      setApplying(false);
    }
  }

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#E94560" />
      </View>
    );
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
        <Text style={s.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={s.heading}>Refer a Friend</Text>

      {/* My code */}
      <View style={s.card}>
        <Text style={s.label}>Your Referral Code</Text>
        <Text style={s.codeText}>{referralCode ?? "—"}</Text>
        <TouchableOpacity
          style={s.shareButton}
          activeOpacity={0.7}
          onPress={() => void handleShare()}
        >
          <Text style={s.shareButtonText}>Share Code</Text>
        </TouchableOpacity>
        <Text style={s.hint}>
          Share this code with friends. When they complete their first booking,
          you'll earn 100 bonus points!
        </Text>
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        <View style={s.statCard}>
          <Text style={s.statValue}>{stats.totalInvited}</Text>
          <Text style={s.statLabel}>Invited</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statValue}>{stats.totalRewarded}</Text>
          <Text style={s.statLabel}>Completed</Text>
        </View>
        <View style={s.statCard}>
          <Text style={[s.statValue, { color: "#059669" }]}>
            +{stats.totalPointsEarned}
          </Text>
          <Text style={s.statLabel}>Points</Text>
        </View>
      </View>

      {/* Apply code */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Have a referral code?</Text>
        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            value={inputCode}
            onChangeText={setInputCode}
            placeholder="Enter code"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="characters"
          />
          <TouchableOpacity
            style={[
              s.applyButton,
              (applying || !inputCode.trim()) && s.buttonDisabled,
            ]}
            activeOpacity={0.7}
            onPress={() => void handleApply()}
            disabled={applying || !inputCode.trim()}
          >
            <Text style={s.applyButtonText}>
              {applying ? "..." : "Apply"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Referral history */}
      {referrals.length > 0 && (
        <View style={s.card}>
          <Text style={s.cardTitle}>Referral History</Text>
          {referrals.map((ref) => (
            <View key={ref.id} style={s.historyRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.historyName}>
                  {ref.referred?.display_name ?? "Friend"}
                </Text>
                <Text style={s.historyDate}>
                  {new Date(ref.created_at).toLocaleDateString("en-SG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
              </View>
              <View
                style={[
                  s.statusBadge,
                  ref.status === "rewarded"
                    ? s.statusRewarded
                    : s.statusPending,
                ]}
              >
                <Text
                  style={
                    ref.status === "rewarded"
                      ? s.statusRewardedText
                      : s.statusPendingText
                  }
                >
                  {ref.status.charAt(0).toUpperCase() + ref.status.slice(1)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  content: { padding: 20 },
  center: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    justifyContent: "center",
    alignItems: "center",
  },
  backButton: { marginBottom: 16 },
  backText: { fontSize: 15, color: "#6B7280" },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  label: { fontSize: 13, color: "#6B7280", marginBottom: 8 },
  codeText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
    textAlign: "center",
    letterSpacing: 4,
    fontFamily: "monospace",
    marginBottom: 16,
  },
  shareButton: {
    backgroundColor: "#E94560",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  shareButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  hint: { fontSize: 13, color: "#6B7280", lineHeight: 18 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
  },
  statLabel: { fontSize: 11, color: "#6B7280", marginTop: 2 },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  inputRow: { flexDirection: "row", gap: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#111827",
  },
  applyButton: {
    backgroundColor: "#E94560",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: "center",
  },
  buttonDisabled: { opacity: 0.5 },
  applyButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  historyName: { fontSize: 14, fontWeight: "500", color: "#111827" },
  historyDate: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  statusRewarded: { backgroundColor: "#D1FAE5" },
  statusPending: { backgroundColor: "#F3F4F6" },
  statusRewardedText: { fontSize: 11, fontWeight: "600", color: "#065F46" },
  statusPendingText: { fontSize: 11, fontWeight: "600", color: "#6B7280" },
});
