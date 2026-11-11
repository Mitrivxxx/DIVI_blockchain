import { API_URL, readErrorMessage } from "@/shared/lib/api";
import type {
  EditableField,
  FollowTarget,
  MemberSearchResult,
  ProfileExternalLinks,
  PublicMemberProfile,
} from "./types";

const getFieldEndpoint = (field: EditableField) => {
  if (field === "name") return "name";
  if (field === "email") return "email";
  return "bio";
};

const getFieldBody = (field: EditableField, value: string) => {
  if (field === "name") return { name: value };
  if (field === "email") return { email: value };
  return { bio: value };
};

export const patchProfileFieldApi = async (token: string, field: EditableField, value: string): Promise<void> => {
  const endpoint = getFieldEndpoint(field);
  const body = getFieldBody(field, value);

  const response = await fetch(`${API_URL}/api/GetProfile/${endpoint}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Nie udało się zapisać pola profilu."));
  }
};

export const deleteProfileFieldApi = async (token: string, field: EditableField): Promise<void> => {
  const endpoint = getFieldEndpoint(field);

  const response = await fetch(`${API_URL}/api/GetProfile/${endpoint}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Nie udało się usunąć pola profilu."));
  }
};

export const patchProfileLinksApi = async (links: ProfileExternalLinks): Promise<void> => {
  const response = await fetch(`${API_URL}/api/GetProfile/links`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      linkedInUrl: links.linkedInUrl,
      githubUrl: links.githubUrl,
      websiteUrl: links.websiteUrl,
    }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Nie udało się zapisać linków."));
  }
};

export const uploadProfileAvatarApi = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/api/GetProfile/avatar`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Nie udało się wgrać zdjęcia profilowego."));
  }

  const body = (await response.json()) as { avatarUrl?: string };
  if (!body.avatarUrl) {
    throw new Error("Brak avatarUrl w odpowiedzi API.");
  }
  return body.avatarUrl;
};

export const deleteProfileAvatarApi = async (): Promise<void> => {
  const response = await fetch(`${API_URL}/api/GetProfile/avatar`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Nie udało się usunąć zdjęcia profilowego."));
  }
};

const withDisplayName = <T extends { firstName?: string | null; lastName?: string | null; name?: string | null }>(
  item: T,
): T => {
  const fromParts = [item.firstName, item.lastName]
    .map(part => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(" ");
  return {
    ...item,
    name: item.name?.trim() || fromParts || null,
  };
};

export const listMembersApi = async (limit = 200): Promise<MemberSearchResult[]> => {
  const params = new URLSearchParams({ limit: String(limit) });
  const response = await fetch(`${API_URL}/api/profiles?${params}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Nie udało się pobrać listy użytkowników.");
  }

  const raw = (await response.json()) as MemberSearchResult[];
  return raw.map(withDisplayName);
};

export const searchMembersApi = async (query: string, limit = 10): Promise<MemberSearchResult[]> => {
  const q = query.trim();
  if (q.length < 2) {
    return [];
  }

  const params = new URLSearchParams({ q, limit: String(limit) });
  const response = await fetch(`${API_URL}/api/profiles/search?${params}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Nie udało się wyszukać użytkowników.");
  }

  const raw = (await response.json()) as MemberSearchResult[];
  return raw.map(withDisplayName);
};

export const fetchPublicProfileApi = async (ethereumAddress: string): Promise<PublicMemberProfile> => {
  const response = await fetch(
    `${API_URL}/api/profiles/${encodeURIComponent(ethereumAddress)}`,
  );

  if (response.status === 404) {
    throw new Error("Nie znaleziono użytkownika.");
  }

  if (!response.ok) {
    throw new Error("Nie udało się pobrać profilu.");
  }

  return withDisplayName((await response.json()) as PublicMemberProfile);
};

export const fetchFollowingApi = async (ethereumAddress: string): Promise<FollowTarget[]> => {
  const response = await fetch(
    `${API_URL}/api/profiles/${encodeURIComponent(ethereumAddress)}/following`,
  );

  if (!response.ok) {
    throw new Error("Nie udało się pobrać listy obserwowanych.");
  }

  const raw = (await response.json()) as FollowTarget[];
  return raw.map(withDisplayName);
};

export const fetchFollowStatusApi = async (ethereumAddress: string): Promise<boolean> => {
  const response = await fetch(
    `${API_URL}/api/profiles/${encodeURIComponent(ethereumAddress)}/follow-status`,
    { credentials: "include" },
  );

  if (response.status === 401) {
    return false;
  }

  if (!response.ok) {
    throw new Error("Nie udało się sprawdzić statusu obserwacji.");
  }

  const body = (await response.json()) as { isFollowing?: boolean };
  return Boolean(body.isFollowing);
};

export const followMemberApi = async (ethereumAddress: string): Promise<void> => {
  const response = await fetch(
    `${API_URL}/api/profiles/${encodeURIComponent(ethereumAddress)}/follow`,
    { method: "POST", credentials: "include" },
  );

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Nie udało się zaobserwować użytkownika."));
  }
};

export const unfollowMemberApi = async (ethereumAddress: string): Promise<void> => {
  const response = await fetch(
    `${API_URL}/api/profiles/${encodeURIComponent(ethereumAddress)}/follow`,
    { method: "DELETE", credentials: "include" },
  );

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Nie udało się przestać obserwować."));
  }
};
