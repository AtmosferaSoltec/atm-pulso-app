import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  View,
  type GestureResponderEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Icon, Text, type IconName } from "@/components/ui";
import { shrinkPhoto, type LocalPhoto } from "@/lib/photo";
import { finishCapture } from "@/state/photo-capture";
import { useTheme } from "@/theme/ThemeProvider";

/** Distance between two fingers, for pinch-to-zoom. */
const spread = (e: GestureResponderEvent) => {
  const [a, b] = e.nativeEvent.touches;
  return a && b ? Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY) : 0;
};

/**
 * In-app camera (CameraX on Android), WhatsApp style: back camera only, flash on/off, pinch to zoom,
 * shutter and a gallery button. Shows the photo to confirm («Usar foto») or retake. Reusable: open it with
 * `capturePhoto()` from `@/state/photo-capture`, which resolves with the shrunk photo or null.
 */
export default function CameraScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [ready, setReady] = useState(false);
  const [flash, setFlash] = useState(false);
  const [zoom, setZoom] = useState(0);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<LocalPhoto | null>(null);
  const [failure, setFailure] = useState<string | undefined>();
  const pinch = useRef({ start: 0, zoom: 0 });
  const chosen = useRef(false);

  // Ask once on arrival; if the person refuses for good, the screen offers Settings and the gallery.
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain)
      void requestPermission();
  }, [permission, requestPermission]);

  // Leaving by the back gesture or the X resolves the caller with «no photo».
  useEffect(
    () => () => {
      if (!chosen.current) finishCapture(null);
    },
    [],
  );

  async function shoot() {
    if (!camera.current || !ready || busy) return;
    setBusy(true);
    setFailure(undefined);
    try {
      const picture = await camera.current.takePictureAsync({ quality: 0.8 });
      setPreview(await shrinkPhoto(picture));
    } catch {
      setFailure("No se pudo tomar la foto. Intenta otra vez.");
    } finally {
      setBusy(false);
    }
  }

  async function fromGallery() {
    if (busy) return;
    setFailure(undefined);
    // The system photo picker: no gallery permission, the person only shares the photo they pick.
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
    });
    if (result.canceled || !result.assets?.[0]) return;
    setBusy(true);
    try {
      setPreview(await shrinkPhoto(result.assets[0]));
    } catch {
      setFailure("No se pudo usar esa foto. Intenta con otra.");
    } finally {
      setBusy(false);
    }
  }

  function use() {
    if (!preview) return;
    chosen.current = true;
    finishCapture(preview);
    router.back();
  }

  const round = (
    icon: IconName,
    label: string,
    onPress: () => void,
    size = 48,
  ) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: pressed ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.35)",
      })}
    >
      <Icon name={icon} size={24} color="#fff" />
    </Pressable>
  );

  const topBar = (
    <View
      style={{
        position: "absolute",
        top: insets.top + 8,
        left: 16,
        right: 16,
        flexDirection: "row",
        justifyContent: "space-between",
      }}
    >
      {round("close", "Cerrar", () => router.back())}
      {!preview &&
        permission?.granted &&
        round(
          flash ? "flash" : "flash-off",
          flash ? "Apagar flash" : "Encender flash",
          () => setFlash((on) => !on),
        )}
    </View>
  );

  if (preview)
    return (
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        <StatusBar style="light" />
        <Image
          source={{ uri: preview.uri }}
          accessibilityLabel="Foto tomada"
          resizeMode="contain"
          style={{ flex: 1 }}
        />
        {topBar}
        <View
          style={{
            position: "absolute",
            bottom: insets.bottom + 24,
            left: 24,
            right: 24,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Pressable
            accessibilityRole="button"
            onPress={() => setPreview(null)}
            style={{ paddingVertical: 12, paddingHorizontal: 8 }}
          >
            <Text variant="heading" style={{ color: "#fff" }}>
              Repetir
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Usar foto"
            onPress={use}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingVertical: 14,
              paddingHorizontal: 22,
              borderRadius: 999,
              backgroundColor: colors.brand,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Icon name="checkmark" size={22} color={colors.onBrand} />
            <Text variant="heading" style={{ color: colors.onBrand }}>
              Usar foto
            </Text>
          </Pressable>
        </View>
      </View>
    );

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar style="light" />
      {permission?.granted ? (
        <View
          style={{ flex: 1 }}
          onStartShouldSetResponder={(e) => e.nativeEvent.touches.length === 2}
          onMoveShouldSetResponder={(e) => e.nativeEvent.touches.length === 2}
          onResponderGrant={(e) => {
            pinch.current = { start: spread(e), zoom };
          }}
          onResponderMove={(e) => {
            const now = spread(e);
            if (!now) return;
            if (!pinch.current.start) pinch.current = { start: now, zoom };
            const next =
              pinch.current.zoom + (now - pinch.current.start) / 600;
            setZoom(Math.min(1, Math.max(0, next)));
          }}
          onResponderRelease={() => {
            pinch.current.start = 0;
          }}
        >
          <CameraView
            ref={camera}
            style={{ flex: 1 }}
            facing="back"
            flash={flash ? "on" : "off"}
            zoom={zoom}
            animateShutter
            onCameraReady={() => setReady(true)}
          />
        </View>
      ) : (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 32,
            gap: 16,
          }}
        >
          {permission === null ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon name="camera-outline" size={40} color="#fff" />
              <Text
                variant="heading"
                style={{ color: "#fff", textAlign: "center" }}
              >
                Pulso necesita la cámara para fotografiar el comprobante.
              </Text>
              <Button
                title={permission.canAskAgain ? "Permitir cámara" : "Abrir ajustes"}
                fullWidth={false}
                onPress={() =>
                  permission.canAskAgain
                    ? void requestPermission()
                    : void Linking.openSettings()
                }
              />
            </>
          )}
        </View>
      )}

      {topBar}

      <View
        style={{
          position: "absolute",
          bottom: insets.bottom + 28,
          left: 24,
          right: 24,
          alignItems: "center",
          gap: 14,
        }}
      >
        {failure ? (
          <Text variant="caption" style={{ color: "#fff", textAlign: "center" }}>
            {failure}
          </Text>
        ) : zoom > 0.01 ? (
          <Text variant="caption" style={{ color: "#fff" }}>
            Zoom {Math.round(zoom * 100)}%
          </Text>
        ) : null}
        <View
          style={{
            alignSelf: "stretch",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {round("images-outline", "Elegir de la galería", () => void fromGallery(), 52)}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tomar foto"
            disabled={!permission?.granted || !ready || busy}
            onPress={() => void shoot()}
            style={({ pressed }) => ({
              width: 78,
              height: 78,
              borderRadius: 39,
              borderWidth: 5,
              borderColor: "#fff",
              alignItems: "center",
              justifyContent: "center",
              opacity: !permission?.granted || !ready ? 0.4 : 1,
              transform: [{ scale: pressed ? 0.94 : 1 }],
            })}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: "#fff",
                }}
              />
            )}
          </Pressable>
          <View style={{ width: 52 }} />
        </View>
      </View>
    </View>
  );
}
