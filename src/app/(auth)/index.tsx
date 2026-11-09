import { useState } from "react";
import { View } from "react-native";

import { Button, Icon, Input, Screen, Text } from "@/components/ui";
import { services } from "@/services";
import { useSession } from "@/state/session";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * What the document field keeps: letters and digits in upper case (a DNI, a CE or a passport; the type is not
 * asked). atm-auth-api also ignores spaces, dashes and case.
 */
function cleanDocument(value: string): string {
  return value.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 12);
}

/**
 * Document + password against atm-auth-api. If the first password must be replaced, the same screen asks for a
 * new one.
 */
export default function Login() {
  const { signIn, changePassword, pending, notice } = useSession();
  const { colors, radius } = useTheme();
  const [documentNumber, setDocumentNumber] = useState("");
  const [password, setPassword] = useState("");
  const [changing, setChanging] = useState(false);
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [attempted, setAttempted] = useState(false);

  const validNext =
    next.length >= 8 &&
    next !== documentNumber &&
    next !== password &&
    next === repeat;
  const nextError = !attempted
    ? undefined
    : next.length < 8
      ? "Mínimo 8 caracteres."
      : next === documentNumber || next === password
        ? "Debe ser distinta de tu documento y de la actual."
        : undefined;

  async function submit() {
    setError(undefined);
    try {
      if (changing) {
        setAttempted(true);
        if (!validNext) return;
        await changePassword(documentNumber, password, next);
        setPassword(next);
        await signIn(documentNumber, next);
        return;
      }
      await signIn(documentNumber, password);
    } catch (e) {
      const code = (e as { code?: string })?.code;
      if (code === "PASSWORD_CHANGE_REQUIRED") {
        setChanging(true);
        return;
      }
      setError((e as { message?: string })?.message ?? "No se pudo entrar.");
    }
  }

  return (
    <Screen
      topInset
      scroll={false}
      contentContainerStyle={{ justifyContent: "center" }}
    >
      <View style={{ flex: 1, justifyContent: "center", gap: 12 }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: radius.lg,
            backgroundColor: colors.brand,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="pulse" size={26} color={colors.onBrand} />
        </View>
        <Text variant="title">Pulso</Text>
        {changing ? (
          <Text tone="muted">
            Es tu primer ingreso: crea una contraseña nueva para continuar.
          </Text>
        ) : (
          <Text tone="muted">Miembros y suscripciones de tu gimnasio.</Text>
        )}
        <View style={{ gap: 12, marginTop: 8 }}>
          {!changing && (
            <>
              <Input
                label="Documento"
                placeholder="Ingresa tu documento"
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={12}
                autoComplete="username"
                value={documentNumber}
                onChangeText={(v) => setDocumentNumber(cleanDocument(v))}
              />
              <Input
                label="Contraseña"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="current-password"
                value={password}
                onChangeText={setPassword}
                onSubmitEditing={submit}
              />
            </>
          )}
          {changing && (
            <>
              <Input
                label="Contraseña nueva"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                value={next}
                onChangeText={setNext}
                error={nextError}
              />
              <Input
                label="Repite la contraseña"
                secureTextEntry
                autoCapitalize="none"
                value={repeat}
                onChangeText={setRepeat}
                error={
                  attempted && repeat !== next ? "No coinciden." : undefined
                }
                onSubmitEditing={submit}
              />
            </>
          )}
        </View>
      </View>
      <View style={{ gap: 8, paddingBottom: 16 }}>
        {(error || notice) && (
          <Text tone="danger" accessibilityLiveRegion="polite">
            {error ?? notice}
          </Text>
        )}
        <Button
          title={changing ? "Guardar y entrar" : "Entrar"}
          loading={pending}
          disabled={
            !changing && (documentNumber.length < 6 || password.length === 0)
          }
          onPress={submit}
        />
        <Text variant="caption" tone="muted" style={{ textAlign: "center" }}>
          Solo personal del gimnasio
          {services.mode === "mock" ? " · modo demostración (datos de prueba)" : ""}
        </Text>
      </View>
    </Screen>
  );
}
