import { useState } from "react";
import { Linking, Pressable, View } from "react-native";
import { router } from "expo-router";

import {
  Avatar,
  Button,
  Chips,
  ConfirmDialog,
  Icon,
  type IconName,
  Screen,
  Text,
} from "@/components/ui";
import { formatPhone, ROLE_LABEL } from "@/lib/format";
import type { PreviewState, Scenario } from "@/services";
import { useSession } from "@/state/session";
import { appVersion } from "@/lib/version";
import { useTheme } from "@/theme/ThemeProvider";

/** Atmósfera's support line, the same one published on atmosferast.com. */
const SUPPORT_WHATSAPP = "51908069776";
const PRIVACY_URL = "https://atmosferast.com/privacy";

function Row({
  icon,
  label,
  onPress,
  external,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  external?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole={external ? "link" : "button"}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 52,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
      })}
    >
      <Icon name={icon} size={20} color={colors.brand} />
      <Text style={{ flex: 1 }}>{label}</Text>
      <Icon
        name={external ? "open-outline" : "chevron-forward"}
        size={18}
        color={colors.textMuted}
      />
    </Pressable>
  );
}

export default function Profile() {
  const { user, lab, setLab, pending, signOut, visibility } = useSession();
  const { colors, radius } = useTheme();
  const [logout, setLogout] = useState(false);
  if (!user) return null;
  return (
    <Screen contentContainerStyle={{ paddingTop: 4, gap: 20 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Avatar name={user.full_name} size={48} />
        <View style={{ flex: 1 }}>
          <Text variant="heading">{user.full_name}</Text>
          <Text tone="muted">
            {ROLE_LABEL[user.role]}
            {visibility.showGym ? ` · ${user.gym.name}` : ""}
          </Text>
          {user.phone && (
            <Text variant="caption" tone="muted">
              {formatPhone(user.phone)}
            </Text>
          )}
        </View>
      </View>
      <View
        style={{
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: "hidden",
        }}
      >
        <Row
          icon="key-outline"
          label="Cambiar contraseña"
          onPress={() => router.push("/password")}
        />
        <View style={{ height: 1, backgroundColor: colors.border }} />
        <Row
          icon="logo-whatsapp"
          label="Ayuda por WhatsApp"
          external
          onPress={() =>
            void Linking.openURL(
              `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(
                `Hola, necesito ayuda con Pulso (${user.gym.name}).`,
              )}`,
            )
          }
        />
        <View style={{ height: 1, backgroundColor: colors.border }} />
        <Row
          icon="shield-checkmark-outline"
          label="Política de privacidad"
          external
          onPress={() => void Linking.openURL(PRIVACY_URL)}
        />
      </View>
      <Button
        title="Cerrar sesión"
        icon="log-out-outline"
        variant="danger"
        onPress={() => setLogout(true)}
      />
      {__DEV__ && lab && (
        <View
          style={{
            gap: 10,
            padding: 12,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderStyle: "dashed",
            borderColor: colors.border,
          }}
        >
          <Text variant="caption" tone="muted">
            SOLO DESARROLLO · ESCENARIO DE LA MAQUETA
          </Text>
          <Chips<Scenario>
            value={lab?.scenario ?? "single"}
            onChange={(next) => {
              if (!pending) void setLab({ scenario: next });
            }}
            options={[
              { value: "single", label: "1 gym · 1 sede" },
              { value: "branches", label: "1 gym · 2 sedes" },
              { value: "gyms", label: "2 gyms" },
            ]}
          />
          <Chips<PreviewState>
            value={lab?.previewState ?? "ready"}
            onChange={(next) => void setLab({ previewState: next })}
            options={[
              { value: "ready", label: "Con datos" },
              { value: "empty", label: "Vacío" },
              { value: "error", label: "Error" },
            ]}
          />
        </View>
      )}
      <ConfirmDialog
        visible={logout}
        title="¿Cerrar sesión?"
        message="Para volver a entrar necesitarás tu documento y contraseña."
        confirmLabel="Cerrar sesión"
        destructive
        onConfirm={() => {
          setLogout(false);
          void signOut();
        }}
        onCancel={() => setLogout(false)}
      />
      <Text
        variant="caption"
        tone="muted"
        style={{ textAlign: "center" }}
        accessibilityLabel={`Versión ${appVersion()}`}
      >
        Pulso · versión {appVersion()}
      </Text>
    </Screen>
  );
}
