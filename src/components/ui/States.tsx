import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "@/theme/ThemeProvider";
import type { ApiError } from "@/types";

import { Button } from "./Button";
import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";

/** Compact message block: small icon, one line of title, one of help. */
function Message({
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
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: "center", gap: 6, paddingVertical: 32 }}>
      <Icon name={icon} size={24} color={colors.textMuted} />
      <Text variant="heading" style={{ textAlign: "center" }}>
        {title}
      </Text>
      {message ? (
        <Text tone="muted" style={{ textAlign: "center" }}>
          {message}
        </Text>
      ) : null}
      {action ? <View style={{ marginTop: 8 }}>{action}</View> : null}
    </View>
  );
}

export function EmptyState({
  icon = "search-outline",
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
    <Message
      icon={icon}
      title={title}
      message={message}
      action={
        actionLabel && onAction ? (
          <Button
            title={actionLabel}
            variant="secondary"
            onPress={onAction}
            fullWidth={false}
          />
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
    <Message
      icon="cloud-offline-outline"
      title="No se pudo cargar"
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

/** Placeholder rows shaped like the real list rows; a soft pulse, none with reduced motion. */
export function SkeletonList({ rows = 6 }: { rows?: number }) {
  const { colors } = useTheme();
  const reduce = useReducedMotion();
  const opacity = useSharedValue(1);
  useEffect(() => {
    if (!reduce)
      opacity.set(withRepeat(withTiming(0.45, { duration: 700 }), -1, true));
    return () => cancelAnimation(opacity);
  }, [reduce, opacity]);
  const pulse = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  const bar = (width: number | `${number}%`, height: number) => (
    <View
      style={{
        width,
        height,
        borderRadius: 4,
        backgroundColor: colors.surfaceAlt,
      }}
    />
  );
  return (
    <Animated.View style={pulse} accessibilityLabel="Cargando">
      {Array.from({ length: rows }, (_, i) => (
        <View
          key={i}
          style={{
            height: 60,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.surfaceAlt,
            }}
          />
          <View style={{ flex: 1, gap: 6 }}>
            {bar("55%", 12)}
            {bar("35%", 10)}
          </View>
        </View>
      ))}
    </Animated.View>
  );
}
