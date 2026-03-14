import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "@ex-group/db/supabase/client";
import { brandTokens } from "@ex-group/ui/tokens/brands";

const brand = brandTokens.ex_style;

interface ServiceItem {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price_cents: number;
  currency: string;
  category: string;
}

interface ServiceSection {
  title: string;
  data: ServiceItem[];
}

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2);
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export default function SelectServiceScreen() {
  const { outletId, brandId } = useLocalSearchParams<{
    outletId: string;
    brandId: string;
  }>();
  const router = useRouter();
  const [sections, setSections] = useState<ServiceSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    try {
      setError(null);

      // If brandId not passed, look it up from the outlet
      let resolvedBrandId = brandId;
      if (!resolvedBrandId) {
        const { data: outlet, error: outletError } = await supabase
          .from("outlets")
          .select("brand_id")
          .eq("id", outletId)
          .single();

        if (outletError || !outlet) {
          throw new Error("Outlet not found");
        }
        resolvedBrandId = (outlet as { brand_id: string }).brand_id;
      }

      const { data, error: fetchError } = await supabase
        .from("services")
        .select("id, name, description, duration_minutes, price_cents, currency, category")
        .eq("brand_id", resolvedBrandId)
        .eq("is_active", true)
        .order("category")
        .order("name");

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      // Group by category
      const grouped = new Map<string, ServiceItem[]>();
      for (const service of (data ?? []) as ServiceItem[]) {
        const existing = grouped.get(service.category) ?? [];
        existing.push(service);
        grouped.set(service.category, existing);
      }

      const sectionData: ServiceSection[] = [];
      for (const [title, items] of grouped) {
        sectionData.push({ title, data: items });
      }

      setSections(sectionData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load services");
    } finally {
      setLoading(false);
    }
  }, [outletId, brandId]);

  useEffect(() => {
    void fetchServices();
  }, [fetchServices]);

  const renderService = useCallback(
    ({ item }: { item: ServiceItem }) => (
      <TouchableOpacity
        style={styles.serviceCard}
        activeOpacity={0.7}
        onPress={() =>
          router.push({
            pathname: "/book/slots",
            params: { outletId, serviceId: item.id },
          })
        }
      >
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{item.name}</Text>
          {item.description.length > 0 && (
            <Text style={styles.serviceDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          <Text style={styles.serviceDuration}>
            {formatDuration(item.duration_minutes)}
          </Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>SGD</Text>
          <Text style={styles.priceValue}>{formatPrice(item.price_cents)}</Text>
        </View>
      </TouchableOpacity>
    ),
    [router, outletId]
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: ServiceSection }) => (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
      </View>
    ),
    []
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={brand.accent} />
        <Text style={styles.loadingText}>Loading services...</Text>
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
            void fetchServices();
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (sections.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No services available for this outlet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderService}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
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
    paddingBottom: 40,
  },
  separator: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginHorizontal: 16,
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
  emptyText: {
    fontSize: 15,
    color: "#6B7280",
  },
  sectionHeader: {
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  serviceCard: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  serviceInfo: {
    flex: 1,
    marginRight: 12,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  serviceDescription: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 4,
  },
  serviceDuration: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  priceLabel: {
    fontSize: 10,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  priceValue: {
    fontSize: 16,
    fontWeight: "700",
    color: brand.primary,
  },
});
