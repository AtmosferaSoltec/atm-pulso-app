import { fetch as expoFetch } from "expo/fetch";
import { File } from "expo-file-system";

import { PULSO_API_URL, REQUEST_TIMEOUT_MS } from "./config";
import { fromApiBody, networkError } from "./errors";
import { forceRefresh, getAccessToken } from "./tokens";

interface Options {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  query?: Record<string, string | number | undefined>;
  body?: unknown;
}

async function once(
  path: string,
  options: Options,
  token: string,
): Promise<Response> {
  const params = Object.entries(options.query ?? {}).filter(
    ([, v]) => v !== undefined && v !== "",
  );
  const url =
    PULSO_API_URL +
    path +
    (params.length
      ? "?" +
        params
          .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
          .join("&")
      : "");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, {
      method: options.method ?? "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body === undefined
          ? {}
          : { "Content-Type": "application/json" }),
      },
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    });
  } catch (e) {
    throw networkError((e as Error)?.name === "AbortError");
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Authenticated call to pulso-api. Returns the parsed JSON body (`{ data, meta? }`).
 * On 401 it renews the token and retries exactly once; if the renewal fails the session is closed
 * (see `onSessionExpired`) and `UNAUTHORIZED` is thrown.
 */
export async function api<T>(path: string, options: Options = {}): Promise<T> {
  let response = await once(path, options, await getAccessToken());
  if (response.status === 401) {
    response = await once(path, options, await forceRefresh());
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw fromApiBody(response.status, body);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/**
 * Sends a local file as the raw request body (the API reads the bytes and checks the type itself).
 * Uses expo/fetch, which streams an expo-file-system `File` without loading it into JS.
 */
export async function uploadFile(
  path: string,
  file: { uri: string; mimeType: string },
): Promise<void> {
  const send = async (token: string) => {
    try {
      return await expoFetch(PULSO_API_URL + path, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": file.mimeType,
        },
        body: new File(file.uri),
      });
    } catch {
      throw networkError(false);
    }
  };
  let response = await send(await getAccessToken());
  if (response.status === 401) response = await send(await forceRefresh());
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw fromApiBody(response.status, body);
  }
}
