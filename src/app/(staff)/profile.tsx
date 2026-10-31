import { useState } from "react";
import { View } from "react-native";
import {
  Avatar,
  BottomSheet,
  Button,
  FilterChips,
  Screen,
  Text,
} from "@/components/ui";
import { Identity } from "@/components/Identity";
import { useSession } from "@/state/session";
import { useSchemePreference, useTheme } from "@/theme/ThemeProvider";
import type { Scenario } from "@/services";
export default function Profile() {
  const {
    user,
    scenario,
    setScenario,
    pending,
    signOut,
    previewState,
    setPreviewState,
  } = useSession();
  const { preference, setPreference } = useSchemePreference();
  const { colors } = useTheme();
  const [logout, setLogout] = useState(false);
  return (
    <Screen topInset contentContainerStyle={{ padding: 24, gap: 28 }}>
      <Identity />
      <Text variant="display">Tu espacio.</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
        <Avatar name={user?.full_name ?? ""} size={64} />
        <View style={{ flex: 1, gap: 6 }}>
          <Text variant="title">{user?.full_name}</Text>
          <Text tone="muted">
            {user?.role === "admin" ? "Administrador" : "Recepcionista"}
          </Text>
          <Text tone="muted">{user?.phone}</Text>
        </View>
      </View>
      <View style={{ height: 1, backgroundColor: colors.border }} />
      <Text variant="heading">A tu manera</Text>
      <FilterChips
        value={preference}
        onChange={setPreference}
        options={[
          { value: "light", label: "Claro" },
          { value: "dark", label: "Oscuro" },
          { value: "system", label: "Sistema" },
        ]}
      />
      <Button
        title="Cerrar sesión"
        icon="log-out-outline"
        variant="secondary"
        onPress={() => setLogout(true)}
      />
      {__DEV__ && (
        <View
          style={{
            backgroundColor: colors.surfaceAlt,
            padding: 20,
            borderRadius: 24,
            gap: 16,
          }}
        >
          <Text variant="caption" tone="brand">
            LABORATORIO DE DISEÑO
          </Text>
          <Text variant="heading">Una app, distintos gimnasios</Text>
          <Text tone="muted">Cambia el contexto de la maqueta.</Text>
          {(
            [
              {
                id: "single",
                title: "01 · Un gimnasio, una sede",
                detail: "Administrador · escenario inicial",
              },
              {
                id: "branches",
                title: "02 · Un gimnasio, varias sedes",
                detail: "Administrador · selector de sede",
              },
              {
                id: "gyms",
                title: "03 · Varias marcas",
                detail: "Recepcionista · una sede asignada por gym",
              },
            ] as const
          ).map((item) => (
            <View key={item.id} style={{ gap: 5 }}>
              <Button
                title={item.title}
                variant={scenario === item.id ? "primary" : "secondary"}
                disabled={pending}
                icon={
                  scenario === item.id ? "checkmark-circle" : "ellipse-outline"
                }
                onPress={() => void setScenario(item.id as Scenario)}
              />
              <Text variant="caption" tone="muted">
                {item.detail}
              </Text>
            </View>
          ))}
          <Text variant="label">Estados del directorio</Text>
          <FilterChips
            value={previewState}
            onChange={setPreviewState}
            options={[
              { value: "ready", label: "Datos" },
              { value: "empty", label: "Vacío" },
              { value: "error", label: "Error" },
            ]}
          />
          <Text variant="caption" tone="muted">
            La carga con shimmer aparece al buscar o actualizar.
          </Text>
        </View>
      )}
      <Text variant="caption" tone="muted" style={{ textAlign: "center" }}>
        PULSO · HECHO PARA ESTAR CERCA
      </Text>
      <BottomSheet
        visible={logout}
        onClose={() => setLogout(false)}
        title="¿Cerrar esta sesión?"
      >
        <Text tone="muted">Volverás a la pantalla de bienvenida.</Text>
        <Button title="Cerrar sesión" onPress={signOut} />
        <Button
          title="Seguir aquí"
          variant="ghost"
          onPress={() => setLogout(false)}
        />
      </BottomSheet>
    </Screen>
  );
}
