// Google Play turns some manifest entries into REQUIRED hardware and hides the app on devices without it:
// - CAMERA (optional photo of a payment proof) implies a camera; the app works without one.
// - The portrait lock (`orientation: "portrait"`) implies a portrait screen, hiding it on tablets,
//   Chromebooks and Android XR. The app still opens in portrait; only the requirement is dropped.
// Declaring these features as not required keeps every device.
const { withAndroidManifest } = require("expo/config-plugins");

const FEATURES = [
  "android.hardware.camera",
  "android.hardware.camera.autofocus",
  "android.hardware.screen.portrait",
];

module.exports = function withOptionalHardware(config) {
  return withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;
    const features = manifest["uses-feature"] ?? [];
    for (const name of FEATURES) {
      const existing = features.find((f) => f.$["android:name"] === name);
      if (existing) existing.$["android:required"] = "false";
      else features.push({ $: { "android:name": name, "android:required": "false" } });
    }
    manifest["uses-feature"] = features;
    return mod;
  });
};
