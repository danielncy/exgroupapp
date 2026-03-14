import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "@ex-group/db/supabase/client";
import { createBooking } from "@ex-group/db/supabase/bookings";
import { brandTokens } from "@ex-group/ui/tokens/brands";

const brand = brandTokens.ex_style;

interface OutletInfo {
  name: string;
  address: string;
}

interface ServiceInfo {
  name: string;
  duration_minutes: number;
  price_cents: number;
  currency: string;
}

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-SG", {
    weekday: "long",
    day: "numeric",
    month: "long",
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

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export default function ConfirmScreen() {
  const {
    outletId,
    serviceId,
    date,
    time,
    stylistId,
    stylistName,
  } = useLocalSearchParams<{
    outletId: string;
    serviceId: string;
    date: string;
    time: string;
    stylistId: string;
    stylistName: string;
  }>();
  const router = useRouter();

  const [outlet, setOutlet] = useState<OutletInfo | null>(null);
  const [service, setService] = useState<ServiceInfo | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchDetails() {
      try {
        const [outletResult, serviceResult] = await Promise.all([
          supabase
            .from("outlets")
            .select("name, address")
            .eq("id", outletId)
            .single(),
          supabase
            .from("services")
            .select("name, duration_minutes, price_cents, currency")
            .eq("id", serviceId)
            .single(),
        ]);

        if (outletResult.data) {
          setOutlet(outletResult.data as OutletInfo);
        }
        if (serviceResult.data) {
          setService(serviceResult.data as ServiceInfo);
        }
      } catch {
        // Details are supplementary; the booking can proceed with IDs alone
      } finally {
        setLoadingDetails(false);
      }
    }

    void fetchDetails();
  }, [outletId, serviceId]);

  const handleConfirm = useCallback(async () => {
    setSubmitting(true);
    try {
      await createBooking({
        outlet_id: outletId,
        service_id: serviceId,
        stylist_id: stylistId || undefined,
        booking_date: date,
        start_time: time,
        notes: notes.trim() || undefined,
      });

      Alert.alert(
        "Booking Confirmed",
        `Your appointment has been booked for ${formatDate(date)} at ${formatTime(time)}.`,
        [
          {
            text: "View My Bookings",
            onPress: () => {
              // Navigate back to the bookings tab
              router.dismissAll();
              router.replace("/(tabs)/bookings" as never);
            },
          },
        ]
      );
    } catch (err) {
      Alert.alert(
        "Booking Failed",
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }, [outletId, serviceId, stylistId, date, time, notes, router]);

  if (loadingDetails) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={brand.accent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Summary card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Booking Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Outlet</Text>
            <Text style={styles.summaryValue}>
              {outlet?.name ?? "Selected Outlet"}
            </Text>
          </View>
          {outlet?.address != null && (
            <Text style={styles.summarySubvalue}>{outlet.address}</Text>
          )}

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service</Text>
            <Text style={styles.summaryValue}>
              {service?.name ?? "Selected Service"}
            </Text>
          </View>
          {service != null && (
            <Text style={styles.summarySubvalue}>
              {formatDuration(service.duration_minutes)}
            </Text>
          )}

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Date</Text>
            <Text style={styles.summaryValue}>{formatDate(date)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Time</Text>
            <Text style={styles.summaryValue}>{formatTime(time)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Stylist</Text>
            <Text style={styles.summaryValue}>
              {stylistName || "Any Available"}
            </Text>
          </View>

          {service != null && (
            <>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Price</Text>
                <Text style={styles.priceValue}>
                  SGD {formatPrice(service.price_cents)}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Notes */}
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>Notes (optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Any special requests or preferences..."
            placeholderTextColor="#9CA3AF"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            maxLength={500}
          />
        </View>
      </ScrollView>

      {/* Confirm button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmButton, submitting && styles.confirmButtonDisabled]}
          activeOpacity={0.8}
          onPress={() => void handleConfirm()}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmButtonText}>Confirm Booking</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
    marginRight: 16,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
    textAlign: "right",
  },
  summarySubvalue: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "right",
    marginTop: 2,
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: "700",
    color: brand.accent,
    flex: 1,
    textAlign: "right",
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 10,
  },
  notesSection: {
    marginTop: 16,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
    fontSize: 15,
    color: "#111827",
    minHeight: 80,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  confirmButton: {
    backgroundColor: brand.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
});
