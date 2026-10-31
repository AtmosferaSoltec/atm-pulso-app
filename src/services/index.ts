import { mockServices } from "./mock";
import { realServices } from "./real";
import type { Services } from "./types";

/**
 * Single composition point. `EXPO_PUBLIC_API_MODE=real|mock` (default `mock`, so the app
 * works without a server). Screens and hooks never know which one they talk to.
 */
export const services: Services =
  process.env.EXPO_PUBLIC_API_MODE === "real" ? realServices : mockServices;

export type * from "./types";
