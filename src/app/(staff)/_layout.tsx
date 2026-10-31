import { Stack } from "expo-router";
import { useTheme } from "@/theme/ThemeProvider";
export default function StaffLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerBackButtonDisplayMode: "minimal",
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="members/[id]/index"
        options={{ title: "Ficha del miembro" }}
      />
      <Stack.Screen
        name="members/[id]/renew"
        options={{ title: "Suscripción", presentation: "modal" }}
      />
      <Stack.Screen
        name="members/new"
        options={{ title: "Nuevo miembro", presentation: "modal" }}
      />
    </Stack>
  );
}
