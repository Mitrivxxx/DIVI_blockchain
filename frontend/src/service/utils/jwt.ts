const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

export function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) {
      return null;
    }
    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddingLength = (4 - (normalizedPayload.length % 4)) % 4;
    const paddedPayload = normalizedPayload + "=".repeat(paddingLength);
    return JSON.parse(atob(paddedPayload)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getJwtExpiryMs(token: string): number | null {
  const payload = parseJwtPayload(token);
  const exp = payload?.exp;
  if (typeof exp !== "number") {
    return null;
  }
  return exp * 1000;
}

export function getAddressFromJwt(token: string): string | null {
  const payload = parseJwtPayload(token);
  const sub = payload?.sub;
  return typeof sub === "string" ? sub : null;
}

export function getRoleFromJwt(token: string): string | null {
  const payload = parseJwtPayload(token);
  const role = payload?.[ROLE_CLAIM];
  return typeof role === "string" ? role : null;
}
