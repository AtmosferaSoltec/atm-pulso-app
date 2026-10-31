import { Pressable, ScrollView } from "react-native";

import { useTheme } from "@/theme/ThemeProvider";

import { Text } from "./Text";

export interface FilterOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

export function FilterChips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: FilterOption<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { colors, radius } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
    >
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(o.value)}
            style={{
              paddingHorizontal: 14,
              minHeight: 44,
              justifyContent: "center",
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
              {o.count !== undefined ? `  ${o.count}` : ""}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
