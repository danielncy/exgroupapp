import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { brandTokens } from "@ex-group/ui/tokens/brands";
import { signOut, useUser, updateDateOfBirth, supabase } from "@ex-group/db";

const brand = brandTokens.ex_style;

export default function ProfileTab() {
  const router = useRouter();
  const { user } = useUser();
  const [loggingOut, setLoggingOut] = useState(false);
  const [dob, setDob] = useState("");
  const [dobSaving, setDobSaving] = useState(false);

  useEffect(() => {
    async function loadDob() {
      if (!user) return;
      const { data } = await supabase
        .from("customers")
        .select("date_of_birth")
        .eq("auth_user_id", user.id)
        .single();
      if (data?.date_of_birth) setDob(data.date_of_birth as string);
    }
    void loadDob();
  }, [user]);

  async function handleSaveDob() {
    if (!dob) return;
    setDobSaving(true);
    try {
      await updateDateOfBirth(dob);
      Alert.alert("Saved", "Birthday saved successfully!");
    } catch {
      Alert.alert("Error", "Failed to save date of birth");
    } finally {
      setDobSaving(false);
    }
  }

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

      {/* Birthday */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Birthday</Text>
        <Text style={styles.dobHint}>
          Set your birthday to receive bonus loyalty points every year!
        </Text>
        <View style={styles.dobRow}>
          <TextInput
            style={styles.dobInput}
            value={dob}
            onChangeText={setDob}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9CA3AF"
            keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "default"}
          />
          <TouchableOpacity
            style={[styles.dobButton, (!dob || dobSaving) && styles.dobButtonDisabled]}
            activeOpacity={0.7}
            onPress={() => void handleSaveDob()}
            disabled={dobSaving || !dob}
          >
            <Text style={styles.dobButtonText}>
              {dobSaving ? "..." : "Save"}
            </Text>
          </TouchableOpacity>
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
  dobHint: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 12,
    lineHeight: 18,
  },
  dobRow: {
    flexDirection: "row",
    gap: 8,
  },
  dobInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#111827",
  },
  dobButton: {
    backgroundColor: "#E94560",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: "center",
  },
  dobButtonDisabled: {
    opacity: 0.5,
  },
  dobButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
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
