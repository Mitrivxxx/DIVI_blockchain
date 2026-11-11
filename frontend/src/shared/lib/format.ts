import { API_URL } from "./api";

export const shortHex = (value: string | null | undefined, head = 10, tail = 8): string => {
  if (!value) return '—';
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
};

export const resolveAvatarSrc = (avatarUrl: string | null | undefined, fallback: string): string => {
  const url = avatarUrl?.trim();
  if (!url) return fallback;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }
  if (url.startsWith("/")) {
    return `${API_URL}${url}`;
  }
  return url;
};
