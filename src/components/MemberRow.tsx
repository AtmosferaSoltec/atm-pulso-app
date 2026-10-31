import { Pressable, View } from "react-native";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Avatar, Icon, Text, StatusChip } from "./ui";
import type { MemberView } from "@/types";
import { useTheme } from "@/theme/ThemeProvider";
import { daysLabel } from "@/lib/format";
export function MemberRow({
  member,
  index = 0,
}: {
  member: MemberView;
  index?: number;
}) {
  const { colors } = useTheme();
  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 5) * 45).duration(260)}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Ver ficha de ${member.full_name}`}
        onPress={() => router.push(`/members/${member.id}`)}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingVertical: 18,
          borderBottomWidth: 1,
          borderColor: colors.border,
          opacity: pressed ? 0.65 : 1,
        })}
      >
        <Avatar name={member.full_name} size={48} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text variant="label">{member.full_name}</Text>
          <Text variant="caption" tone="muted">
            {member.document_type.toUpperCase()} {member.document_number}
          </Text>
          <Text variant="caption" tone="muted">
            {member.status === "scheduled"
              ? "Inicio programado"
              : daysLabel(member.days_remaining)}
          </Text>
        </View>
        <View style={{ gap: 8, alignItems: "flex-end" }}>
          <StatusChip status={member.status} />
          <Icon name="arrow-forward" size={17} color={colors.textMuted} />
        </View>
      </Pressable>
    </Animated.View>
  );
}
