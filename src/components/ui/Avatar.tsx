import { View } from "react-native";

import { initials } from "@/lib/format";
import { mix } from "@/theme/color";
import { useTheme } from "@/theme/ThemeProvider";

import { Text } from "./Text";

/** Calm hues for initials, so a long list is easy to scan. The brand is mixed in so they sit with any gym. */
const HUES = [
  "#2f7d8c", // teal
  "#4f5bd5", // indigo
  "#c2416b", // rose
  "#b7791f", // amber
  "#7c4dcc", // violet
  "#2f855a", // green
  "#2b6cb0", // blue
];

function hueFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return HUES[Math.abs(h) % HUES.length];
}

/**
 * Initials on a soft tint picked from the name (the same person always gets the same colour, in the list and
 * in their profile). `ring` draws a status ring around it.
 */
export function Avatar({
  name,
  size = 44,
  ring,
}: {
  name: string;
  size?: number;
  ring?: string;
}) {
  const { colors } = useTheme();
  const hue = mix(hueFor(name), colors.brand, 0.85);
  const face = (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: mix(hue, "#ffffff", 0.16),
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        variant="label"
        style={{
          color: mix(hue, "#000000", 0.72),
          fontSize: size * 0.36,
          lineHeight: size * 0.46,
          letterSpacing: 0.2,
        }}
      >
        {initials(name)}
      </Text>
    </View>
  );
  if (!ring) return face;
  return (
    <View
      style={{
        padding: 2,
        borderRadius: size,
        borderWidth: 2,
        borderColor: ring,
      }}
    >
      {face}
    </View>
  );
}
