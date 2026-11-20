import { Stack } from "expo-router";
import { useTheme } from "@/theme/ThemeProvider";
export default function StaffLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: "Manrope_700Bold", fontSize: 17 },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: "minimal",
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ title: "Perfil" }} />
      <Stack.Screen name="password" options={{ title: "Cambiar contraseña" }} />
      <Stack.Screen
        name="camera"
        options={{
          headerShown: false,
          presentation: "fullScreenModal",
          animation: "slide_from_bottom",
          contentStyle: { backgroundColor: "#000" },
        }}
      />
      <Stack.Screen name="members/[id]/index" options={{ title: "" }} />
      <Stack.Screen
        name="members/[id]/subscription"
        options={{ title: "Suscripción" }}
      />
      <Stack.Screen name="sale/index" options={{ title: "Venta rápida" }} />
      <Stack.Screen name="sale/checkout" options={{ title: "Cobrar" }} />
      <Stack.Screen name="members/new" options={{ title: "Nuevo miembro" }} />
    </Stack>
  );
}
