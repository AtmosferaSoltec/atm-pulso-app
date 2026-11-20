import { Image, Pressable, View } from "react-native";

import { services, type ProofFile, type ProofOwner } from "@/services";
import { capturePhoto } from "@/state/photo-capture";
import { useTheme } from "@/theme/ThemeProvider";
import type { PaymentMethod } from "@/types";

import { Icon, Text } from "./ui";

/** Proofs only make sense for money that leaves a trace: never for cash. */
export const acceptsProof = (method: PaymentMethod | null | undefined) =>
  !!method && method !== "cash";

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

/** One line for the success message, or null when there was nothing to upload. */
export function proofSummary(sent: number, failed: number): string | null {
  if (sent === 0) return null;
  return failed === 0
    ? "Comprobante guardado."
    : "No se pudo subir el comprobante. Puedes adjuntarlo desde la web.";
}

/**
 * Optional photo of the proof of payment (Yape/Plin, card, transfer): one per payment.
 * A card that opens the in-app camera; the parent keeps the photo and uploads it with
 * `uploadProofs` after the payment is saved.
 */
export function PaymentProof({
  photos,
  onChange,
}: {
  photos: ProofFile[];
  onChange: (photos: ProofFile[]) => void;
}) {
  const { colors, radius } = useTheme();
  const photo = photos[0];

  async function open() {
    const taken = await capturePhoto();
    if (taken) onChange([taken]);
  }

  return (
    <View style={{ gap: 8 }}>
      <Text variant="label">
        Comprobante{" "}
        <Text variant="caption" tone="muted">
          (opcional)
        </Text>
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          photo ? "Cambiar la foto del comprobante" : "Tomar foto del comprobante"
        }
        onPress={() => void open()}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          padding: 12,
          minHeight: 72,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderStyle: photo ? "solid" : "dashed",
          borderColor: photo ? colors.border : colors.brand,
          backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
        })}
      >
        {photo ? (
          <Image
            source={{ uri: photo.uri }}
            accessibilityIgnoresInvertColors
            style={{
              width: 56,
              height: 56,
              borderRadius: radius.md,
              backgroundColor: colors.surfaceAlt,
            }}
          />
        ) : (
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: radius.md,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.brandSoft,
            }}
          >
            <Icon name="camera" size={26} color={colors.brand} />
          </View>
        )}
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="label">
            {photo ? "Foto del comprobante" : "Tomar foto del comprobante"}
          </Text>
          <Text variant="caption" tone="muted">
            {photo ? "Toca para cambiarla" : "Yape/Plin, voucher o transferencia"}
          </Text>
        </View>
        {photo ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Quitar la foto"
            hitSlop={10}
            onPress={() => onChange([])}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.surfaceAlt,
            }}
          >
            <Icon name="close" size={18} color={colors.text} />
          </Pressable>
        ) : (
          <Icon name="chevron-forward" size={20} color={colors.textMuted} />
        )}
      </Pressable>
    </View>
  );
}
