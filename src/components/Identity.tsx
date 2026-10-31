import { useState } from "react";
import { Image, View } from "react-native";
import { useSession } from "@/state/session";
import { useTheme } from "@/theme/ThemeProvider";
import { initials } from "@/lib/format";
import { BottomSheet, Button, Text } from "./ui";
export function Identity({ compact = false }: { compact?: boolean }) {
  const {
    user,
    visibility,
    activeBranch,
    availableGyms,
    setActiveBranch,
    switchGym,
    pending,
  } = useSession();
  const { colors } = useTheme();
  const [picker, setPicker] = useState<"gym" | "branch" | null>(null);
  const name = user?.gym.name ?? "Atlas Fitness";
  return (
    <>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 15,
            backgroundColor: colors.brand,
            alignItems: "center",
            justifyContent: "center",
            transform: [{ rotate: "-5deg" }],
          }}
        >
          {user?.gym.logo_url ? (
            <Image
              source={{ uri: user.gym.logo_url }}
              style={{ width: 36, height: 36, borderRadius: 12 }}
            />
          ) : (
            <Text variant="heading" style={{ color: colors.onBrand }}>
              {initials(name)}
            </Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="heading">{name}</Text>
          {!compact && (
            <Text variant="caption" tone="muted">
              TU COMUNIDAD, MÁS CERCA
            </Text>
          )}
        </View>
        {visibility.hasMultipleGyms && (
          <Button
            title="Cambiar"
            accessibilityLabel="Cambiar gimnasio"
            variant="ghost"
            fullWidth={false}
            onPress={() => setPicker("gym")}
          />
        )}
        {visibility.canSelectBranch && (
          <Button
            title={activeBranch?.name ?? "Elegir sede"}
            icon="location-outline"
            variant="secondary"
            onPress={() => setPicker("branch")}
          />
        )}
      </View>
      <BottomSheet
        visible={picker !== null}
        onClose={() => setPicker(null)}
        title={picker === "gym" ? "Tu gimnasio" : "Sede activa"}
      >
        {picker === "gym"
          ? availableGyms.map((g) => (
              <Button
                key={g.id}
                title={g.name}
                icon={
                  g.id === user?.gym.id ? "checkmark-circle" : "ellipse-outline"
                }
                variant="secondary"
                disabled={pending}
                onPress={async () => {
                  await switchGym(g.id);
                  setPicker(null);
                }}
              />
            ))
          : user?.branches.map((b) => (
              <Button
                key={b.id}
                title={b.name}
                variant="secondary"
                icon={
                  b.id === activeBranch?.id
                    ? "checkmark-circle"
                    : "location-outline"
                }
                onPress={() => {
                  setActiveBranch(b.id);
                  setPicker(null);
                }}
              />
            ))}
      </BottomSheet>
    </>
  );
}
