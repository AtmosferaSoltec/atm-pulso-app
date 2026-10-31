import { Linking, Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Avatar,
  Button,
  ErrorState,
  Icon,
  Screen,
  SkeletonList,
  StatusChip,
  Text,
} from "@/components/ui";
import { useMember } from "@/hooks/queries";
import {
  daysLabel,
  formatDate,
  formatMoney,
  formatPhone,
  coverageEnd,
  todayLima,
} from "@/lib/format";
import { services } from "@/services";
import type { MemberDetail as Member, MembershipView } from "@/types";
import { useSession } from "@/state/session";
import { useTheme } from "@/theme/ThemeProvider";

function statusLine(member: Member) {
  if (member.status === "scheduled")
    return `Empieza el ${formatDate(member.starts_on)}`;
  const verb = member.days_remaining < 0 ? "Venció el" : "Hasta el";
  return `${daysLabel(member.days_remaining)} · ${verb} ${formatDate(coverageEnd(member))}`;
}

function SubscriptionRow({
  subscription,
  memberId,
  current,
}: {
  subscription: MembershipView;
  memberId: string;
  current: boolean;
}) {
  const { colors } = useTheme();
  const { plans } = useSession();
  // Only a period that has not ended can be corrected.
  const editable =
    services.capabilities.updatePeriod && subscription.ends_on >= todayLima();
  const details = [
    `${formatDate(subscription.starts_on)} – ${formatDate(subscription.ends_on)}`,
    subscription.receipt?.number ?? null,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${editable ? "Modificar suscripción" : "Suscripción"} de ${subscription.plan_label}, ${details}`}
      disabled={!editable}
      onPress={() =>
        router.push({
          pathname: "/members/[id]/subscription",
          params: {
            id: memberId,
            mode: "edit",
            subscriptionId: subscription.id,
          },
        })
      }
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
      <View style={{ flex: 1, gap: 1 }}>
        <Text variant="label" style={{ fontSize: 15 }}>
          {plans.length > 1 ? `${subscription.plan_name} · ` : ""}
          {subscription.plan_label} · {formatMoney(subscription.amount)}
          {current ? (
            <Text variant="caption" tone="brand">
              {"  "}Actual
            </Text>
          ) : null}
        </Text>
        <Text variant="caption" tone="muted" numberOfLines={2}>
          {details}
        </Text>
      </View>
      {editable && (
        <Icon name="create-outline" size={18} color={colors.textMuted} />
      )}
    </Pressable>
  );
}

export default function MemberDetail() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const result = useMember(id);
  const { colors } = useTheme();
  const { visibility } = useSession();
  const today = todayLima();
  if (result.loading)
    return (
      <Screen>
        <SkeletonList rows={4} />
      </Screen>
    );
  if (result.error || !result.data)
    return (
      <Screen>
        <ErrorState error={result.error} onRetry={result.refetch} />
      </Screen>
    );
  const member = result.data;
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Screen
        onRefresh={result.refetch}
        refreshing={false}
        contentContainerStyle={{ paddingTop: 4, gap: 20 }}
      >
        <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
          <Avatar name={member.full_name} size={48} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="title">{member.full_name}</Text>
            <Text tone="muted">
              {member.document_type.toUpperCase()} {member.document_number} ·{" "}
              {formatPhone(member.phone)}
            </Text>
          </View>
        </View>
        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <StatusChip status={member.status} />
            <Text variant="label" style={{ flex: 1 }}>
              {statusLine(member)}
            </Text>
          </View>
          {visibility.showBranch && (
            <Text variant="caption" tone="muted">
              Sede {member.home_branch.name}
            </Text>
          )}
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Button
            title="Llamar"
            icon="call-outline"
            variant="secondary"
            fullWidth={false}
            style={{ flex: 1 }}
            onPress={() => void Linking.openURL(`tel:${member.phone}`)}
          />
          <Button
            title="WhatsApp"
            icon="logo-whatsapp"
            variant="secondary"
            fullWidth={false}
            style={{ flex: 1 }}
            onPress={() =>
              void Linking.openURL(`https://wa.me/51${member.phone}`)
            }
          />
        </View>
        <View>
          <Text variant="caption" tone="muted" style={{ marginBottom: 2 }}>
            SUSCRIPCIONES
          </Text>
          {member.memberships.map((subscription) => (
            <SubscriptionRow
              key={subscription.id}
              subscription={subscription}
              memberId={id}
              current={
                subscription.starts_on <= today && today <= subscription.ends_on
              }
            />
          ))}
        </View>
      </Screen>
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 12),
          borderTopWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.background,
        }}
      >
        <Button
          title="Renovar"
          icon="refresh"
          onPress={() =>
            router.push({
              pathname: "/members/[id]/subscription",
              params: { id, mode: "renew" },
            })
          }
        />
      </View>
    </View>
  );
}
