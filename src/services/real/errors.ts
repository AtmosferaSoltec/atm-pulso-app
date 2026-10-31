import type { ApiError } from "@/types";

export class PulsoError extends Error implements ApiError {
  code: string;
  status?: number;
  details?: unknown;
  constructor(
    code: string,
    message: string,
    status?: number,
    details?: unknown,
  ) {
    super(message);
    this.name = "PulsoError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/** Spanish text for the stable API codes. Unknown codes fall back to a generic message. */
const MESSAGES: Record<string, string> = {
  NETWORK_ERROR: "No se pudo conectar con el servidor. Revisa tu conexión.",
  TIMEOUT: "El servidor tardó demasiado en responder. Inténtalo otra vez.",
  SERVER_ERROR: "El servidor tuvo un problema. Inténtalo en un momento.",
  UNKNOWN: "Algo salió mal. Inténtalo de nuevo.",
  INVALID_CREDENTIALS: "DNI o contraseña incorrectos.",
  CURRENT_PASSWORD_INCORRECT: "La contraseña actual no es correcta.",
  NO_ACCESS: "Tu cuenta no tiene acceso a Pulso. Contacta a Atmósfera.",
  USER_INACTIVE: "Tu usuario está desactivado. Contacta a tu administrador.",
  UNAUTHORIZED: "Tu sesión expiró. Vuelve a iniciar sesión.",
  PASSWORD_CHANGE_REQUIRED: "Debes crear una nueva contraseña para continuar.",
  WEAK_PASSWORD:
    "La nueva contraseña debe ser distinta de la actual y de tu DNI, y tener al menos 8 caracteres.",
  TOO_MANY_ATTEMPTS: "Demasiados intentos. Espera unos minutos.",
  TOO_MANY_REQUESTS: "Demasiados intentos. Espera un momento.",
  FORBIDDEN: "No tienes permiso para hacer esto.",
  NOT_FOUND: "Este registro ya no existe.",
  MEMBER_NOT_FOUND: "El miembro ya no existe.",
  MEMBER_DOCUMENT_TAKEN: "Este documento ya pertenece a un miembro.",
  SCOPE_NOT_ALLOWED: "No puedes operar en esta sede.",
  BRANCH_NOT_ACCESSIBLE: "No tienes acceso a esta sede.",
  ACCESS_BRANCHES_INVALID: "Las sedes de acceso no son válidas.",
  CONFLICT: "Este registro ya existe.",
  PLAN_REQUIRED: "Elige el plan de la membresía.",
  PLAN_INVALID: "El plan elegido ya no está disponible. Elige otro.",
  PLAN_NOT_FOUND: "El plan ya no existe.",
  FEATURE_DISABLED: "Esta función no está activada para tu gimnasio.",
  NOT_AVAILABLE: "Esta función aún no está disponible.",
  MEMBERSHIP_OVERLAP: "Ya tiene un periodo de este plan en esas fechas.",
  MEMBERSHIP_ENDED: "Este periodo ya terminó y no se puede modificar.",
  MEMBERSHIP_NOT_FOUND: "Este periodo ya no existe.",
  NOTHING_TO_COLLECT: "Este miembro ya no tiene nada pendiente.",
  SALE_NOT_PENDING:
    "Alguien ya cobró una de estas ventas. No se cobró nada; revisa lo pendiente.",
  SALE_NOT_FOUND: "Una de estas ventas ya no existe. No se cobró nada.",
  VALIDATION_FAILED: "Revisa los datos e inténtalo de nuevo.",
};

const FIELD_MESSAGES: Record<string, string> = {
  DOCUMENT_NUMBER_INVALID: "El número de documento no es válido.",
  DOCUMENT_TYPE_INVALID: "Elige el tipo de documento.",
  FULL_NAME_INVALID: "Ingresa un nombre válido (3 a 120 letras).",
  PHONE_INVALID: "El celular debe tener 9 dígitos y empezar con 9.",
  MONTHS_INVALID: "Elige entre 1 y 24 meses.",
  START_DATE_INVALID: "La fecha de inicio no es válida.",
  AMOUNT_INVALID: "El monto no es válido.",
  METHOD_INVALID: "Elige un medio de pago.",
  PLAN_REQUIRED: "Elige el plan de la membresía.",
  PLAN_INVALID: "El plan elegido ya no está disponible. Elige otro.",
  PERIOD_ENDS_IN_PAST: "El periodo no puede terminar en el pasado.",
  NO_CHANGES: "No hiciste cambios.",
  MEMBER_REQUIRED: "Elige un miembro para dejar la venta pendiente.",
  MEMBER_INVALID: "El miembro elegido no es válido.",
  ITEMS_INVALID: "Revisa los productos y las cantidades (1 a 99).",
  PRODUCT_INVALID: "Un producto ya no está disponible. Actualiza la lista.",
  TOTAL_TOO_LARGE: "El total es demasiado grande (máximo S/ 100 000).",
  STATUS_INVALID: "El tipo de venta no es válido.",
  SALE_IDS_INVALID: "Las ventas elegidas no son válidas.",
  WEIGHT_INVALID: "El peso debe estar entre 20 y 400 kg, con un decimal.",
  VALUE_REQUIRED: "Escribe el peso.",
  DATE_INVALID: "La fecha no es válida.",
  DATE_FUTURE: "La fecha no puede ser futura.",
  NOTES_INVALID: "La nota es demasiado larga (máximo 500).",
};

export function messageFor(code: string): string {
  return MESSAGES[code] ?? MESSAGES.UNKNOWN;
}

/** Builds the user-facing error from an API body `{ error: { code, message, details } }`. */
export function fromApiBody(
  status: number,
  body: {
    error?: { code?: string; message?: string; details?: unknown };
  } | null,
): PulsoError {
  const code =
    body?.error?.code ?? (status >= 500 ? "SERVER_ERROR" : "UNKNOWN");
  const details = body?.error?.details;
  const issue =
    Array.isArray(details) && details.length > 0
      ? (details[0] as { code?: string })
      : undefined;
  const text =
    (issue?.code && FIELD_MESSAGES[issue.code]) ||
    MESSAGES[code] ||
    // The API's own message is Spanish and only a readable fallback.
    body?.error?.message ||
    (status >= 500 ? MESSAGES.SERVER_ERROR : MESSAGES.UNKNOWN);
  return new PulsoError(code, text, status, details);
}

export const networkError = (timeout = false) =>
  new PulsoError(
    timeout ? "TIMEOUT" : "NETWORK_ERROR",
    messageFor(timeout ? "TIMEOUT" : "NETWORK_ERROR"),
    0,
  );
export const expiredError = () =>
  new PulsoError("UNAUTHORIZED", messageFor("UNAUTHORIZED"), 401);
