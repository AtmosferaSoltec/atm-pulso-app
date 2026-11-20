// The camera is only used for the optional photo of a payment proof. Requesting CAMERA makes Google Play
// assume the camera hardware is required and hide the app on devices without one (tablets, Chromebooks).
// Declaring the features as not required keeps those devices; the app works without a camera (gallery or none).
const { withAndroidManifest } = require("expo/config-plugins");

const FEATURES = ["android.hardware.camera", "android.hardware.camera.autofocus"];

module.exports = function withOptionalCamera(config) {
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
