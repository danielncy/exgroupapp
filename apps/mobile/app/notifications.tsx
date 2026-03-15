import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { Stack } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { brandTokens } from "@ex-group/ui/tokens/brands";
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  subscribeToNotifications,
  unsubscribeNotifications,
} from "@ex-group/db";
import type { RealtimeNotification } from "@ex-group/db";

const brand = brandTokens.ex_style;

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

const TYPE_ICONS: Record<string, string> = {
  booking_confirmed: "📅",
  booking_reminder: "⏰",
  post_visit: "⭐",
  loyalty_reward: "🎁",
  promotion: "📢",
  system: "ℹ️",
};

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await getMyNotifications(100);
      setNotifications(data as Notification[]);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  // Realtime: prepend new notifications
  useEffect(() => {
    subscribeToNotifications((newNotif: RealtimeNotification) => {
      setNotifications((prev) => [newNotif as unknown as Notification, ...prev]);
    });

    return () => {
      void unsubscribeNotifications();
    };
  }, []);

  async function handleMarkRead(id: string) {
    await markAsRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  }

  async function handleMarkAllRead() {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <>
      <Stack.Screen
        options={{
          title: "Notifications",
          headerStyle: { backgroundColor: brand.primary },
          headerTintColor: "#FFFFFF",
          headerRight: unreadCount > 0
            ? () => (
                <TouchableOpacity onPress={() => void handleMarkAllRead()} style={{ marginRight: 8 }}>
                  <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "600" }}>
                    Read all ({unreadCount})
                  </Text>
                </TouchableOpacity>
              )
            : undefined,
        }}
      />
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={brand.accent} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyText}>No notifications yet</Text>
        </View>
      ) : (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          {notifications.map((n) => (
            <TouchableOpacity
              key={n.id}
              style={[styles.notifCard, !n.is_read && styles.notifCardUnread]}
              activeOpacity={0.7}
              onPress={() => !n.is_read && void handleMarkRead(n.id)}
            >
              <Text style={styles.notifIcon}>{TYPE_ICONS[n.type] ?? "🔔"}</Text>
              <View style={{ flex: 1 }}>
                <View style={styles.notifHeader}>
                  <Text style={[styles.notifTitle, !n.is_read && styles.notifTitleUnread]}>
                    {n.title}
                  </Text>
                  <Text style={styles.notifTime}>{timeAgo(n.created_at)}</Text>
                </View>
                <Text style={styles.notifBody}>{n.body}</Text>
              </View>
              {!n.is_read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  content: { padding: 16, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FAFAFA" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FAFAFA" },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: "#6B7280" },
  notifCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 12,
  },
  notifCardUnread: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },
  notifIcon: { fontSize: 24, marginTop: 2 },
  notifHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  notifTitle: { fontSize: 15, fontWeight: "500", color: "#374151", flex: 1 },
  notifTitleUnread: { fontWeight: "600", color: "#111827" },
  notifTime: { fontSize: 11, color: "#9CA3AF", marginLeft: 8 },
  notifBody: { fontSize: 13, color: "#6B7280", marginTop: 4, lineHeight: 18 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3B82F6",
    marginTop: 6,
  },
});
