import { View } from "react-native";

import { Text } from "./Text";

/** Label / value line for detail screens and receipts. */
export function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 16,
        paddingVertical: 6,
      }}
    >
      <Text tone="muted">{label}</Text>
      <Text variant="label" style={{ flexShrink: 1, textAlign: "right" }}>
        {value}
      </Text>
    </View>
  );
}
