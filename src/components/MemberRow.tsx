import { Pressable, View } from "react-native";
import { router } from "expo-router";

import { daysLabel, formatDate } from "@/lib/format";
import { useTheme } from "@/theme/ThemeProvider";
import type { MemberView } from "@/types";

import { Avatar, Text } from "./ui";

/**
 * Compact 60 px row: who, when it ends, document. The status is the phrase itself («Vence en 3 días»); it is
 * coloured only when it asks for attention, so a long name never loses room to a chip.
 */
export function MemberRow({ member }: { member: MemberView }) {
  const { colors } = useTheme();
  const when =
    member.status === "scheduled"
      ? `Empieza ${formatDate(member.starts_on)}`
      : daysLabel(member.days_remaining);
  const tint = {
    active: colors.textMuted,
    expiring: colors.warning,
    expired: colors.danger,
    scheduled: colors.info,
  }[member.status];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${member.full_name}, ${when}`}
      onPress={() => router.push(`/members/${member.id}`)}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        minHeight: 60,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderColor: colors.border,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Avatar name={member.full_name} size={40} />
      <View style={{ flex: 1, gap: 1 }}>
        <Text variant="label" numberOfLines={1} style={{ fontSize: 15 }}>
          {member.full_name}
        </Text>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          <Text
            variant="caption"
            style={{
              color: tint,
              fontFamily:
                member.status === "active" ? undefined : "Manrope_700Bold",
            }}
          >
            {when}
          </Text>
          {` · ${member.document_type.toUpperCase()} ${member.document_number}`}
        </Text>
      </View>
    </Pressable>
  );
}
