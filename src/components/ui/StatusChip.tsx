import { View } from "react-native";

import { STATUS_LABEL } from "@/lib/format";
import { useTheme } from "@/theme/ThemeProvider";
import type { MemberStatus } from "@/types";

import { Text } from "./Text";

type Tone = "success" | "warning" | "danger" | "info" | "neutral" | "brand";

export function Chip({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: Tone;
}) {
  const { colors, radius } = useTheme();
  const map: Record<Tone, [string, string]> = {
    success: [colors.successSoft, colors.success],
    warning: [colors.warningSoft, colors.warning],
    danger: [colors.dangerSoft, colors.danger],
    info: [colors.infoSoft, colors.info],
    neutral: [colors.surfaceAlt, colors.textMuted],
    brand: [colors.brandSoft, colors.onBrandSoft],
  };
  const [bg, fg] = map[tone];
  return (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: radius.pill,
        paddingHorizontal: 10,
        paddingVertical: 4,
        alignSelf: "flex-start",
      }}
    >
      <Text variant="caption" style={{ color: fg, fontWeight: "700" }}>
        {label}
      </Text>
    </View>
  );
}

export const STATUS_TONE: Record<MemberStatus, Tone> = {
  active: "success",
  expiring: "warning",
  expired: "danger",
  scheduled: "info",
};

export function StatusChip({ status }: { status: MemberStatus }) {
  return <Chip label={STATUS_LABEL[status]} tone={STATUS_TONE[status]} />;
}
