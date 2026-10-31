import { useFonts } from "expo-font";
import { Manrope_400Regular } from "@expo-google-fonts/manrope/400Regular";
import { Manrope_500Medium } from "@expo-google-fonts/manrope/500Medium";
import { Manrope_700Bold } from "@expo-google-fonts/manrope/700Bold";
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider as NavigationThemeProvider,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import type { ReactNode } from "react";

import { SessionProvider, useSession } from "@/state/session";
import { ThemeProvider, useTheme } from "@/theme/ThemeProvider";

function Branded({ children }: { children: ReactNode }) {
  const { user } = useSession();
  return (
    <ThemeProvider brandColor={user?.gym.brand_color}>{children}</ThemeProvider>
  );
}

function Navigator() {
  const { user } = useSession();
  const { scheme, colors } = useTheme();
  const base = scheme === "dark" ? DarkTheme : DefaultTheme;
  return (
    <NavigationThemeProvider
      value={{
        ...base,
        colors: {
          ...base.colors,
          primary: colors.brand,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
        },
      }}
    >
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!user}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={!!user}>
          <Stack.Screen name="(staff)" />
        </Stack.Protected>
      </Stack>
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_700Bold,
  });
  if (!loaded && !error) return null;
  return (
    <SessionProvider>
      <Branded>
        <Navigator />
      </Branded>
    </SessionProvider>
  );
}
