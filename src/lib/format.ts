import type { DocumentType, MemberStatus, PaymentMethod, Role } from "@/types";

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

export function formatTime(timestamp: string): string {
  const d = new Date(timestamp);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
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

export const DOC_LABEL: Record<DocumentType, string> = { dni: "DNI", ce: "CE" };

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
