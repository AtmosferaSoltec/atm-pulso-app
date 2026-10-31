import { View } from "react-native";

import { initials } from "@/lib/format";
import { useTheme } from "@/theme/ThemeProvider";

import { Text } from "./Text";

export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.brandSoft,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        variant="label"
        style={{ color: colors.onBrandSoft, fontSize: size * 0.34 }}
      >
        {initials(name)}
      </Text>
    </View>
  );
}
