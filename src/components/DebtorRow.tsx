import { View } from "react-native";
import { router } from "expo-router";

import { formatMoney, owedSince } from "@/lib/format";
import { useTheme } from "@/theme/ThemeProvider";
import type { Debtor } from "@/types";

import { Avatar, Icon, PressableScale, Text } from "./ui";

/**
 * A member who owes, in the same card shape as MemberRow: who, how much, since when.
 * Tapping opens their card, where «Cobrar» collects the pending sales.
 */
export function DebtorRow({ debtor }: { debtor: Debtor }) {
  const { colors, radius } = useTheme();
  const { member } = debtor;
  const owed = `Debe ${formatMoney(debtor.balance)}`;
  const since = owedSince(debtor.oldest_sold_on);
  const detail =
    debtor.pending_count === 1
      ? `1 venta · ${since}`
      : `${debtor.pending_count} ventas · ${since}`;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${member.full_name}, ${owed}, ${detail}`}
      onPress={() => router.push(`/members/${member.id}`)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        minHeight: 76,
        paddingVertical: 12,
        paddingLeft: 12,
        paddingRight: 10,
        marginBottom: 10,
        borderRadius: radius.xl,
        backgroundColor: colors.surface,
        boxShadow: colors.shadowCard,
      }}
    >
      <Avatar name={member.full_name} size={44} ring={colors.warning} />
      <View style={{ flex: 1, gap: 5 }}>
        <Text
          variant="label"
          numberOfLines={1}
          style={{ fontSize: 16, lineHeight: 21, letterSpacing: -0.1 }}
        >
          {member.full_name}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              paddingHorizontal: 8,
              height: 22,
              justifyContent: "center",
              borderRadius: radius.pill,
              backgroundColor: colors.warningSoft,
            }}
          >
            <Text
              variant="caption"
              numberOfLines={1}
              style={{
                color: colors.warning,
                fontFamily: "Manrope_700Bold",
                fontSize: 12,
                lineHeight: 16,
              }}
            >
              {owed}
            </Text>
          </View>
          <Text
            variant="caption"
            tone="muted"
            numberOfLines={1}
            style={{ flexShrink: 1 }}
          >
            {detail}
          </Text>
        </View>
      </View>
      <Icon name="chevron-forward" size={18} color={colors.textMuted} />
    </PressableScale>
  );
}
