import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { AUTH_API_URL, AUTH_SYSTEM, REQUEST_TIMEOUT_MS } from "./config";
import { expiredError, messageFor, networkError, PulsoError } from "./errors";

/**
 * Where the atm-auth-api tokens live.
 * - Refresh token: expo-secure-store (Keychain / Keystore). Never AsyncStorage.
 *   Web has no secure store: the web export (used only for browser testing) falls back to localStorage.
 * - Access token: memory only (it lasts minutes; the refresh token brings it back after a restart).
 */
const REFRESH_KEY = "pulso.refresh_token";
const REFRESH_MARGIN_MS = 30_000;

async function readRefresh(): Promise<string | null> {
  try {
    if (Platform.OS === "web")
      return globalThis.localStorage?.getItem(REFRESH_KEY) ?? null;
    return await SecureStore.getItemAsync(REFRESH_KEY);
  } catch {
    return null;
  }
}
async function writeRefresh(token: string | null): Promise<void> {
  try {
    if (Platform.OS === "web") {
      if (token) globalThis.localStorage?.setItem(REFRESH_KEY, token);
      else globalThis.localStorage?.removeItem(REFRESH_KEY);
      return;
    }
    if (token) await SecureStore.setItemAsync(REFRESH_KEY, token);
    else await SecureStore.deleteItemAsync(REFRESH_KEY);
  } catch {
    // Without storage the session lasts until the app closes.
  }
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

let access: { token: string; expiresAt: number } | null = null;
let inflight: Promise<string> | null = null;
const listeners = new Set<() => void>();

export function onSessionExpired(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function setTokens(response: TokenResponse): Promise<void> {
  access = {
    token: response.access_token,
    expiresAt: Date.now() + response.expires_in * 1000,
  };
  await writeRefresh(response.refresh_token);
}

export async function clearTokens(): Promise<void> {
  access = null;
  await writeRefresh(null);
}

/** The refresh token no longer works: forget everything and tell the app. */
async function expire(): Promise<never> {
  await clearTokens();
  listeners.forEach((l) => l());
  throw expiredError();
}

/** Translates atm-auth-api errors (`{ error: { code } }`, codes in snake_case). */
function translate(
  status: number,
  authCode: string | undefined,
  retryAfter: number,
  changing: boolean,
) {
  switch (authCode) {
    case "invalid_credentials":
      return new PulsoError(
        changing ? "CURRENT_PASSWORD_INCORRECT" : "INVALID_CREDENTIALS",
        messageFor(
          changing ? "CURRENT_PASSWORD_INCORRECT" : "INVALID_CREDENTIALS",
        ),
        401,
      );
    case "no_access":
      return new PulsoError("NO_ACCESS", messageFor("NO_ACCESS"), 403);
    case "password_change_required":
      return new PulsoError(
        "PASSWORD_CHANGE_REQUIRED",
        messageFor("PASSWORD_CHANGE_REQUIRED"),
        403,
      );
    case "weak_password":
      return new PulsoError("WEAK_PASSWORD", messageFor("WEAK_PASSWORD"), 400);
    case "too_many_attempts": {
      const minutes = Math.max(1, Math.ceil((retryAfter || 60) / 60));
      return new PulsoError(
        "TOO_MANY_ATTEMPTS",
        `Demasiados intentos. Espera ${minutes} ${minutes === 1 ? "minuto" : "minutos"} e inténtalo de nuevo.`,
        429,
      );
    }
    default:
      if (status === 401) return expiredError();
      return new PulsoError(
        status >= 500 ? "SERVER_ERROR" : "UNKNOWN",
        "No pudimos verificar tu cuenta en este momento. Inténtalo de nuevo en un instante.",
        status,
      );
  }
}

async function authRequest<T>(
  path: string,
  body?: unknown,
  token?: string,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${AUTH_API_URL}${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    throw networkError((e as Error)?.name === "AbortError");
  } finally {
    clearTimeout(timer);
  }
  if (response.ok) {
    if (response.status === 204) return undefined as T;
    return (await response.json().catch(() => undefined)) as T;
  }
  const payload = (await response.json().catch(() => null)) as {
    error?: { code?: string };
  } | null;
  throw translate(
    response.status,
    payload?.error?.code,
    Number(response.headers.get("Retry-After")),
    path === "/v1/password/change",
  );
}

export async function hasStoredSession(): Promise<boolean> {
  return access !== null || (await readRefresh()) !== null;
}

export async function signIn(dni: string, password: string): Promise<void> {
  const response = await authRequest<TokenResponse>("/v1/login", {
    dni,
    password,
    system: AUTH_SYSTEM,
  });
  await setTokens(response);
}

export async function signOut(): Promise<void> {
  const refreshToken = await readRefresh();
  await clearTokens();
  if (!refreshToken) return;
  try {
    await authRequest("/v1/logout", { refresh_token: refreshToken });
  } catch {
    // The device is already signed out; an unreachable server cannot undo that.
  }
}

export async function changePassword(
  dni: string,
  current: string,
  next: string,
): Promise<void> {
  await authRequest("/v1/password/change", {
    dni,
    current_password: current,
    new_password: next,
  });
  // atm-auth-api ends every session of the person.
  await clearTokens();
}

async function renew(tenantId?: string): Promise<string> {
  const refreshToken = await readRefresh();
  if (!refreshToken) return expire();
  let response: TokenResponse;
  try {
    response = await authRequest<TokenResponse>("/v1/refresh", {
      refresh_token: refreshToken,
      ...(tenantId ? { tenant_id: tenantId } : {}),
    });
  } catch (error) {
    // Only a server rejection closes the session; a dropped network does not.
    const status = (error as PulsoError).status;
    if (status === 401 || status === 403) return expire();
    throw error;
  }
  await setTokens(response);
  return response.access_token;
}

function refresh(tenantId?: string): Promise<string> {
  // atm-auth-api rotates the refresh token on every use: all requests share one renewal.
  inflight ??= renew(tenantId).finally(() => {
    inflight = null;
  });
  return inflight;
}

/** A valid access token, renewed if it is about to expire. Rejects with `UNAUTHORIZED` when there is no session. */
export async function getAccessToken(): Promise<string> {
  if (access && access.expiresAt - REFRESH_MARGIN_MS > Date.now())
    return access.token;
  return refresh();
}

/** The API rejected the token: ask for a new one. */
export function forceRefresh(): Promise<string> {
  access = null;
  return refresh();
}

export async function switchTenant(tenantId: string): Promise<void> {
  if (inflight) await inflight.catch(() => undefined);
  access = null;
  await refresh(tenantId);
}

export async function listTenants() {
  const token = await getAccessToken();
  const response = await authRequest<{
    items: { tenant_id: string; name: string; current: boolean }[];
  }>("/v1/session/tenants", undefined, token);
  return response.items;
}
