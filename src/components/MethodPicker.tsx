import { Pressable, View } from "react-native";

import { METHOD_LABEL } from "@/lib/format";
import { useTheme } from "@/theme/ThemeProvider";
import type { PaymentMethod } from "@/types";

import { Text } from "./ui";

const METHODS: PaymentMethod[] = ["yape_plin", "cash", "card", "transfer"];

export function MethodPicker({
  value,
  onChange,
}: {
  value: PaymentMethod;
  onChange: (m: PaymentMethod) => void;
}) {
  const { colors, radius } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Text variant="label">Método de pago</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {METHODS.map((m) => {
          const selected = m === value;
          return (
            <Pressable
              key={m}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onChange(m)}
              style={{
                paddingHorizontal: 14,
                minHeight: 44,
                justifyContent: "center",
                borderRadius: radius.md,
                borderWidth: selected ? 2 : 1,
                borderColor: selected ? colors.brand : colors.border,
                backgroundColor: selected ? colors.brandSoft : colors.surface,
              }}
            >
              <Text variant="label">{METHOD_LABEL[m]}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
