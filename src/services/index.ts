import { mockServices } from "./mock";
import type { Services } from "./types";

/**
 * Single composition point. To go live, build `httpServices` (same `Services` shape)
 * and select it here (e.g. by an EXPO_PUBLIC_ env flag). No screen changes needed.
 */
export const services: Services = mockServices;

export type * from "./types";
