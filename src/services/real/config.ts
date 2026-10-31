/**
 * Public build-time variables (see `.env.example`). Expo inlines `process.env.EXPO_PUBLIC_*`
 * only when read with the full static name, so do not destructure or index `process.env`.
 */
export const PULSO_API_URL = (
  process.env.EXPO_PUBLIC_PULSO_API_URL ?? "http://localhost:3001/api/v1"
).replace(/\/+$/, "");

export const AUTH_API_URL = (
  process.env.EXPO_PUBLIC_AUTH_API_URL ?? "http://localhost:3130"
).replace(/\/+$/, "");

/** The code of this product in atm-auth-api. */
export const AUTH_SYSTEM = "pulso";

export const REQUEST_TIMEOUT_MS = 15_000;
