"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getWalletBalance,
  getWalletHistory,
  topUpWallet,
  getPackages,
  getMyPackages,
  purchasePackage,
} from "@ex-group/db";
import type {
  PackageWithDetails,
  CustomerPackageWithDetails,
} from "@ex-group/db";
import type { WalletLedgerEntry } from "@ex-group/shared/types/wallet";
import { Card, Button, Badge } from "@ex-group/ui";

function formatPrice(cents: number): string {
  return `$${(Math.abs(cents) / 100).toFixed(2)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function entryLabel(entry: WalletLedgerEntry): string {
  switch (entry.entry_type) {
    case "topup":
      return "Top-up";
    case "topup_bonus":
      return "Top-up Bonus";
    case "payment":
      return "Payment";
    case "refund":
      return "Refund";
    case "adjustment":
      return "Adjustment";
    case "expiry":
      return "Expired";
    default:
      return entry.entry_type;
  }
}

const QUICK_AMOUNTS = [1000, 2000, 5000, 10000]; // cents

export default function WalletPage() {
  const [balance, setBalance] = useState<number>(0);
  const [history, setHistory] = useState<WalletLedgerEntry[]>([]);
  const [packages, setPackages] = useState<PackageWithDetails[]>([]);
  const [myPackages, setMyPackages] = useState<CustomerPackageWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number>(2000);
  const [customAmount, setCustomAmount] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [bal, hist, pkgs, myPkgs] = await Promise.all([
        getWalletBalance(),
        getWalletHistory(50),
        getPackages(),
        getMyPackages(),
      ]);
      setBalance(bal);
      setHistory(hist);
      setPackages(pkgs);
      setMyPackages(myPkgs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load wallet data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleTopUp() {
    const amount = customAmount
      ? Math.round(parseFloat(customAmount) * 100)
      : selectedAmount;

    if (!amount || amount <= 0 || isNaN(amount)) {
      setError("Please enter a valid amount");
      return;
    }

    setTopUpLoading(true);
    setError(null);
    try {
      const { checkoutUrl } = await topUpWallet(amount);
      // Redirect to Stripe Checkout
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Top-up failed");
      setTopUpLoading(false);
    }
  }

  async function handlePurchasePackage(packageId: string) {
    setPurchaseLoading(packageId);
    setError(null);
    try {
      await purchasePackage(packageId);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Package purchase failed");
    } finally {
      setPurchaseLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>
        <p className="mt-1 text-gray-500">Manage your balance and packages</p>
      </div>

      {/* Balance Card */}
      <Card variant="elevated">
        <div className="flex flex-col items-center gap-4 py-6">
          <p className="text-sm font-medium uppercase tracking-wide text-gray-400">
            Available Balance
          </p>
          <p className="text-4xl font-bold text-gray-900">
            {formatPrice(balance)}
            <span className="ml-1 text-lg font-normal text-gray-400">SGD</span>
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => setShowTopUpModal(true)}
          >
            Top Up Wallet
          </Button>
        </div>
      </Card>

      {/* Top-Up Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">Top Up Wallet</h2>
            <p className="mt-1 text-sm text-gray-500">
              Select an amount or enter a custom value
            </p>

            {/* Quick amounts */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              {QUICK_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => {
                    setSelectedAmount(amount);
                    setCustomAmount("");
                  }}
                  className={`rounded-lg border-2 px-4 py-3 text-center text-lg font-semibold transition-colors ${
                    selectedAmount === amount && !customAmount
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 bg-white text-gray-900 hover:border-gray-300"
                  }`}
                >
                  {formatPrice(amount)}
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <div className="mt-4">
              <label
                htmlFor="custom-amount"
                className="block text-sm font-medium text-gray-700"
              >
                Custom Amount (SGD)
              </label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  $
                </span>
                <input
                  id="custom-amount"
                  type="number"
                  min="1"
                  step="0.01"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full rounded-lg border border-gray-300 py-2 pl-7 pr-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setShowTopUpModal(false);
                  setCustomAmount("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                loading={topUpLoading}
                onClick={() => void handleTopUp()}
              >
                Confirm Top-Up
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Transaction History */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Transaction History
        </h2>
        {history.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">
            No transactions yet. Top up your wallet to get started.
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {entryLabel(entry)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDate(entry.created_at)}
                  </p>
                  {entry.description && (
                    <p className="text-xs text-gray-500">{entry.description}</p>
                  )}
                </div>
                <p
                  className={`text-sm font-semibold ${
                    entry.amount_cents >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {entry.amount_cents >= 0 ? "+" : ""}
                  {formatPrice(entry.amount_cents)}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Service Packages */}
      {packages.length > 0 && (
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Service Packages
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="rounded-lg border border-gray-200 p-4"
              >
                <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
                {pkg.description && (
                  <p className="mt-1 text-xs text-gray-500">
                    {pkg.description}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="default">{pkg.sessions_total} sessions</Badge>
                  <span className="text-sm font-bold text-gray-900">
                    {formatPrice(pkg.price_cents)} SGD
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  loading={purchaseLoading === pkg.id}
                  onClick={() => void handlePurchasePackage(pkg.id)}
                >
                  Purchase
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* My Packages */}
      {myPackages.length > 0 && (
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            My Packages
          </h2>
          <div className="divide-y divide-gray-100">
            {myPackages.map((cp) => (
              <div key={cp.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {cp.package?.name ?? "Package"}
                  </p>
                  <p className="text-xs text-gray-400">
                    Purchased {formatDate(cp.purchased_at)}
                  </p>
                  {cp.expires_at && (
                    <p className="text-xs text-gray-400">
                      Expires {formatDate(cp.expires_at)}
                    </p>
                  )}
                </div>
                <Badge
                  variant={cp.sessions_remaining > 0 ? "success" : "default"}
                >
                  {cp.sessions_remaining} sessions left
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
