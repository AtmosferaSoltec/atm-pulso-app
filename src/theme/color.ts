/** Small color helpers for the per-gym brand color (#rrggbb). */

export const DEFAULT_BRAND = "#246b55";

export function normalizeHex(hex: string | null | undefined): string {
  return hex && /^#[0-9a-fA-F]{6}$/.test(hex)
    ? hex.toLowerCase()
    : DEFAULT_BRAND;
}

function rgb(hex: string): [number, number, number] {
  const h = normalizeHex(hex).slice(1);
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function toHex(c: [number, number, number]): string {
  return (
    "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")
  );
}

/** Mix `hex` with `target` (weight = share of `hex`, 0..1). */
export function mix(hex: string, target: string, weight: number): string {
  const a = rgb(hex);
  const b = rgb(target);
  return toHex(
    [0, 1, 2].map((i) => a[i] * weight + b[i] * (1 - weight)) as [
      number,
      number,
      number,
    ],
  );
}

function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** White or near-black, whichever reads better on top of `hex`. */
export function onColor(hex: string): string {
  const lightContrast = 1.05 / (luminance(hex) + 0.05);
  const darkContrast = (luminance(hex) + 0.05) / (luminance("#11151a") + 0.05);
  return lightContrast >= darkContrast ? "#ffffff" : "#11151a";
}
