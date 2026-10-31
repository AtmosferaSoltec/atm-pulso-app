import { useState } from "react";
import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";

import { useTheme } from "@/theme/ThemeProvider";

import { Text } from "./Text";

export interface InputProps extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
}

export function Input({
  label,
  hint,
  error,
  style,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const { colors, radius } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      {label ? <Text variant="label">{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={label}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          {
            color: colors.text,
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            borderColor: error
              ? colors.danger
              : focused
                ? colors.brand
                : colors.border,
            borderWidth: focused ? 2 : 1,
          },
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" tone="muted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  input: {
    minHeight: 48,
    paddingHorizontal: 14,
    fontSize: 16,
    fontFamily: "Manrope_500Medium",
  },
});
