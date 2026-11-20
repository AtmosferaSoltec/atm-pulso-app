import { createContext, useContext, useMemo, type ReactNode } from "react";

import { DEFAULT_BRAND, mix, normalizeHex, onColor } from "./color";
import { lightPalette, radius, spacing, typography, type Palette } from "./tokens";

/** One light theme for everyone, tinted with the gym's brand colour. There is no dark mode on purpose. */
export interface Theme {
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

const ThemeContext = createContext<Theme | null>(null);

/** `brandColor` comes from the active gym (`brand_color`, #rrggbb). */
export function ThemeProvider({
  brandColor,
  children,
}: {
  brandColor?: string | null;
  children: ReactNode;
}) {
  const value = useMemo<Theme>(() => {
    const palette = lightPalette;
    const brand = normalizeHex(brandColor ?? DEFAULT_BRAND);
    return {
      colors: {
        ...palette,
        background: mix(brand, palette.background, 0.035),
        surfaceAlt: mix(brand, palette.surfaceAlt, 0.08),
        border: mix(brand, palette.border, 0.08),
        brand,
        onBrand: onColor(brand),
        brandSoft: mix(brand, palette.surface, 0.12),
        onBrandSoft: mix(brand, "#000000", 0.8),
      },
      spacing,
      radius,
      typography,
    };
  }, [brandColor]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error("ThemeProvider missing");
  return theme;
}
