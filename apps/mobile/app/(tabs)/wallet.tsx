import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from "react-native";
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

function formatPrice(cents: number): string {
  return `$${(Math.abs(cents) / 100).toFixed(2)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
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

const QUICK_AMOUNTS = [1000, 2000, 5000, 10000];

export default function WalletTab() {
  const [balance, setBalance] = useState<number>(0);
  const [history, setHistory] = useState<WalletLedgerEntry[]>([]);
  const [packages, setPackages] = useState<PackageWithDetails[]>([]);
  const [myPackages, setMyPackages] = useState<CustomerPackageWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number>(2000);
  const [customAmount, setCustomAmount] = useState("");
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
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
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to load wallet data"
      );
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    void loadData().finally(() => setLoading(false));
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  async function handleTopUp() {
    const amount = customAmount
      ? Math.round(parseFloat(customAmount) * 100)
      : selectedAmount;

    if (!amount || amount <= 0 || isNaN(amount)) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    setTopUpLoading(true);
    try {
      const { checkoutUrl } = await topUpWallet(amount);
      setShowTopUp(false);
      setCustomAmount("");
      // Open Stripe Checkout in browser
      const WebBrowser = await import("expo-web-browser");
      const result = await WebBrowser.openBrowserAsync(checkoutUrl);
      if (result.type === "cancel" || result.type === "dismiss") {
        // User closed the browser — reload wallet in case payment completed
        await loadData();
      } else {
        await loadData();
      }
    } catch (err) {
      Alert.alert(
        "Top-up Failed",
        err instanceof Error ? err.message : "Please try again"
      );
    } finally {
      setTopUpLoading(false);
    }
  }

  async function handlePurchasePackage(pkg: PackageWithDetails) {
    Alert.alert(
      "Purchase Package",
      `Buy "${pkg.name}" for ${formatPrice(pkg.price_cents)} SGD?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Purchase",
          onPress: async () => {
            setPurchaseLoading(pkg.id);
            try {
              await purchasePackage(pkg.id);
              await loadData();
              Alert.alert("Success", `Package "${pkg.name}" purchased!`);
            } catch (err) {
              Alert.alert(
                "Purchase Failed",
                err instanceof Error ? err.message : "Please try again"
              );
            } finally {
              setPurchaseLoading(null);
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void onRefresh()}
        />
      }
    >
      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceValue}>
          {formatPrice(balance)}
          <Text style={styles.balanceCurrency}> SGD</Text>
        </Text>
        <TouchableOpacity
          style={styles.topUpButton}
          onPress={() => setShowTopUp(true)}
        >
          <Text style={styles.topUpButtonText}>Top Up Wallet</Text>
        </TouchableOpacity>
      </View>

      {/* Top-Up Modal */}
      <Modal visible={showTopUp} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Top Up Wallet</Text>
            <Text style={styles.modalSubtitle}>
              Select an amount or enter a custom value
            </Text>

            <View style={styles.quickAmountGrid}>
              {QUICK_AMOUNTS.map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={[
                    styles.quickAmountButton,
                    selectedAmount === amount &&
                      !customAmount &&
                      styles.quickAmountSelected,
                  ]}
                  onPress={() => {
                    setSelectedAmount(amount);
                    setCustomAmount("");
                  }}
                >
                  <Text
                    style={[
                      styles.quickAmountText,
                      selectedAmount === amount &&
                        !customAmount &&
                        styles.quickAmountTextSelected,
                    ]}
                  >
                    {formatPrice(amount)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.customLabel}>Custom Amount (SGD)</Text>
            <TextInput
              style={styles.customInput}
              placeholder="Enter amount"
              keyboardType="decimal-pad"
              value={customAmount}
              onChangeText={setCustomAmount}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowTopUp(false);
                  setCustomAmount("");
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  topUpLoading && styles.buttonDisabled,
                ]}
                disabled={topUpLoading}
                onPress={() => void handleTopUp()}
              >
                {topUpLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirm Top-Up</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Transaction History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transaction History</Text>
        {history.length === 0 ? (
          <Text style={styles.emptyText}>
            No transactions yet. Top up your wallet to get started.
          </Text>
        ) : (
          history.map((entry) => (
            <View key={entry.id} style={styles.historyRow}>
              <View style={styles.historyLeft}>
                <Text style={styles.historyLabel}>{entryLabel(entry)}</Text>
                <Text style={styles.historyDate}>
                  {formatDate(entry.created_at)}
                </Text>
              </View>
              <Text
                style={[
                  styles.historyAmount,
                  entry.amount_cents >= 0
                    ? styles.amountPositive
                    : styles.amountNegative,
                ]}
              >
                {entry.amount_cents >= 0 ? "+" : ""}
                {formatPrice(entry.amount_cents)}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Available Packages */}
      {packages.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Packages</Text>
          {packages.map((pkg) => (
            <View key={pkg.id} style={styles.packageCard}>
              <Text style={styles.packageName}>{pkg.name}</Text>
              {pkg.description ? (
                <Text style={styles.packageDesc}>{pkg.description}</Text>
              ) : null}
              <View style={styles.packageMeta}>
                <View style={styles.sessionsBadge}>
                  <Text style={styles.sessionsBadgeText}>
                    {pkg.sessions_total} sessions
                  </Text>
                </View>
                <Text style={styles.packagePrice}>
                  {formatPrice(pkg.price_cents)} SGD
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.purchaseButton,
                  purchaseLoading === pkg.id && styles.buttonDisabled,
                ]}
                disabled={purchaseLoading === pkg.id}
                onPress={() => void handlePurchasePackage(pkg)}
              >
                {purchaseLoading === pkg.id ? (
                  <ActivityIndicator size="small" color="#111827" />
                ) : (
                  <Text style={styles.purchaseButtonText}>Purchase</Text>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* My Packages */}
      {myPackages.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Packages</Text>
          {myPackages.map((cp) => (
            <View key={cp.id} style={styles.historyRow}>
              <View style={styles.historyLeft}>
                <Text style={styles.historyLabel}>
                  {cp.package?.name ?? "Package"}
                </Text>
                <Text style={styles.historyDate}>
                  Purchased {formatDate(cp.purchased_at)}
                </Text>
              </View>
              <View
                style={[
                  styles.sessionsBadge,
                  cp.sessions_remaining > 0
                    ? styles.badgeGreen
                    : styles.badgeGray,
                ]}
              >
                <Text
                  style={[
                    styles.sessionsBadgeText,
                    cp.sessions_remaining > 0
                      ? styles.badgeGreenText
                      : styles.badgeGrayText,
                  ]}
                >
                  {cp.sessions_remaining} left
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  content: {
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
  },
  balanceCard: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 8,
  },
  balanceCurrency: {
    fontSize: 16,
    fontWeight: "normal",
    color: "#9CA3AF",
  },
  topUpButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 16,
  },
  topUpButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    paddingVertical: 16,
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  historyLeft: {
    flex: 1,
  },
  historyLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  historyDate: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
  },
  historyAmount: {
    fontSize: 14,
    fontWeight: "600",
  },
  amountPositive: {
    color: "#16A34A",
  },
  amountNegative: {
    color: "#DC2626",
  },
  packageCard: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  packageName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  packageDesc: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  packageMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  sessionsBadge: {
    backgroundColor: "#DBEAFE",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sessionsBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1D4ED8",
  },
  badgeGreen: {
    backgroundColor: "#DCFCE7",
  },
  badgeGreenText: {
    color: "#16A34A",
  },
  badgeGray: {
    backgroundColor: "#F3F4F6",
  },
  badgeGrayText: {
    color: "#6B7280",
  },
  packagePrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  purchaseButton: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
    marginTop: 10,
  },
  purchaseButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  modalSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },
  quickAmountGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16,
  },
  quickAmountButton: {
    flex: 1,
    minWidth: "45%",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  quickAmountSelected: {
    borderColor: "#111827",
    backgroundColor: "#111827",
  },
  quickAmountText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  quickAmountTextSelected: {
    color: "#FFFFFF",
  },
  customLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
    marginTop: 16,
  },
  customInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginTop: 6,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#111827",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  bottomSpacer: {
    height: 32,
  },
});
