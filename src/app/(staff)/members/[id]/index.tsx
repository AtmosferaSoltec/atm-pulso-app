import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { LinearTransition } from "react-native-reanimated";
import {
  Avatar,
  BottomSheet,
  Button,
  ErrorState,
  Icon,
  Screen,
  SkeletonList,
  StatusChip,
  Text,
} from "@/components/ui";
import { Identity } from "@/components/Identity";
import { useMember } from "@/hooks/queries";
import { useSession } from "@/state/session";
import { useTheme } from "@/theme/ThemeProvider";
import { formatDate, formatMoney, METHOD_LABEL, todayLima } from "@/lib/format";
import type { Subscription } from "@/services";
function TimelineItem({
  subscription,
  memberId,
  first,
}: {
  subscription: Subscription;
  memberId: string;
  first: boolean;
}) {
  const { colors } = useTheme();
  const { visibility } = useSession();
  const [expanded, setExpanded] = useState(first);
  return (
    <Animated.View
      layout={LinearTransition.duration(220)}
      style={{
        borderLeftWidth: 2,
        borderColor: colors.border,
        paddingLeft: 22,
        paddingBottom: 24,
        marginLeft: 7,
      }}
    >
      <View
        style={{
          position: "absolute",
          left: -7,
          top: 16,
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: first ? colors.brand : colors.border,
          borderWidth: 2,
          borderColor: colors.background,
        }}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded(!expanded)}
        style={{
          minHeight: 52,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <View style={{ flex: 1, gap: 5 }}>
          <Text variant="heading">{subscription.plan_label}</Text>
          <Text variant="caption" tone="muted">
            {formatDate(subscription.starts_on)} →{" "}
            {formatDate(subscription.ends_on)}
          </Text>
        </View>
        <Icon name={expanded ? "chevron-up" : "chevron-down"} size={18} />
      </Pressable>
      {expanded && (
        <View style={{ gap: 12, paddingTop: 12 }}>
          <Text variant="title">{formatMoney(subscription.amount)}</Text>
          <Text tone="muted">{METHOD_LABEL[subscription.method]}</Text>
          {visibility.hasMultipleBranches && (
            <Text tone="muted">
              Sede de cobro · {subscription.collection_branch.name}
            </Text>
          )}
          <Button
            title="Modificar suscripción"
            icon="create-outline"
            variant="ghost"
            onPress={() =>
              router.push({
                pathname: "/members/[id]/renew",
                params: {
                  id: memberId,
                  mode: "edit",
                  subscriptionId: subscription.id,
                },
              })
            }
          />
        </View>
      )}
    </Animated.View>
  );
}
export default function MemberDetail() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const result = useMember(id);
  const { colors } = useTheme();
  const { visibility } = useSession();
  const [contact, setContact] = useState(false);
  if (result.loading)
    return (
      <Screen>
        <SkeletonList />
      </Screen>
    );
  if (result.error || !result.data)
    return (
      <Screen>
        <ErrorState error={result.error} onRetry={result.refetch} />
      </Screen>
    );
  const member = result.data;
  const start = Date.parse(member.starts_on);
  const end = Date.parse(member.ends_on);
  const progress = Math.max(
    0,
    Math.min(1, (Date.parse(todayLima()) - start) / (end - start)),
  );
  const ring = {
    active: colors.success,
    expiring: colors.warning,
    expired: colors.danger,
    scheduled: colors.info,
  }[member.status];
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Screen
        onRefresh={result.refetch}
        refreshing={result.loading}
        contentContainerStyle={{ padding: 24, gap: 26 }}
      >
        <Identity compact />
        <View style={{ alignItems: "center", gap: 12, paddingTop: 8 }}>
          <View
            style={{
              padding: 5,
              borderRadius: 60,
              borderWidth: 2,
              borderColor: ring,
            }}
          >
            <Avatar name={member.full_name} size={80} />
          </View>
          <Text
            variant="display"
            style={{ textAlign: "center", fontSize: 29, lineHeight: 37 }}
          >
            {member.full_name}
          </Text>
          <View>
            <StatusChip status={member.status} />
          </View>
          <Text tone="muted">
            {member.document_type.toUpperCase()} {member.document_number} ·{" "}
            {member.phone}
          </Text>
          {visibility.hasMultipleBranches && (
            <Text tone="muted">Inscripción · {member.home_branch.name}</Text>
          )}
        </View>
        <LinearGradient
          colors={[colors.brandSoft, colors.surface]}
          style={{
            padding: 24,
            borderRadius: 28,
            boxShadow: "0px 6px 20px rgba(0,0,0,0.04)",
            gap: 14,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text variant="caption" tone="brand">
            {member.status === "scheduled"
              ? "PRÓXIMA SUSCRIPCIÓN"
              : "SU TIEMPO EN MOVIMIENTO"}
          </Text>
          <View
            style={{ flexDirection: "row", alignItems: "baseline", gap: 12 }}
          >
            <Text
              style={{
                fontFamily: "Manrope_700Bold",
                fontSize: 72,
                lineHeight: 86,
                letterSpacing: -4,
                color: colors.onBrandSoft,
              }}
            >
              {member.status === "scheduled"
                ? "→"
                : Math.abs(member.days_remaining)}
            </Text>
            <Text tone="muted" style={{ flex: 1 }}>
              {member.status === "expired"
                ? "días desde el vencimiento"
                : member.status === "scheduled"
                  ? "Inicio " + formatDate(member.starts_on)
                  : "días restantes"}
            </Text>
          </View>
          <View
            accessibilityRole="progressbar"
            accessibilityValue={{
              min: 0,
              max: 100,
              now: Math.round(progress * 100),
            }}
            style={{
              height: 6,
              borderRadius: 6,
              backgroundColor: colors.border,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: 6,
                width: `${progress * 100}%`,
                backgroundColor: colors.brand,
                borderRadius: 6,
              }}
            />
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <Text variant="caption" tone="muted">
              {formatDate(member.starts_on)}
            </Text>
            <Text variant="caption" tone="muted">
              {formatDate(member.ends_on)}
            </Text>
          </View>
        </LinearGradient>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Button
            title="Llamar"
            icon="call-outline"
            variant="secondary"
            style={{ flex: 1 }}
            onPress={() => setContact(true)}
          />
          <Button
            title="WhatsApp"
            icon="logo-whatsapp"
            variant="secondary"
            style={{ flex: 1 }}
            onPress={() => setContact(true)}
          />
        </View>
        <View>
          <Text variant="title" style={{ marginBottom: 18 }}>
            Su historia, mes a mes
          </Text>
          {member.memberships.map((subscription, index) => (
            <TimelineItem
              key={subscription.id}
              subscription={subscription}
              memberId={id}
              first={index === 0}
            />
          ))}
        </View>
      </Screen>
      <View
        style={{
          padding: 20,
          paddingBottom: Math.max(insets.bottom, 20),
          gap: 4,
          borderTopWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        }}
      >
        <Button
          title="Renovar suscripción"
          icon="refresh-outline"
          size="lg"
          onPress={() =>
            router.push({
              pathname: "/members/[id]/renew",
              params: { id, mode: "renew" },
            })
          }
        />
        <Button
          title="Nueva suscripción"
          icon="add"
          variant="ghost"
          onPress={() =>
            router.push({
              pathname: "/members/[id]/renew",
              params: { id, mode: "new" },
            })
          }
        />
      </View>
      <BottomSheet
        visible={contact}
        onClose={() => setContact(false)}
        title="Contacto del miembro"
      >
        <Text>{member.full_name}</Text>
        <Text variant="title">{member.phone}</Text>
        <Text tone="muted">
          Vista de diseño. No se iniciará una llamada ni se enviará un mensaje.
        </Text>
        <Button title="Entendido" onPress={() => setContact(false)} />
      </BottomSheet>
    </View>
  );
}
