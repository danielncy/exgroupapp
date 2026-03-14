import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { brandTokens } from "@ex-group/ui/tokens/brands";

const brand = brandTokens.ex_style;

interface QuickAction {
  title: string;
  description: string;
  icon: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { title: "Book", description: "Schedule appointment", icon: "\uD83D\uDCC5" },
  { title: "Top Up", description: "Add wallet funds", icon: "\uD83D\uDCB3" },
  { title: "Rewards", description: "View your stamps", icon: "\uD83C\uDFC6" },
];

export default function HomeTab() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Welcome section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>Welcome back!</Text>
        <Text style={styles.welcomeSubtitle}>
          Here&apos;s what&apos;s happening with your account.
        </Text>
      </View>

      {/* Quick actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity key={action.title} style={styles.actionCard} activeOpacity={0.7}>
              <Text style={styles.actionIcon}>{action.icon}</Text>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionDescription}>{action.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Upcoming bookings placeholder */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Bookings</Text>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>{"\uD83D\uDCC5"}</Text>
          <Text style={styles.emptyText}>No upcoming bookings</Text>
          <Text style={styles.emptySubtext}>Book your next appointment to get started.</Text>
          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8}>
            <Text style={styles.primaryButtonText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: brand.primary,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: "#6B7280",
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  actionDescription: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
    textAlign: "center",
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
    opacity: 0.3,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#4B5563",
  },
  emptySubtext: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 4,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: brand.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },
});
