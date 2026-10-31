import type { MemberStatus, PaymentMethod, Role } from "@/types";

const MONTHS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

export function formatMoney(amount: string | number): string {
  const n = typeof amount === "string" ? Number(amount) : amount;
  return `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** "2026-10-30" -> "30 oct 2026" (no timezone math: business dates are plain). */
export function formatDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** "987654300" -> "987 654 300". */
export function formatPhone(phone: string): string {
  return phone.replace(/^(\d{3})(\d{3})(\d{3})$/, "$1 $2 $3");
}

/** Typing mask for dates: digits only, slashes added as you type (DD/MM/AAAA). */
export function maskDate(input: string): string {
  const d = input.replace(/\D/g, "").slice(0, 8);
  return [d.slice(0, 2), d.slice(2, 4), d.slice(4)].filter(Boolean).join("/");
}

/** "2026-10-30" -> "30/10/2026". */
export function isoToDisplay(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/** "30/10/2026" -> "2026-10-30", or null if it is not a real calendar date. */
export function displayToIso(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const iso = `${match[3]}-${match[2]}-${match[1]}`;
  const parsed = new Date(iso + "T00:00:00Z");
  return !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === iso
    ? iso
    : null;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function daysLabel(days: number): string {
  if (days === 0) return "Vence hoy";
  if (days > 0) return days === 1 ? "Vence en 1 día" : `Vence en ${days} días`;
  const n = Math.abs(days);
  return n === 1 ? "Venció hace 1 día" : `Venció hace ${n} días`;
}

export const STATUS_LABEL: Record<MemberStatus, string> = {
  active: "Activo",
  expiring: "Por vencer",
  expired: "Vencido",
  scheduled: "Programado",
};

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  yape_plin: "Yape/Plin",
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
};

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrador",
  receptionist: "Recepcionista",
};

export function planLabel(months: number): string {
  return months === 1 ? "1 mes" : `${months} meses`;
}

/** Same rule as the API (clamps to the last day of the month). Preview only; the server computes it. */
export function addMonths(date: string, months: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const total = m - 1 + months;
  const ny = y + Math.floor(total / 12);
  const nm = ((total % 12) + 12) % 12;
  const last = new Date(Date.UTC(ny, nm + 1, 0)).getUTCDate();
  return `${ny}-${String(nm + 1).padStart(2, "0")}-${String(Math.min(d, last)).padStart(2, "0")}`;
}

export function todayLima(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(
    new Date(),
  );
}

/** "2026-10-30" + n days. Plain calendar math, no timezone. */
export function addDays(date: string, days: number): string {
  const d = new Date(date + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Date the coverage ends. The API's `days_remaining` is the coverage rule (periods of every plan,
 * chained); `ends_on` is the end of one period, so the date shown is derived from the days.
 */
export function coverageEnd(member: { days_remaining: number }): string {
  return addDays(todayLima(), member.days_remaining);
}

export const METHODS: PaymentMethod[] = ["cash", "yape_plin", "card", "transfer"];

/** "72.5" / 72.5 -> "72,5 kg". */
export function formatKg(kg: number): string {
  return `${kg.toLocaleString("es-PE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`;
}

/** "2026-10-30T15:04:05Z" -> "30 oct" (Lima time). */
export function formatShortDay(iso: string): string {
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(new Date(iso));
  return formatDate(day).slice(0, -5);
}
