import { router } from "expo-router";
import { useState } from "react";
import { Keyboard } from "react-native";

import { Button, Input, Screen, Text } from "@/components/ui";
import { useSession } from "@/state/session";

/** Change the signed-in person's password. atm-auth-api closes every session, so we sign in again here. */
export default function ChangePassword() {
  const { user, changePassword, signIn } = useSession();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [done, setDone] = useState(false);
  if (!user) return null;
  const document = user.document_number;

  const nextError = !attempted
    ? undefined
    : next.length < 8
      ? "Mínimo 8 caracteres."
      : next === document || next === current
        ? "Debe ser distinta de tu documento y de la actual."
        : undefined;
  const valid =
    current.length > 0 &&
    next.length >= 8 &&
    next !== document &&
    next !== current &&
    next === repeat;

  async function submit() {
    setAttempted(true);
    if (!valid || saving) return;
    Keyboard.dismiss();
    setSaving(true);
    setError(undefined);
    try {
      await changePassword(document, current, next);
      await signIn(document, next);
      setDone(true);
    } catch (e) {
      setError(
        (e as { message?: string })?.message ??
          "No se pudo cambiar la contraseña.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (done)
    return (
      <Screen contentContainerStyle={{ paddingTop: 4, gap: 16 }}>
        <Text variant="heading">Contraseña actualizada</Text>
        <Text tone="muted">
          Úsala la próxima vez que entres. Las demás sesiones abiertas se
          cerraron.
        </Text>
        <Button title="Listo" onPress={() => router.back()} />
      </Screen>
    );

  return (
    <Screen contentContainerStyle={{ paddingTop: 4, gap: 16 }}>
      <Input
        label="Contraseña actual"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
        value={current}
        onChangeText={setCurrent}
        error={attempted && !current ? "Escribe tu contraseña actual." : undefined}
      />
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
        label="Repite la contraseña nueva"
        secureTextEntry
        autoCapitalize="none"
        value={repeat}
        onChangeText={setRepeat}
        onSubmitEditing={submit}
        error={attempted && repeat !== next ? "No coinciden." : undefined}
      />
      {error ? (
        <Text tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      <Button title="Cambiar contraseña" loading={saving} onPress={submit} />
    </Screen>
  );
}
