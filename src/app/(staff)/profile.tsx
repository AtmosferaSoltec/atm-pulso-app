import { useState } from "react";
import { View } from "react-native";

import {
  Avatar,
  BottomSheet,
  Button,
  Chips,
  Screen,
  Text,
} from "@/components/ui";
import { formatPhone, ROLE_LABEL } from "@/lib/format";
import type { PreviewState, Scenario } from "@/services";
import { useSession } from "@/state/session";
import { useSchemePreference, useTheme } from "@/theme/ThemeProvider";

export default function Profile() {
  const { user, lab, setLab, pending, signOut, visibility } = useSession();
  const { preference, setPreference } = useSchemePreference();
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
      <View style={{ gap: 6 }}>
        <Text variant="label">Tema</Text>
        <Chips
          value={preference}
          onChange={setPreference}
          options={[
            { value: "system", label: "Automático" },
            { value: "light", label: "Claro" },
            { value: "dark", label: "Oscuro" },
          ]}
        />
      </View>
      <Button
        title="Cerrar sesión"
        icon="log-out-outline"
        variant="secondary"
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
      <BottomSheet
        visible={logout}
        onClose={() => setLogout(false)}
        title="¿Cerrar sesión?"
      >
        <Button title="Cerrar sesión" variant="danger" onPress={signOut} />
      </BottomSheet>
    </Screen>
  );
}
