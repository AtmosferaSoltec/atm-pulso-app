import { Pressable, ScrollView, View } from "react-native";

import * as Haptics from "expo-haptics";

import { alpha } from "@/theme/color";
import { useTheme } from "@/theme/ThemeProvider";

import { Text } from "./Text";

export interface ChipOption<T extends string> {
  value: T;
  label: string;
  count?: number;
  /** Colours the count when it asks for attention (por vencer, vencidos). */
  tone?: "warning" | "danger";
}

/**
 * Single-choice chips. `scroll` keeps them on one line (filters);
 * otherwise they wrap (form choices), so every option is visible at once.
 */
export function Chips<T extends string>({
  options,
  value,
  onChange,
  scroll = false,
}: {
  options: ChipOption<T>[];
  value: T;
  onChange: (v: T) => void;
  scroll?: boolean;
}) {
  const { colors, radius } = useTheme();
  const items = options.map((o) => {
    const selected = o.value === value;
    const badge = selected
      ? { bg: alpha(colors.onBrand, 0.2), fg: colors.onBrand }
      : o.tone === "danger"
        ? { bg: colors.dangerSoft, fg: colors.danger }
        : o.tone === "warning"
          ? { bg: colors.warningSoft, fg: colors.warning }
          : { bg: colors.surfaceAlt, fg: colors.textMuted };
    return (
      <Pressable
        key={o.value}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        accessibilityLabel={
          o.count !== undefined ? `${o.label}, ${o.count}` : o.label
        }
        onPress={() => {
          if (!selected) void Haptics.selectionAsync().catch(() => {});
          onChange(o.value);
        }}
        hitSlop={{ top: 4, bottom: 4 }}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: 7,
          paddingLeft: 14,
          paddingRight: o.count !== undefined ? 6 : 14,
          height: 40,
          borderRadius: radius.pill,
          backgroundColor: selected ? colors.brand : colors.surface,
          borderWidth: 1,
          borderColor: selected ? colors.brand : colors.border,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Text
          variant="label"
          style={{ color: selected ? colors.onBrand : colors.text }}
        >
          {o.label}
        </Text>
        {o.count !== undefined && (
          <View
            style={{
              minWidth: 26,
              height: 26,
              paddingHorizontal: 7,
              borderRadius: 13,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: badge.bg,
            }}
          >
            <Text
              variant="caption"
              style={{
                color: badge.fg,
                fontFamily: "Manrope_700Bold",
                fontSize: 12,
                lineHeight: 16,
              }}
            >
              {o.count}
            </Text>
          </View>
        )}
      </Pressable>
    );
  });
  if (scroll)
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityRole="radiogroup"
        contentContainerStyle={{
          gap: 8,
          paddingHorizontal: 16,
          paddingVertical: 6,
        }}
        style={{ marginHorizontal: -16, marginVertical: -6, flexGrow: 0 }}
      >
        {items}
      </ScrollView>
    );
  return (
    <View
      accessibilityRole="radiogroup"
      style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
    >
      {items}
    </View>
  );
}
