import Constants from "expo-constants";

/**
 * The version the phone is running, e.g. "1.0.3". After an OTA update it is the update's version
 * (expo-constants reads the running update's config), so it shows whether an update has arrived.
 */
export const appVersion = (): string => Constants.expoConfig?.version ?? "—";
