import { getRequestEvent } from "solid-js/web";

export function apiUrl(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  const ev = (globalThis as any).__$getRequestEvent?.() || (typeof getRequestEvent !== "undefined" ? getRequestEvent() : null);
  if (ev && ev.request && ev.request.url) {
    try {
      const u = new URL(ev.request.url);
      return `${u.origin}${clean}`;
    } catch {}
  }
  const base = (globalThis as any).__$API_BASE;
  if (base) return `${base}${clean}`;
  if (typeof process !== "undefined" && process.env && process.env.SERVER_BASE_URL) {
    return `${process.env.SERVER_BASE_URL}${clean}`;
  }
  const serverPort = (typeof process !== "undefined" && process.env?.PORT) || "3000";
  return `http://localhost:${serverPort}${clean}`;
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), init);
}
