import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import type { ColorValue } from "react-native";

import { useTheme } from "@/theme/ThemeProvider";

export type IconName = ComponentProps<typeof Ionicons>["name"];

export function Icon({
  name,
  size = 22,
  color,
}: {
  name: IconName;
  size?: number;
  color?: ColorValue;
}) {
  const { colors } = useTheme();
  return (
    <Ionicons
      name={name}
      size={size}
      color={(color ?? colors.text) as string}
    />
  );
}
