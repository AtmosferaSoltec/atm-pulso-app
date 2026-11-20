import type { ConfigContext, ExpoConfig } from "expo/config";

/**
 * Versions (see DESIGN.md › Publicar): `version` in app.json is MAJOR.MINOR.PATCH.
 * - A store build bumps MINOR (1.1.2 → 1.2.0).
 * - An OTA update (eas update) bumps PATCH (1.1.2 → 1.1.3).
 * The runtime is MAJOR.MINOR.0, so an update reaches every build of its minor version and never a build
 * with different native code.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const [major, minor] = (config.version ?? "1.0.0").split(".");
  return {
    ...config,
    name: config.name ?? "Pulso",
    slug: config.slug ?? "atm-pulso-app",
    runtimeVersion: `${major}.${minor}.0`,
  };
};
