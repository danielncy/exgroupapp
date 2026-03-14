import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  getAvailableSlots,
  type AvailableSlot,
} from "@ex-group/db/supabase/bookings";
import { brandTokens } from "@ex-group/ui/tokens/brands";

const brand = brandTokens.ex_style;

interface DateOption {
  label: string;
  shortDay: string;
  dayNum: string;
  dateStr: string;
  isToday: boolean;
}

interface StylistGroup {
  stylistId: string;
  stylistName: string;
  slots: AvailableSlot[];
}

function buildDateOptions(count: number): DateOption[] {
  const options: DateOption[] = [];
  const today = new Date();

  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const dateStr = d.toISOString().split("T")[0] ?? "";
    const shortDay = d.toLocaleDateString("en-SG", { weekday: "short" });
    const dayNum = d.getDate().toString();
    const label = i === 0
      ? "Today"
      : i === 1
        ? "Tomorrow"
        : d.toLocaleDateString("en-SG", { weekday: "short", day: "numeric", month: "short" });

    options.push({ label, shortDay, dayNum, dateStr, isToday: i === 0 });
  }

  return options;
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours ?? "0", 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

function groupByStylist(slots: AvailableSlot[]): StylistGroup[] {
  const map = new Map<string, StylistGroup>();

  for (const slot of slots) {
    const existing = map.get(slot.stylist_id);
    if (existing) {
      existing.slots.push(slot);
    } else {
      map.set(slot.stylist_id, {
        stylistId: slot.stylist_id,
        stylistName: slot.stylist_name,
        slots: [slot],
      });
    }
  }

  return Array.from(map.values());
}

export default function SlotsScreen() {
  const { outletId, serviceId } = useLocalSearchParams<{
    outletId: string;
    serviceId: string;
  }>();
  const router = useRouter();

  const dateOptions = buildDateOptions(14);
  const [selectedDate, setSelectedDate] = useState(dateOptions[0]?.dateStr ?? "");
  const [stylistGroups, setStylistGroups] = useState<StylistGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSlots = useCallback(
    async (date: string) => {
      try {
        setLoading(true);
        setError(null);
        const result = await getAvailableSlots(outletId, serviceId, date);
        const groups = groupByStylist(result.slots.filter((s) => s.available));
        setStylistGroups(groups);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load slots");
      } finally {
        setLoading(false);
      }
    },
    [outletId, serviceId]
  );

  useEffect(() => {
    if (selectedDate) {
      void fetchSlots(selectedDate);
    }
  }, [selectedDate, fetchSlots]);

  const handleSlotPress = useCallback(
    (slot: AvailableSlot) => {
      router.push({
        pathname: "/book/confirm",
        params: {
          outletId,
          serviceId,
          date: selectedDate,
          time: slot.time,
          stylistId: slot.stylist_id,
          stylistName: slot.stylist_name,
        },
      });
    },
    [router, outletId, serviceId, selectedDate]
  );

  const renderDateItem = useCallback(
    ({ item }: { item: DateOption }) => {
      const isSelected = item.dateStr === selectedDate;
      return (
        <TouchableOpacity
          style={[styles.dateChip, isSelected && styles.dateChipSelected]}
          activeOpacity={0.7}
          onPress={() => setSelectedDate(item.dateStr)}
        >
          <Text
            style={[
              styles.dateChipDay,
              isSelected && styles.dateChipTextSelected,
            ]}
          >
            {item.shortDay}
          </Text>
          <Text
            style={[
              styles.dateChipNum,
              isSelected && styles.dateChipTextSelected,
            ]}
          >
            {item.dayNum}
          </Text>
        </TouchableOpacity>
      );
    },
    [selectedDate]
  );

  return (
    <View style={styles.container}>
      {/* Date picker */}
      <View style={styles.datePickerContainer}>
        <FlatList
          data={dateOptions}
          keyExtractor={(item) => item.dateStr}
          renderItem={renderDateItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.datePickerContent}
          ItemSeparatorComponent={() => <View style={styles.dateSeparator} />}
        />
      </View>

      {/* Slots */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={brand.accent} />
          <Text style={styles.loadingText}>Loading available slots...</Text>
        </View>
      ) : error != null ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            activeOpacity={0.7}
            onPress={() => void fetchSlots(selectedDate)}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : stylistGroups.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No Available Slots</Text>
          <Text style={styles.emptySubtitle}>
            Try selecting a different date.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.slotsScroll}
          contentContainerStyle={styles.slotsContent}
        >
          {stylistGroups.map((group) => (
            <View key={group.stylistId} style={styles.stylistSection}>
              <Text style={styles.stylistName}>{group.stylistName}</Text>
              <View style={styles.slotsGrid}>
                {group.slots.map((slot) => (
                  <TouchableOpacity
                    key={`${group.stylistId}-${slot.time}`}
                    style={styles.slotChip}
                    activeOpacity={0.7}
                    onPress={() => handleSlotPress(slot)}
                  >
                    <Text style={styles.slotTime}>{formatTime(slot.time)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
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
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  datePickerContainer: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 12,
  },
  datePickerContent: {
    paddingHorizontal: 16,
  },
  dateSeparator: {
    width: 8,
  },
  dateChip: {
    width: 52,
    height: 64,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  dateChipSelected: {
    backgroundColor: brand.accent,
  },
  dateChipDay: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 2,
  },
  dateChipNum: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  dateChipTextSelected: {
    color: "#FFFFFF",
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
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  slotsScroll: {
    flex: 1,
  },
  slotsContent: {
    padding: 16,
    paddingBottom: 40,
  },
  stylistSection: {
    marginBottom: 20,
  },
  stylistName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  slotChip: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: brand.accent,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  slotTime: {
    fontSize: 14,
    fontWeight: "600",
    color: brand.accent,
  },
});
