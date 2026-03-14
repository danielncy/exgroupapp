"use client";

import { Card, Button, Badge } from "@ex-group/ui";

interface QuickAction {
  title: string;
  description: string;
  icon: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { title: "Book", description: "Schedule your next appointment", icon: "\uD83D\uDCC5" },
  { title: "Top Up", description: "Add funds to your wallet", icon: "\uD83D\uDCB3" },
  { title: "Rewards", description: "Check your loyalty stamps", icon: "\uD83C\uDFC6" },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Welcome section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
        <p className="mt-1 text-gray-500">Here&apos;s what&apos;s happening with your account.</p>
      </div>

      {/* Quick actions */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {QUICK_ACTIONS.map((action) => (
            <Card key={action.title} className="cursor-pointer transition-shadow hover:shadow-md">
              <div className="flex flex-col items-center gap-3 text-center">
                <span className="text-3xl">{action.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{action.title}</h3>
                  <p className="mt-0.5 text-sm text-gray-500">{action.description}</p>
                </div>
                <Button variant="outline" size="sm">
                  {action.title}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Upcoming bookings */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Upcoming Bookings</h2>
        <Card>
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <span className="text-4xl text-gray-300">{"\uD83D\uDCC5"}</span>
            <div>
              <p className="font-medium text-gray-600">No upcoming bookings</p>
              <p className="mt-1 text-sm text-gray-400">
                Book your next appointment to get started.
              </p>
            </div>
            <Button variant="primary" size="md">
              Book Now
            </Button>
          </div>
        </Card>
      </section>

      {/* Membership overview */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Your Membership</h2>
        <Card variant="elevated">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Membership Tier</p>
              <div className="mt-1 flex items-center gap-2">
                <p className="text-lg font-semibold text-gray-900">Silver</p>
                <Badge variant="default">Silver</Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Wallet Balance</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">RM 0.00</p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
