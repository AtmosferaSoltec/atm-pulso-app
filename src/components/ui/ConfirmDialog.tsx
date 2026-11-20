import { Modal, Pressable, View } from "react-native";

import { useTheme } from "@/theme/ThemeProvider";

import { Button } from "./Button";
import { Text } from "./Text";

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  /** Paints the confirm button red: for actions that end something (log out, delete). */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** A centered yes/no question. For choices with more content use BottomSheet. */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  destructive,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { colors, radius } = useTheme();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View
        style={{ flex: 1, justifyContent: "center", padding: 24 }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancelar"
          onPress={onCancel}
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: colors.overlay,
          }}
        />
        <View
          accessibilityViewIsModal
          accessibilityRole="alert"
          style={{
            alignSelf: "center",
            width: "100%",
            maxWidth: 360,
            gap: 8,
            padding: 20,
            borderRadius: radius.lg,
            backgroundColor: colors.surface,
          }}
        >
          <Text variant="heading">{title}</Text>
          {message ? <Text tone="muted">{message}</Text> : null}
          <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
            <Button
              title="Cancelar"
              variant="secondary"
              fullWidth={false}
              style={{ flex: 1 }}
              onPress={onCancel}
            />
            <Button
              title={confirmLabel}
              variant={destructive ? "danger" : "primary"}
              fullWidth={false}
              style={{ flex: 1 }}
              onPress={onConfirm}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
