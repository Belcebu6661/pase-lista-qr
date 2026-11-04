import { Stack } from "expo-router";
import { AttendanceProvider } from "../context/AttendanceContext";

export default function RootLayout() {
  return (
    <AttendanceProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </AttendanceProvider>
  );
}
