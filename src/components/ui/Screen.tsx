import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  View,
  type ScrollViewProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/theme/ThemeProvider";

export interface ScreenProps extends Omit<ScrollViewProps, "children"> {
  children: ReactNode;
  /** Leave top inset to the navigation header (default true when a header is shown). */
  topInset?: boolean;
  padded?: boolean;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function Screen({
  children,
  topInset = false,
  padded = true,
  scroll = true,
  refreshing,
  onRefresh,
  contentContainerStyle,
  ...rest
}: ScreenProps) {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const pad = {
    padding: padded ? spacing.lg : 0,
    paddingTop: (topInset ? insets.top : 0) + (padded ? spacing.lg : 0),
    gap: spacing.lg,
  };
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={!!refreshing}
                onRefresh={onRefresh}
                tintColor={colors.brand}
              />
            ) : undefined
          }
          contentContainerStyle={[
            pad,
            { paddingBottom: insets.bottom + spacing.xl },
            contentContainerStyle,
          ]}
          {...rest}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, pad]}>{children}</View>
      )}
    </KeyboardAvoidingView>
  );
}
