"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  subscribeToNotifications,
  unsubscribeNotifications,
} from "@ex-group/db";
import type { RealtimeNotification } from "@ex-group/db";
import { Button } from "@ex-group/ui";

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

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const data = await getMyNotifications(100);
      setNotifications(data as Notification[]);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetch(); }, [fetch]);

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
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  }

  async function handleMarkAllRead() {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-brand-primary" /></div>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => void handleMarkAllRead()}>
            Mark all as read ({unreadCount})
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-4">🔔</p>
          <p>No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => !n.is_read && void handleMarkRead(n.id)}
              className={`w-full text-left p-4 rounded-lg border transition ${
                n.is_read ? "bg-white border-gray-100" : "bg-blue-50 border-blue-100"
              }`}
            >
              <div className="flex gap-3">
                <span className="text-2xl">{TYPE_ICONS[n.type] ?? "🔔"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`font-medium ${n.is_read ? "text-gray-700" : "text-gray-900"}`}>
                      {n.title}
                    </p>
                    <span className="text-xs text-gray-400 ml-2 shrink-0">{timeAgo(n.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{n.body}</p>
                </div>
                {!n.is_read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2" />}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
