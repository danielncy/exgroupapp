import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@ex-group/db/supabase/client";
import { brandTokens } from "@ex-group/ui/tokens/brands";
import type { BrandId } from "@ex-group/shared/types/brand";

const brand = brandTokens.ex_style;

interface OutletWithBrand {
  id: string;
  name: string;
  address: string;
  phone: string;
  brand_id: string;
  brand: {
    code: BrandId;
    name: string;
  } | null;
}

const BRAND_ACCENT: Record<BrandId, string> = {
  ex_style: brandTokens.ex_style.accent,
  ex_beauty: brandTokens.ex_beauty.accent,
  uhair: brandTokens.uhair.accent,
  coulisse: brandTokens.coulisse.accent,
};

export default function SelectOutletScreen() {
  const router = useRouter();
  const [outlets, setOutlets] = useState<OutletWithBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchOutlets = useCallback(async () => {
    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from("outlets")
        .select(`
          id, name, address, phone, brand_id,
          brand:brands(code, name)
        `)
        .eq("is_active", true)
        .eq("country", "SG")
        .order("name");

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      const mapped = (data ?? []).map((d) => ({
        ...d,
        brand: Array.isArray(d.brand) ? d.brand[0] ?? null : d.brand,
      })) as OutletWithBrand[];
      setOutlets(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load outlets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOutlets();
  }, [fetchOutlets]);

  const filteredOutlets = search.trim().length > 0
    ? outlets.filter(
        (o) =>
          o.name.toLowerCase().includes(search.toLowerCase()) ||
          o.address.toLowerCase().includes(search.toLowerCase()) ||
          (o.brand?.name ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : outlets;

  const renderOutlet = useCallback(
    ({ item }: { item: OutletWithBrand }) => {
      const brandCode = item.brand?.code ?? "ex_style";
      const accentColor = BRAND_ACCENT[brandCode];

      return (
        <TouchableOpacity
          style={styles.outletCard}
          activeOpacity={0.7}
          onPress={() =>
            router.push({
              pathname: "/book/[outletId]",
              params: { outletId: item.id, brandId: item.brand_id },
            })
          }
        >
          <View style={[styles.brandStripe, { backgroundColor: accentColor }]} />
          <View style={styles.outletContent}>
            <View style={styles.outletHeader}>
              <Text style={styles.outletName}>{item.name}</Text>
              {item.brand != null && (
                <View
                  style={[
                    styles.brandBadge,
                    { backgroundColor: accentColor + "20" },
                  ]}
                >
                  <Text style={[styles.brandBadgeText, { color: accentColor }]}>
                    {item.brand.name}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.outletAddress}>{item.address}</Text>
            <Text style={styles.outletPhone}>{item.phone}</Text>
          </View>
        </TouchableOpacity>
      );
    },
    [router]
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={brand.accent} />
        <Text style={styles.loadingText}>Loading outlets...</Text>
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
            void fetchOutlets();
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search outlets or brands..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>
      <FlatList
        data={filteredOutlets}
        keyExtractor={(item) => item.id}
        renderItem={renderOutlet}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No outlets found</Text>
          </View>
        }
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
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  searchInput: {
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
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
  emptyText: {
    fontSize: 15,
    color: "#6B7280",
    marginTop: 40,
  },
  outletCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    overflow: "hidden",
  },
  brandStripe: {
    width: 4,
  },
  outletContent: {
    flex: 1,
    padding: 16,
  },
  outletHeader: {
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
  brandBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  brandBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  outletAddress: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 2,
  },
  outletPhone: {
    fontSize: 13,
    color: "#9CA3AF",
  },
});
