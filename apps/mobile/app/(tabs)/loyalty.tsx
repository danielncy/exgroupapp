import { View, Text, StyleSheet } from "react-native";

export default function LoyaltyTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Loyalty</Text>
      <Text style={styles.subtitle}>Your stamps and rewards will appear here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
  },
});
