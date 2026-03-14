import { View, Text, StyleSheet } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>EX Group Customer OS</Text>
      <Text style={styles.subtitle}>15 outlets. 4 brands. One platform.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: "#FAFAFA",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1A1A2E",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
  },
});
