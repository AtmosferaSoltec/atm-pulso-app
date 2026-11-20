import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { ActivityIndicator, Image, Linking, Pressable, View } from "react-native";

import { services, type ProofFile, type ProofOwner } from "@/services";
import { useTheme } from "@/theme/ThemeProvider";
import type { PaymentMethod } from "@/types";

import { Icon, Text } from "./ui";

/** The server keeps at most 5 proofs per payment. */
const MAX_PROOFS = 5;
/** Long side of the photo sent: sharp enough to read an operation number, small enough to upload fast. */
const MAX_SIDE = 1600;

/** Proofs only make sense for money that leaves a trace: never for cash. */
export const acceptsProof = (method: PaymentMethod | null | undefined) =>
  !!method && method !== "cash";

/** Shrinks a camera/gallery photo to a JPEG under ~1 MB before it is kept for upload. */
async function shrink(asset: ImagePicker.ImagePickerAsset): Promise<ProofFile> {
  const context = ImageManipulator.manipulate(asset.uri);
  const landscape = (asset.width ?? 0) >= (asset.height ?? 0);
  const longSide = Math.max(asset.width ?? 0, asset.height ?? 0);
  if (longSide > MAX_SIDE)
    context.resize(
      landscape
        ? { width: MAX_SIDE, height: null }
        : { width: null, height: MAX_SIDE },
    );
  const image = await context.renderAsync();
  const saved = await image.saveAsync({
    format: SaveFormat.JPEG,
    compress: 0.7,
  });
  return { uri: saved.uri, mimeType: "image/jpeg" };
}

/**
 * Uploads the proofs once the payment exists. Never throws: the payment is already saved,
 * so a failed photo only returns how many could not be uploaded (they can be added from the web).
 */
export async function uploadProofs(
  owner: ProofOwner,
  photos: ProofFile[],
): Promise<number> {
  let failed = 0;
  for (const photo of photos) {
    try {
      await services.vouchers.upload(owner, photo);
    } catch {
      failed += 1;
    }
  }
  return failed;
}

/** One line for the success sheet, or null when there was nothing to upload. */
export function proofSummary(sent: number, failed: number): string | null {
  if (sent === 0) return null;
  if (failed === 0)
    return sent === 1 ? "Comprobante guardado." : `${sent} comprobantes guardados.`;
  return failed === sent
    ? "No se pudo subir el comprobante. Puedes adjuntarlo desde la web."
    : `${failed} de ${sent} comprobantes no se subieron. Puedes adjuntarlos desde la web.`;
}

/**
 * Optional photo of the proof of payment (Yape/Plin, card, transfer). Reusable in any payment:
 * the parent keeps the photos and uploads them with `uploadProofs` after the payment is saved.
 */
export function PaymentProof({
  photos,
  onChange,
}: {
  photos: ProofFile[];
  onChange: (photos: ProofFile[]) => void;
}) {
  const { colors, radius } = useTheme();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<
    { text: string; settings?: boolean } | undefined
  >();
  const full = photos.length >= MAX_PROOFS;

  async function add(source: "camera" | "library") {
    if (busy || full) return;
    setNotice(undefined);
    if (source === "camera") {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setNotice({
          text: "Pulso no tiene permiso para usar la cámara.",
          settings: !permission.canAskAgain,
        });
        return;
      }
    }
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ["images"],
      quality: 1,
    };
    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled || !result.assets?.[0]) return;
    setBusy(true);
    try {
      onChange([...photos, await shrink(result.assets[0])]);
    } catch {
      setNotice({ text: "No se pudo usar esa foto. Intenta con otra." });
    } finally {
      setBusy(false);
    }
  }

  const action = (
    icon: "camera-outline" | "images-outline",
    label: string,
    source: "camera" | "library",
  ) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={busy || full}
      onPress={() => void add(source)}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
        opacity: busy || full ? 0.5 : 1,
      })}
    >
      <Icon name={icon} size={20} color={colors.brand} />
      <Text variant="label">{label}</Text>
    </Pressable>
  );

  return (
    <View style={{ gap: 8 }}>
      <Text variant="label">
        Comprobante{" "}
        <Text variant="caption" tone="muted">
          (opcional)
        </Text>
      </Text>
      {(photos.length > 0 || busy) && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {photos.map((photo, i) => (
            <View key={photo.uri}>
              <Image
                source={{ uri: photo.uri }}
                accessibilityLabel={`Comprobante ${i + 1}`}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: radius.md,
                  backgroundColor: colors.surfaceAlt,
                }}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Quitar comprobante ${i + 1}`}
                hitSlop={8}
                onPress={() => onChange(photos.filter((_, j) => j !== i))}
                style={{
                  position: "absolute",
                  top: -6,
                  right: -6,
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.text,
                }}
              >
                <Icon name="close" size={16} color={colors.textInverse} />
              </Pressable>
            </View>
          ))}
          {busy && (
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: radius.md,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.surfaceAlt,
              }}
            >
              <ActivityIndicator color={colors.brand} />
            </View>
          )}
        </View>
      )}
      {!full && (
        <View style={{ flexDirection: "row", gap: 8 }}>
          {action("camera-outline", "Tomar foto", "camera")}
          {action("images-outline", "Galería", "library")}
        </View>
      )}
      {notice && (
        <Text variant="caption" tone="danger">
          {notice.text}
          {notice.settings ? (
            <Text
              variant="caption"
              tone="brand"
              onPress={() => void Linking.openSettings()}
            >
              {" "}
              Abrir ajustes
            </Text>
          ) : null}
        </Text>
      )}
    </View>
  );
}
