import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useColorScheme } from "react-native";

import { DEFAULT_BRAND, mix, normalizeHex, onColor } from "./color";
import {
  darkPalette,
  lightPalette,
  radius,
  spacing,
  typography,
  type Palette,
} from "./tokens";

export type SchemePreference = "system" | "light" | "dark";

export interface Theme {
  scheme: "light" | "dark";
  colors: Palette & {
    brand: string;
    onBrand: string;
    /** Soft tint of the brand for selected items / chips. */
    brandSoft: string;
    onBrandSoft: string;
  };
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
}

interface ThemeContextValue {
  theme: Theme;
  preference: SchemePreference;
  setPreference: (p: SchemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** `brandColor` comes from the active gym (`brand_color`, #rrggbb). */
export function ThemeProvider({
  brandColor,
  children,
}: {
  brandColor?: string | null;
  children: ReactNode;
}) {
  const system = useColorScheme();
  const [preference, setPreference] = useState<SchemePreference>("system");
  const scheme: "light" | "dark" =
    preference === "system"
      ? system === "dark"
        ? "dark"
        : "light"
      : preference;

  const value = useMemo<ThemeContextValue>(() => {
    const palette = scheme === "dark" ? darkPalette : lightPalette;
    const base = normalizeHex(brandColor ?? DEFAULT_BRAND);
    // On dark backgrounds lift dark brand colors a bit so buttons stay visible.
    const brand = scheme === "dark" ? mix(base, "#ffffff", 0.5) : base;
    const brandSoft = mix(
      brand,
      palette.surface,
      scheme === "dark" ? 0.22 : 0.12,
    );
    return {
      theme: {
        scheme,
        colors: {
          ...palette,
          background: mix(
            base,
            palette.background,
            scheme === "dark" ? 0.09 : 0.035,
          ),
          surfaceAlt: mix(base, palette.surfaceAlt, 0.08),
          border: mix(base, palette.border, 0.08),
          brand,
          onBrand: onColor(brand),
          brandSoft,
          onBrandSoft:
            scheme === "dark"
              ? mix(brand, "#ffffff", 0.7)
              : mix(brand, "#000000", 0.8),
        },
        spacing,
        radius,
        typography,
      },
      preference,
      setPreference,
    };
  }, [scheme, brandColor, preference]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("ThemeProvider missing");
  return ctx;
}

export function useTheme(): Theme {
  return useThemeContext().theme;
}

export function useSchemePreference() {
  const { preference, setPreference } = useThemeContext();
  return { preference, setPreference };
}
