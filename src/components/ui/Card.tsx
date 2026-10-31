import { Pressable, View, type ViewProps } from "react-native";

import { useTheme } from "@/theme/ThemeProvider";

export interface CardProps extends ViewProps {
  padded?: boolean;
  onPress?: () => void;
}

export function Card({
  padded = true,
  onPress,
  style,
  children,
  ...rest
}: CardProps) {
  const { colors, radius, spacing } = useTheme();
  const base = {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: padded ? spacing.lg : 0,
    overflow: "hidden" as const,
  };
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          base,
          { opacity: pressed ? 0.85 : 1 },
          style as object,
        ]}
      >
        {children}
      </Pressable>
    );
  }
  return (
    <View style={[base, style]} {...rest}>
      {children}
    </View>
  );
}
