import { useEffect, type ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import { Text } from "./Text";
import { Button } from "./Button";
export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}
export function BottomSheet({
  visible,
  onClose,
  title,
  children,
}: BottomSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const offset = useSharedValue(0);
  useEffect(() => {
    if (visible) offset.set(0);
  }, [visible, offset]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.get() }],
  }));
  const pan = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => g.dy > 6,
    onPanResponderMove: (_, g) => {
      offset.set(Math.max(0, g.dy));
    },
    onPanResponderRelease: (_, g) => {
      if (g.dy > 90 || g.vy > 0.7) onClose();
      else offset.set(withSpring(0));
    },
    onPanResponderTerminate: () => {
      offset.set(withSpring(0));
    },
  });
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, justifyContent: "flex-end" }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar hoja"
          onPress={onClose}
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: colors.overlay,
          }}
        />
        <Animated.View
          accessibilityViewIsModal
          style={[
            {
              backgroundColor: colors.surface,
              boxShadow: "0px -8px 32px rgba(0,0,0,0.12)",
              borderTopLeftRadius: 30,
              borderTopRightRadius: 30,
              paddingBottom: insets.bottom + 16,
              maxHeight: "88%",
            },
            style,
          ]}
        >
          <View
            {...pan.panHandlers}
            style={{
              height: 44,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                width: 44,
                height: 4,
                borderRadius: 3,
                backgroundColor: colors.border,
              }}
            />
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 20,
              gap: 8,
            }}
          >
            <Text variant="title" style={{ flex: 1 }}>
              {title}
            </Text>
            <Button
              title="Cerrar"
              accessibilityLabel="Cerrar hoja"
              variant="ghost"
              fullWidth={false}
              onPress={onClose}
            />
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 24, gap: 16 }}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
