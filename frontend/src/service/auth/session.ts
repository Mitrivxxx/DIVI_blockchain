import { API_URL } from "@/types/api";
import { EMAIL_LOGIN_STORAGE_KEY } from "./constants";

let refreshInFlight: Promise<string | null> | null = null;

/**
 * Refresh access/refresh cookies using the httpOnly refresh_token cookie.
 * Returns the new access token when available.
 */
export async function refreshAuthSession(): Promise<string | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    try {
      const response = await fetch(`${API_URL}/Auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem(EMAIL_LOGIN_STORAGE_KEY);
        }
        return null;
      }

      const body = (await response.json().catch(() => null)) as { token?: string } | null;
      if (body?.token) {
        localStorage.setItem(EMAIL_LOGIN_STORAGE_KEY, "1");
        return body.token;
      }

      return null;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}
