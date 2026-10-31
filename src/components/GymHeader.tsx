import { useState } from "react";
import { Image, Pressable, View } from "react-native";
import { router } from "expo-router";

import { initials } from "@/lib/format";
import { useSession } from "@/state/session";
import { useTheme } from "@/theme/ThemeProvider";

import { Avatar, BottomSheet, Icon, Text } from "./ui";

/** Gym logo, or its initials on the brand color when there is no logo. */
export function GymMark({ size = 32 }: { size?: number }) {
  const { user } = useSession();
  const { colors } = useTheme();
  const name = user?.gym.name ?? "";
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        backgroundColor: colors.brand,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {user?.gym.logo_url ? (
        <Image
          source={{ uri: user.gym.logo_url }}
          style={{ width: size, height: size }}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Text
          variant="label"
          style={{ color: colors.onBrand, fontSize: size * 0.4 }}
        >
          {initials(name)}
        </Text>
      )}
    </View>
  );
}

function OptionRow({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 52,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderColor: colors.border,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Text variant={selected ? "label" : "body"}>{label}</Text>
      {selected && <Icon name="checkmark" size={20} color={colors.brand} />}
    </Pressable>
  );
}

/**
 * Home header: gym identity on the left, profile on the right.
 * Gym and branch are only shown/selectable when the user has more than one.
 */
export function GymHeader() {
  const {
    user,
    visibility,
    activeBranch,
    gyms,
    setActiveBranch,
    switchGym,
    pending,
  } = useSession();
  const { colors } = useTheme();
  const [picker, setPicker] = useState<"gym" | "branch" | null>(null);
  const [switchError, setSwitchError] = useState<string | undefined>();
  const switchable = visibility.showGym || visibility.showBranch;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        height: 52,
      }}
    >
      <GymMark />
      <Pressable
        disabled={!switchable}
        accessibilityRole={switchable ? "button" : "header"}
        accessibilityLabel={
          switchable
            ? `${user?.gym.name}${visibility.showBranch ? `, sede ${activeBranch?.name}` : ""}. Cambiar`
            : user?.gym.name
        }
        onPress={() => setPicker(visibility.showGym ? "gym" : "branch")}
        style={{ flex: 1, minHeight: 44, justifyContent: "center" }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Text variant="heading" numberOfLines={1} style={{ flexShrink: 1 }}>
            {user?.gym.name}
          </Text>
          {switchable && (
            <Icon name="chevron-down" size={16} color={colors.textMuted} />
          )}
        </View>
        {visibility.showBranch && (
          <Text variant="caption" tone="muted" numberOfLines={1}>
            Sede {activeBranch?.name}
          </Text>
        )}
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Perfil"
        onPress={() => router.push("/profile")}
        hitSlop={6}
        style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
      >
        <Avatar name={user?.full_name ?? ""} size={36} />
      </Pressable>
      <BottomSheet
        visible={picker !== null}
        onClose={() => setPicker(null)}
        title={picker === "gym" ? "Gimnasio" : "Sede"}
      >
        <View>
          {picker === "gym" &&
            gyms.map((g) => (
              <OptionRow
                key={g.id}
                label={g.name}
                selected={g.current}
                onPress={async () => {
                  if (pending || g.current) return;
                  try {
                    setSwitchError(undefined);
                    await switchGym(g.id);
                    setPicker(null);
                  } catch (e) {
                    setSwitchError(
                      (e as { message?: string }).message ??
                        "No se pudo cambiar de gimnasio.",
                    );
                  }
                }}
              />
            ))}
          {switchError && picker === "gym" && (
            <Text tone="danger" style={{ marginTop: 8 }}>
              {switchError}
            </Text>
          )}
          {picker === "gym" && visibility.showBranch && (
            <Text
              variant="caption"
              tone="muted"
              style={{ marginTop: 16, marginBottom: 4 }}
            >
              SEDE
            </Text>
          )}
          {(picker === "branch" ||
            (picker === "gym" && visibility.showBranch)) &&
            user?.branches.map((b) => (
              <OptionRow
                key={b.id}
                label={b.name}
                selected={b.id === activeBranch?.id}
                onPress={() => {
                  setActiveBranch(b.id);
                  setPicker(null);
                }}
              />
            ))}
        </View>
      </BottomSheet>
    </View>
  );
}
