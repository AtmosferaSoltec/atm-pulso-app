import * as Haptics from "expo-haptics";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
} from "react-native";

import { useTheme } from "@/theme/ThemeProvider";

import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";

export interface ButtonProps extends Omit<PressableProps, "children"> {
  title: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "md" | "lg";
  icon?: IconName;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  title,
  variant = "primary",
  size = "md",
  icon,
  loading,
  fullWidth = true,
  disabled,
  style,
  onPress,
  ...rest
}: ButtonProps) {
  const { colors, radius } = useTheme();
  const bg = {
    primary: colors.brand,
    secondary: colors.surface,
    ghost: "transparent",
    danger: colors.danger,
  }[variant];
  const fg = {
    primary: colors.onBrand,
    secondary: colors.text,
    ghost: colors.brand,
    danger: "#ffffff",
  }[variant];
  const off = disabled || loading;
  return (
    <Pressable
      onPress={(event) => {
        void Haptics.selectionAsync().catch(() => {});
        onPress?.(event);
      }}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      disabled={off}
      style={(state) => [
        styles.base,
        {
          backgroundColor: bg,
          borderRadius: radius.md,
          minHeight: size === "lg" ? 56 : 48,
          borderWidth: variant === "secondary" ? 1 : 0,
          borderColor: colors.border,
          opacity: off ? 0.5 : state.pressed ? 0.85 : 1,
          alignSelf: fullWidth ? "stretch" : "flex-start",
        },
        typeof style === "function" ? style(state) : style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <Icon name={icon} size={20} color={fg} /> : null}
          <Text
            variant="label"
            style={{ color: fg, fontSize: size === "lg" ? 16 : 15 }}
          >
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
});
