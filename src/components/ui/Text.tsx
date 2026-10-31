import { Text as RNText, type TextProps as RNTextProps } from "react-native";

import { useTheme } from "@/theme/ThemeProvider";
import type { TypographyVariant } from "@/theme/tokens";

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  tone?: "default" | "muted" | "brand" | "danger" | "success" | "inverse";
}

export function Text({
  variant = "body",
  tone = "default",
  style,
  ...rest
}: TextProps) {
  const { colors, typography } = useTheme();
  const color = {
    default: colors.text,
    muted: colors.textMuted,
    brand: colors.brand,
    danger: colors.danger,
    success: colors.success,
    inverse: colors.textInverse,
  }[tone];
  return (
    <RNText
      {...rest}
      style={[
        typography[variant],
        {
          color,
          fontFamily:
            variant === "body"
              ? "Manrope_400Regular"
              : variant === "caption"
                ? "Manrope_500Medium"
                : "Manrope_700Bold",
          fontWeight: undefined,
        },
        style,
      ]}
    />
  );
}
