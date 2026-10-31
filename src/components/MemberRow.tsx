import { Pressable, View } from "react-native";
import { router } from "expo-router";

import { daysLabel, formatDate } from "@/lib/format";
import { useTheme } from "@/theme/ThemeProvider";
import type { MemberView } from "@/types";

import { Avatar, StatusChip, Text } from "./ui";

/** Compact 60 px row: who, document, when it ends, status. */
export function MemberRow({ member }: { member: MemberView }) {
  const { colors } = useTheme();
  const when =
    member.status === "scheduled"
      ? `Empieza ${formatDate(member.starts_on)}`
      : daysLabel(member.days_remaining);
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
          {member.document_type.toUpperCase()} {member.document_number} · {when}
        </Text>
      </View>
      <StatusChip status={member.status} />
    </Pressable>
  );
}
