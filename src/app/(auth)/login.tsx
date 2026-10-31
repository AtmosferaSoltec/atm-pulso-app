import { useState } from "react";
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Button, Icon, Screen, Text } from "@/components/ui";
import { Identity } from "@/components/Identity";
import { useSession } from "@/state/session";
import { useTheme } from "@/theme/ThemeProvider";
export default function Login() {
  const { signIn, pending } = useSession();
  const { colors } = useTheme();
  const [error, setError] = useState(false);
  return (
    <Screen
      topInset
      contentContainerStyle={{ padding: 28, flexGrow: 1, gap: 28 }}
    >
      <Identity />
      <LinearGradient
        colors={[colors.brandSoft, colors.background]}
        style={{
          minHeight: 260,
          borderRadius: 120,
          alignItems: "center",
          justifyContent: "center",
          marginTop: 24,
        }}
      >
        <View
          style={{
            width: 170,
            height: 170,
            borderRadius: 85,
            borderWidth: 1,
            borderColor: colors.brand,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              width: 116,
              height: 116,
              borderRadius: 40,
              backgroundColor: colors.brand,
              alignItems: "center",
              justifyContent: "center",
              transform: [{ rotate: "-12deg" }],
            }}
          >
            <Icon name="pulse-outline" size={64} color={colors.onBrand} />
          </View>
        </View>
      </LinearGradient>
      <Text variant="caption" tone="brand">
        MENOS DISTANCIA. MÁS COMUNIDAD.
      </Text>
      <Text variant="display" style={{ fontSize: 42, lineHeight: 50 }}>
        El pulso de tu gimnasio, contigo.
      </Text>
      <Text tone="muted">
        Cada nombre tiene una historia. Encuéntrala, acompáñala y ayúdala a
        continuar.
      </Text>
      <View style={{ flex: 1, minHeight: 12 }} />
      {error && (
        <Text tone="danger">
          No pudimos abrir la maqueta. Inténtalo otra vez.
        </Text>
      )}
      <Button
        title={error ? "Reintentar" : "Explorar maqueta"}
        size="lg"
        icon="arrow-forward"
        loading={pending}
        onPress={async () => {
          try {
            setError(false);
            await signIn();
          } catch {
            setError(true);
          }
        }}
      />
      <Text variant="caption" tone="muted" style={{ textAlign: "center" }}>
        Solo personal del gimnasio · Vista de diseño
      </Text>
    </Screen>
  );
}
