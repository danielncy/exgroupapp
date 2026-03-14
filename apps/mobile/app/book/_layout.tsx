import { Stack } from "expo-router";

export default function BookLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#1A1A2E" },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: { fontWeight: "bold" },
        headerBackTitle: "Back",
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: "Select Outlet" }}
      />
      <Stack.Screen
        name="[outletId]"
        options={{ title: "Select Service" }}
      />
      <Stack.Screen
        name="slots"
        options={{ title: "Pick a Time" }}
      />
      <Stack.Screen
        name="confirm"
        options={{ title: "Confirm Booking" }}
      />
    </Stack>
  );
}
