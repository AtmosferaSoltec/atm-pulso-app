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

import { mix } from "@/theme/color";
import { useTheme } from "@/theme/ThemeProvider";
import type { ApiError } from "@/types";

import { Button } from "./Button";
import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";

/** Message block: the icon in a soft brand disc, one line of title, one of help. */
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
    <View
      style={{
        alignItems: "center",
        gap: 6,
        paddingVertical: 36,
        paddingHorizontal: 24,
      }}
    >
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          marginBottom: 10,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.brandSoft,
          borderWidth: 6,
          borderColor: mix(colors.brand, colors.background, 0.05),
        }}
      >
        <Icon name={icon} size={26} color={colors.brand} />
      </View>
      <Text variant="heading" style={{ textAlign: "center", fontSize: 17 }}>
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

/**
 * Placeholders shaped like the real content: `rows` (plain list rows) or `cards` (the home's member cards).
 * A soft pulse, none with reduced motion.
 */
export function SkeletonList({
  rows = 6,
  variant = "rows",
}: {
  rows?: number;
  variant?: "rows" | "cards";
}) {
  const { colors, radius } = useTheme();
  const reduce = useReducedMotion();
  const opacity = useSharedValue(1);
  useEffect(() => {
    if (!reduce)
      opacity.set(withRepeat(withTiming(0.45, { duration: 700 }), -1, true));
    return () => cancelAnimation(opacity);
  }, [reduce, opacity]);
  const pulse = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  const cards = variant === "cards";
  const bar = (width: number | `${number}%`, height: number) => (
    <View
      style={{
        width,
        height,
        borderRadius: height / 2,
        backgroundColor: colors.surfaceAlt,
      }}
    />
  );
  return (
    <Animated.View style={pulse} accessibilityLabel="Cargando">
      {Array.from({ length: rows }, (_, i) => (
        <View
          key={i}
          style={
            cards
              ? {
                  height: 76,
                  marginBottom: 10,
                  paddingHorizontal: 14,
                  borderRadius: radius.xl,
                  backgroundColor: colors.surface,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }
              : {
                  height: 60,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }
          }
        >
          <View
            style={{
              width: cards ? 48 : 40,
              height: cards ? 48 : 40,
              borderRadius: 24,
              backgroundColor: colors.surfaceAlt,
            }}
          />
          <View style={{ flex: 1, gap: 8 }}>
            {bar(i % 2 ? "62%" : "50%", 12)}
            {bar(i % 3 ? "36%" : "44%", 10)}
          </View>
        </View>
      ))}
    </Animated.View>
  );
}
