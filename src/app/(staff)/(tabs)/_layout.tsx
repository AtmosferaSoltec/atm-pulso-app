import { Tabs } from "expo-router";
import { Icon } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";
export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontFamily: "Manrope_700Bold", fontSize: 11 },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingTop: 8,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Buscar",
          tabBarIcon: ({ color }) => (
            <Icon name="search-outline" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="members"
        options={{
          title: "Miembros",
          tabBarIcon: ({ color }) => (
            <Icon name="people-outline" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => (
            <Icon name="person-outline" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
