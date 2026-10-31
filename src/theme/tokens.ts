import { Platform } from "react-native";

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;
export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const;

export const fontFamily = Platform.select({
  ios: "system-ui",
  web: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
  default: "normal",
}) as string;

export const typography = {
  display: { fontSize: 36, lineHeight: 44, fontWeight: "700" },
  title: { fontSize: 22, lineHeight: 28, fontWeight: "700" },
  heading: { fontSize: 17, lineHeight: 24, fontWeight: "600" },
  body: { fontSize: 15, lineHeight: 22, fontWeight: "400" },
  label: { fontSize: 14, lineHeight: 20, fontWeight: "600" },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: "500" },
  mono: { fontSize: 15, lineHeight: 22, fontWeight: "600" },
} as const;

export type TypographyVariant = keyof typeof typography;

export interface Palette {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  textInverse: string;
  overlay: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  info: string;
  infoSoft: string;
}

export const lightPalette: Palette = {
  background: "#f6f7f9",
  surface: "#ffffff",
  surfaceAlt: "#eef0f3",
  border: "#e1e4e8",
  text: "#11151a",
  textMuted: "#5f6873",
  textInverse: "#ffffff",
  overlay: "rgba(10,14,20,0.45)",
  success: "#15803d",
  successSoft: "#dcfce7",
  warning: "#b45309",
  warningSoft: "#fef3c7",
  danger: "#b91c1c",
  dangerSoft: "#fee2e2",
  info: "#1d4ed8",
  infoSoft: "#dbeafe",
};

export const darkPalette: Palette = {
  background: "#0b0e12",
  surface: "#151a21",
  surfaceAlt: "#1e252e",
  border: "#2a323d",
  text: "#f2f4f7",
  textMuted: "#9aa4b2",
  textInverse: "#0b0e12",
  overlay: "rgba(0,0,0,0.6)",
  success: "#4ade80",
  successSoft: "#12301d",
  warning: "#fbbf24",
  warningSoft: "#3a2c0b",
  danger: "#f87171",
  dangerSoft: "#3b1414",
  info: "#60a5fa",
  infoSoft: "#12254a",
};
