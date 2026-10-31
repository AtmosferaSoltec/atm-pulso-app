import { Pressable, ScrollView, View } from "react-native";

import { useTheme } from "@/theme/ThemeProvider";

import { Text } from "./Text";

export interface ChipOption<T extends string> {
  value: T;
  label: string;
  count?: number;
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
    return (
      <Pressable
        key={o.value}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        accessibilityLabel={
          o.count !== undefined ? `${o.label}, ${o.count}` : o.label
        }
        onPress={() => onChange(o.value)}
        hitSlop={{ top: 4, bottom: 4 }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingHorizontal: 12,
          height: 40,
          borderRadius: radius.pill,
          backgroundColor: selected ? colors.brand : colors.surface,
          borderWidth: 1,
          borderColor: selected ? colors.brand : colors.border,
        }}
      >
        <Text
          variant="label"
          style={{ color: selected ? colors.onBrand : colors.text }}
        >
          {o.label}
        </Text>
        {o.count !== undefined && (
          <Text
            variant="caption"
            style={{ color: selected ? colors.onBrand : colors.textMuted }}
          >
            {o.count}
          </Text>
        )}
      </Pressable>
    );
  });
  if (scroll)
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
        style={{ marginHorizontal: -16, flexGrow: 0 }}
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
