"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, Button } from "@ex-group/ui";
import { signOut, useUser } from "@ex-group/db";

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useUser();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await signOut();
      router.push("/login");
    } catch {
      setLoggingOut(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Profile</h1>

      {/* Account info */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account</h2>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-500">Phone</p>
            <p className="font-medium text-gray-900">
              {user?.phone ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium text-gray-900">
              {user?.email ?? "Not set"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Member since</p>
            <p className="font-medium text-gray-900">
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString("en-SG", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "—"}
            </p>
          </div>
        </div>
      </Card>

      {/* Quick links */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>
        <div className="space-y-2">
          <button
            onClick={() => router.push("/notifications")}
            className="w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-sm hover:bg-gray-50 transition"
          >
            <span className="flex items-center gap-3">
              <span>🔔</span>
              <span className="text-gray-700">Notifications</span>
            </span>
            <span className="text-gray-400">→</span>
          </button>
          <button
            onClick={() => router.push("/wallet")}
            className="w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-sm hover:bg-gray-50 transition"
          >
            <span className="flex items-center gap-3">
              <span>💳</span>
              <span className="text-gray-700">Wallet</span>
            </span>
            <span className="text-gray-400">→</span>
          </button>
          <button
            onClick={() => router.push("/loyalty")}
            className="w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-sm hover:bg-gray-50 transition"
          >
            <span className="flex items-center gap-3">
              <span>⭐</span>
              <span className="text-gray-700">Loyalty & Rewards</span>
            </span>
            <span className="text-gray-400">→</span>
          </button>
        </div>
      </Card>

      {/* Logout */}
      <Button
        variant="outline"
        size="md"
        onClick={() => void handleLogout()}
        disabled={loggingOut}
        className="w-full"
      >
        {loggingOut ? "Logging out..." : "Log Out"}
      </Button>
    </div>
  );
}
