import { useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { ActivityIndicator, View } from "react-native";

import { useTheme } from "@/theme/ThemeProvider";
import type { ApiError } from "@/types";

import { Button } from "./Button";
import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";

function Centered({
  icon,
  title,
  message,
  action,
}: {
  icon: IconName;
  title: string;
  message?: string;
  action?: React.ReactNode;
}) {
  const { colors, spacing } = useTheme();
  return (
    <View
      style={{ alignItems: "center", gap: spacing.md, padding: spacing.xxl }}
    >
      <View
        style={{
          width: 88,
          height: 88,
          borderRadius: 28,
          borderWidth: 1,
          borderColor: colors.border,
          transform: [{ rotate: "-8deg" }],
          backgroundColor: colors.brandSoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name={icon} size={28} color={colors.textMuted} />
      </View>
      <Text variant="heading" style={{ textAlign: "center" }}>
        {title}
      </Text>
      {message ? (
        <Text tone="muted" style={{ textAlign: "center" }}>
          {message}
        </Text>
      ) : null}
      {action}
    </View>
  );
}

export function EmptyState({
  icon = "file-tray-outline",
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon?: IconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <Centered
      icon={icon}
      title={title}
      message={message}
      action={
        actionLabel && onAction ? (
          <Button title={actionLabel} onPress={onAction} fullWidth={false} />
        ) : undefined
      }
    />
  );
}

export function ErrorState({
  error,
  onRetry,
}: {
  error?: ApiError;
  onRetry?: () => void;
}) {
  return (
    <Centered
      icon="cloud-offline-outline"
      title="No pudimos cargar la información"
      message={error?.message ?? "Revisa tu conexión e inténtalo otra vez."}
      action={
        onRetry ? (
          <Button
            title="Reintentar"
            variant="secondary"
            icon="refresh"
            onPress={onRetry}
            fullWidth={false}
          />
        ) : undefined
      }
    />
  );
}

export function LoadingState({ label = "Cargando…" }: { label?: string }) {
  const { colors, spacing } = useTheme();
  return (
    <View
      style={{ alignItems: "center", gap: spacing.md, padding: spacing.xxl }}
      accessibilityLiveRegion="polite"
    >
      <ActivityIndicator color={colors.brand} />
      <Text tone="muted">{label}</Text>
    </View>
  );
}

/** Shimmer respects the system reduced-motion preference. */
export function Skeleton({
  height = 76,
  style,
}: {
  height?: number;
  style?: object;
}) {
  const { colors } = useTheme();
  const reduce = useReducedMotion();
  const x = useSharedValue(-160);
  useEffect(() => {
    if (!reduce)
      x.value = withRepeat(withTiming(420, { duration: 1300 }), -1, false);
    return () => cancelAnimation(x);
  }, [reduce, x]);
  const animated = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));
  return (
    <View
      style={[
        {
          height,
          borderRadius: 20,
          backgroundColor: colors.surfaceAlt,
          overflow: "hidden",
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          { position: "absolute", top: 0, bottom: 0, width: 160 },
          animated,
        ]}
      >
        <LinearGradient
          colors={[colors.surfaceAlt, colors.surface, colors.surfaceAlt]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
}

export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <View style={{ gap: 10, padding: 16 }} accessibilityLabel="Cargando">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} />
      ))}
    </View>
  );
}
