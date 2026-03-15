import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { brandTokens } from "@ex-group/ui/tokens/brands";
import { signOut, useUser } from "@ex-group/db";

const brand = brandTokens.ex_style;

export default function ProfileTab() {
  const router = useRouter();
  const { user } = useUser();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await signOut();
      router.replace("/login" as never);
    } catch {
      setLoggingOut(false);
      Alert.alert("Error", "Failed to log out. Please try again.");
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Profile</Text>

      {/* Account info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Phone</Text>
          <Text style={styles.value}>{user?.phone ?? "—"}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email ?? "Not set"}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Member since</Text>
          <Text style={styles.value}>
            {user?.created_at
              ? new Date(user.created_at).toLocaleDateString("en-SG", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "—"}
          </Text>
        </View>
      </View>

      {/* Quick links */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Links</Text>
        {[
          { icon: "📅", label: "My Bookings", route: "/(tabs)/bookings" },
          { icon: "💳", label: "Wallet", route: "/(tabs)/wallet" },
          { icon: "⭐", label: "Loyalty & Rewards", route: "/(tabs)/loyalty" },
        ].map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.linkRow}
            activeOpacity={0.6}
            onPress={() => router.push(item.route as never)}
          >
            <Text style={styles.linkIcon}>{item.icon}</Text>
            <Text style={styles.linkLabel}>{item.label}</Text>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity
        style={styles.logoutButton}
        activeOpacity={0.7}
        onPress={() => void handleLogout()}
        disabled={loggingOut}
      >
        <Text style={styles.logoutText}>
          {loggingOut ? "Logging out..." : "Log Out"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  content: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 26, fontWeight: "bold", color: "#111827", marginBottom: 20 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#111827", marginBottom: 12 },
  row: { marginBottom: 12 },
  label: { fontSize: 12, color: "#6B7280", marginBottom: 2 },
  value: { fontSize: 15, fontWeight: "500", color: "#111827" },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  linkIcon: { fontSize: 18, marginRight: 12 },
  linkLabel: { flex: 1, fontSize: 15, color: "#374151" },
  linkArrow: { fontSize: 16, color: "#9CA3AF" },
  logoutButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginTop: 8,
  },
  logoutText: { fontSize: 15, fontWeight: "600", color: "#EF4444" },
});
