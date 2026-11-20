import { router } from "expo-router";

import type { LocalPhoto } from "@/lib/photo";

/**
 * Opens the in-app camera (/camera) and resolves with the photo, already shrunk, or null when the
 * person leaves without one. Any screen can use it: `const photo = await capturePhoto();`
 */
let pending: ((photo: LocalPhoto | null) => void) | null = null;

export function capturePhoto(): Promise<LocalPhoto | null> {
  pending?.(null);
  return new Promise((resolve) => {
    pending = resolve;
    router.push("/camera");
  });
}

/** Called by the camera screen: with the chosen photo, or null when it closes without one. */
export function finishCapture(photo: LocalPhoto | null) {
  const resolve = pending;
  pending = null;
  resolve?.(photo);
}
