import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { brandTokens } from "@ex-group/ui/tokens/brands";
import {
  getMyBookings,
  cancelBooking,
  type BookingWithDetails,
} from "@ex-group/db/supabase/bookings";
import type { BookingStatus } from "@ex-group/shared/types/booking";

const brand = brandTokens.ex_style;

const STATUS_COLORS: Record<BookingStatus, { bg: string; text: string }> = {
  pending: { bg: "#FEF3C7", text: "#92400E" },
  confirmed: { bg: "#D1FAE5", text: "#065F46" },
  in_progress: { bg: "#DBEAFE", text: "#1E40AF" },
  completed: { bg: "#E5E7EB", text: "#374151" },
  cancelled: { bg: "#FEE2E2", text: "#991B1B" },
  no_show: { bg: "#FCE7F3", text: "#9D174D" },
};

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
};

function isUpcoming(booking: BookingWithDetails): boolean {
  const now = new Date();
  const bookingDate = new Date(`${booking.booking_date}T${booking.start_time}:00`);
  return (
    bookingDate > now &&
    booking.status !== "cancelled" &&
    booking.status !== "completed" &&
    booking.status !== "no_show"
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-SG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours ?? "0", 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2);
}

export default function BookingsTab() {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    try {
      setError(null);
      const data = await getMyBookings();
      // Sort: upcoming first (by date asc), then past (by date desc)
      const upcoming = data
        .filter(isUpcoming)
        .sort((a, b) => {
          const dateA = `${a.booking_date}T${a.start_time}`;
          const dateB = `${b.booking_date}T${b.start_time}`;
          return dateA.localeCompare(dateB);
        });
      const past = data
        .filter((b) => !isUpcoming(b))
        .sort((a, b) => {
          const dateA = `${a.booking_date}T${a.start_time}`;
          const dateB = `${b.booking_date}T${b.start_time}`;
          return dateB.localeCompare(dateA);
        });
      setBookings([...upcoming, ...past]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchBookings();
  }, [fetchBookings]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void fetchBookings();
  }, [fetchBookings]);

  const handleCancel = useCallback(
    (booking: BookingWithDetails) => {
      Alert.alert(
        "Cancel Booking",
        `Are you sure you want to cancel your booking at ${booking.outlet?.name ?? "this outlet"} on ${formatDate(booking.booking_date)} at ${formatTime(booking.start_time)}?`,
        [
          { text: "Keep Booking", style: "cancel" },
          {
            text: "Cancel Booking",
            style: "destructive",
            onPress: async () => {
              try {
                await cancelBooking(booking.id);
                void fetchBookings();
              } catch (err) {
                Alert.alert(
                  "Error",
                  err instanceof Error ? err.message : "Failed to cancel booking"
                );
              }
            },
          },
        ]
      );
    },
    [fetchBookings]
  );

  const renderBooking = useCallback(
    ({ item }: { item: BookingWithDetails }) => {
      const upcoming = isUpcoming(item);
      const statusColor = STATUS_COLORS[item.status];

      return (
        <View style={[styles.bookingCard, upcoming && styles.bookingCardUpcoming]}>
          <View style={styles.bookingHeader}>
            <Text style={styles.outletName}>
              {item.outlet?.name ?? "Unknown Outlet"}
            </Text>
            <View
              style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}
            >
              <Text style={[styles.statusText, { color: statusColor.text }]}>
                {STATUS_LABELS[item.status]}
              </Text>
            </View>
          </View>

          <Text style={styles.serviceName}>
            {item.service?.name ?? "Unknown Service"}
          </Text>

          <View style={styles.bookingDetails}>
            <Text style={styles.detailText}>
              {formatDate(item.booking_date)}
            </Text>
            <Text style={styles.detailDot}>{" \u00B7 "}</Text>
            <Text style={styles.detailText}>
              {formatTime(item.start_time)} - {formatTime(item.end_time)}
            </Text>
          </View>

          {item.stylist != null && (
            <Text style={styles.stylistText}>
              Stylist: {item.stylist.name}
            </Text>
          )}

          {item.service != null && (
            <Text style={styles.priceText}>
              SGD {formatPrice(item.service.price_cents)}
            </Text>
          )}

          {item.notes != null && item.notes.length > 0 && (
            <Text style={styles.notesText}>Notes: {item.notes}</Text>
          )}

          {upcoming && (
            <TouchableOpacity
              style={styles.cancelButton}
              activeOpacity={0.7}
              onPress={() => handleCancel(item)}
            >
              <Text style={styles.cancelButtonText}>Cancel Booking</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    },
    [handleCancel]
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={brand.accent} />
        <Text style={styles.loadingText}>Loading bookings...</Text>
      </View>
    );
  }

  if (error != null) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          activeOpacity={0.7}
          onPress={() => {
            setLoading(true);
            void fetchBookings();
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (bookings.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyIcon}>{"\uD83D\uDCC5"}</Text>
        <Text style={styles.emptyTitle}>No Bookings Yet</Text>
        <Text style={styles.emptySubtitle}>
          Book your first appointment to get started.
        </Text>
        <TouchableOpacity
          style={styles.bookNowButton}
          activeOpacity={0.8}
          onPress={() => router.push("/book")}
        >
          <Text style={styles.bookNowText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        renderItem={renderBooking}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={brand.accent}
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  centered: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  separator: {
    height: 12,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#6B7280",
  },
  errorText: {
    fontSize: 15,
    color: "#DC2626",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: brand.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },
  emptyIcon: {
    fontSize: 48,
    opacity: 0.3,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
    marginBottom: 20,
    textAlign: "center",
  },
  bookNowButton: {
    backgroundColor: brand.accent,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
  },
  bookNowText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  bookingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  bookingCardUpcoming: {
    borderColor: brand.accent,
    borderWidth: 1.5,
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  outletName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  serviceName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4B5563",
    marginBottom: 8,
  },
  bookingDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  detailText: {
    fontSize: 13,
    color: "#6B7280",
  },
  detailDot: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  stylistText: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },
  priceText: {
    fontSize: 14,
    fontWeight: "600",
    color: brand.primary,
    marginTop: 6,
  },
  notesText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontStyle: "italic",
    marginTop: 4,
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DC2626",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#DC2626",
    fontWeight: "600",
    fontSize: 14,
  },
});
