import { API_URL } from "@/shared/lib/api";
import { refreshAuthSession } from "./session";

/** Signed-in member from GET /api/GetProfile. */
export type ProfileData = {
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  ethereumAddress?: string | null;
  role?: string | null;
  email?: string | null;
  bio?: string | null;
  linkedInUrl?: string | null;
  githubUrl?: string | null;
  websiteUrl?: string | null;
  createdAt?: string | null;
  avatarUrl?: string | null;
};

/** Normalize API profile (Name / FirstName+LastName) into ProfileData.name. */
export const normalizeProfileData = (raw: ProfileData): ProfileData => {
  const fromParts = [raw.firstName, raw.lastName]
    .map(part => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(" ");
  const name = raw.name?.trim() || fromParts || null;
  return { ...raw, name };
};

export const fetchProfileApi = async (token: string): Promise<ProfileData | null> => {
  const load = async () =>
    fetch(`${API_URL}/api/GetProfile`, {
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

  let response = await load();
  if (response.status === 401) {
    const refreshed = await refreshAuthSession();
    if (refreshed) {
      response = await fetch(`${API_URL}/api/GetProfile`, {
        credentials: "include",
        headers: { Authorization: `Bearer ${refreshed}` },
      });
    }
  }

  if (!response.ok) {
    return null;
  }

  const raw = (await response.json()) as ProfileData;
  return normalizeProfileData(raw);
};
