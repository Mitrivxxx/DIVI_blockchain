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
  const claim = payload?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
  return typeof claim === "string" ? claim : null;
}

export function parseJwt(token: string | null) {
  if (!token) return null;
  const parts = token.split('.');
  const base64Payload = parts[1];
  if (!base64Payload) return null;
  const payload = atob(base64Payload.replace(/-/g, '+').replace(/_/g, '/'));
  const result = JSON.parse(payload);
  console.log('parseJwt result:', result);
  return result;
}
