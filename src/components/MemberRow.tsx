import { View } from "react-native";
import { router } from "expo-router";

import { daysLabel, formatDate } from "@/lib/format";
import { useTheme } from "@/theme/ThemeProvider";
import type { MemberView } from "@/types";

import { Avatar, Icon, PressableScale, Text } from "./ui";

/**
 * A member as a small card: who, when it ends, document. The status is the phrase itself («Vence en 3 días»).
 * When it asks for attention it becomes a soft coloured pill and the avatar gets a ring of the same colour
 * (por vencer ámbar, vencido rojo, programado azul); an active member stays calm. The name keeps the whole
 * first line, so a long name never loses room to the status.
 */
export function MemberRow({ member }: { member: MemberView }) {
  const { colors, radius } = useTheme();
  const when =
    member.status === "scheduled"
      ? `Empieza ${formatDate(member.starts_on)}`
      : daysLabel(member.days_remaining);
  const tone = {
    active: null,
    expiring: { fg: colors.warning, bg: colors.warningSoft },
    expired: { fg: colors.danger, bg: colors.dangerSoft },
    scheduled: { fg: colors.info, bg: colors.infoSoft },
  }[member.status];
  const doc = `${member.document_type.toUpperCase()} ${member.document_number}`;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${member.full_name}, ${when}`}
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
      <Avatar
        name={member.full_name}
        size={44}
        ring={tone ? tone.fg : "transparent"}
      />
      <View style={{ flex: 1, gap: 5 }}>
        <Text
          variant="label"
          numberOfLines={1}
          style={{ fontSize: 16, lineHeight: 21, letterSpacing: -0.1 }}
        >
          {member.full_name}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {tone ? (
            <>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                  paddingHorizontal: 8,
                  height: 22,
                  borderRadius: radius.pill,
                  backgroundColor: tone.bg,
                }}
              >
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: tone.fg,
                  }}
                />
                <Text
                  variant="caption"
                  numberOfLines={1}
                  style={{
                    color: tone.fg,
                    fontFamily: "Manrope_700Bold",
                    fontSize: 12,
                    lineHeight: 16,
                  }}
                >
                  {when}
                </Text>
              </View>
              <Text
                variant="caption"
                tone="muted"
                numberOfLines={1}
                style={{ flexShrink: 1 }}
              >
                {doc}
              </Text>
            </>
          ) : (
            <Text
              variant="caption"
              tone="muted"
              numberOfLines={1}
              style={{ flexShrink: 1 }}
            >
              {`${when} · ${doc}`}
            </Text>
          )}
        </View>
      </View>
      <Icon name="chevron-forward" size={18} color={colors.textMuted} />
    </PressableScale>
  );
}
