import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { useTheme } from "@/theme/ThemeProvider";

import { Icon } from "./Icon";
import { Text } from "./Text";

export interface ListItemProps {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  last?: boolean;
}

export function ListItem({
  title,
  subtitle,
  leading,
  trailing,
  onPress,
  chevron,
  last,
}: ListItemProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          borderBottomColor: colors.border,
          borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      {leading}
      <View style={styles.body}>
        <Text variant="heading" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="body" tone="muted" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
      {chevron ? (
        <Icon name="chevron-forward" size={18} color={colors.textMuted} />
      ) : null}
    </Pressable>
  );
}

/** Groups ListItems inside a rounded surface. */
export function ListGroup({ children }: { children: ReactNode }) {
  const { colors, radius } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: "hidden",
      }}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 64,
  },
  body: { flex: 1, gap: 2 },
});
