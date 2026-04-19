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
