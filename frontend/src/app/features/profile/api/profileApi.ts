import { API_URL } from "../../../../types/api";
import type {
  CredentialItem,
  CredentialVisibility,
  CredentialWallet,
  DocumentActivityItem,
  EditableField,
  IssuerInstitutionProfile,
  OwnerCertificate,
  ProfileData,
  ProfileExternalLinks,
  PublicCredential,
  PublicCredentialWallet,
  UpdateIssuerInstitutionProfile,
} from "../types";

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

const readErrorMessage = async (response: Response, fallback: string): Promise<string> => {
  try {
    const text = await response.text();
    if (!text) return fallback;
    try {
      const body = JSON.parse(text) as { error?: string; title?: string };
      if (body.error) return body.error;
      if (body.title) return body.title;
    } catch {
      /* plain text */
    }
    return text.length > 200 ? fallback : text;
  } catch {
    return fallback;
  }
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

export const fetchProfileApi = async (token: string): Promise<ProfileData | null> => {
  const { refreshAuthSession } = await import("@/service/auth/session");

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

export const fetchOwnerCertificatesApi = async (ownerAddress: string): Promise<OwnerCertificate[]> => {
  const response = await fetch(`${API_URL}/api/documents/owner/${encodeURIComponent(ownerAddress)}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Nie udało się pobrać certyfikatów właściciela.");
  }

  return (await response.json()) as OwnerCertificate[];
};

export const fetchMyCredentialsApi = async (): Promise<CredentialWallet> => {
  const response = await fetch(`${API_URL}/api/profiles/me/credentials`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Nie udało się pobrać credential wallet.");
  }

  return (await response.json()) as CredentialWallet;
};

export const updateCredentialVisibilityApi = async (
  hash: string,
  visibility: CredentialVisibility,
): Promise<CredentialItem> => {
  const response = await fetch(
    `${API_URL}/api/profiles/me/credentials/${encodeURIComponent(hash)}/visibility`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ visibility }),
    },
  );

  if (!response.ok) {
    let message = "Nie udało się zmienić widoczności.";
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  return (await response.json()) as CredentialItem;
};

export const fetchSharedCredentialApi = async (token: string): Promise<PublicCredential> => {
  const response = await fetch(`${API_URL}/api/share/${encodeURIComponent(token)}`);

  if (!response.ok) {
    throw new Error("Shared credential not found.");
  }

  return (await response.json()) as PublicCredential;
};

export const fetchPublicCredentialsApi = async (
  ethereumAddress: string,
): Promise<PublicCredentialWallet> => {
  const response = await fetch(
    `${API_URL}/api/profiles/${encodeURIComponent(ethereumAddress)}/credentials`,
  );

  if (!response.ok) {
    throw new Error("Nie udało się pobrać publicznych credentials.");
  }

  return (await response.json()) as PublicCredentialWallet;
};

export type MemberSearchResult = {
  memberId: number;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  ethereumAddress: string;
  role?: string | null;
  avatarUrl?: string | null;
};

export type PublicMemberProfile = {
  memberId?: number | null;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  ethereumAddress?: string | null;
  role?: string | null;
  bio?: string | null;
  linkedInUrl?: string | null;
  githubUrl?: string | null;
  websiteUrl?: string | null;
  avatarUrl?: string | null;
  createdAt?: string | null;
};

export type FollowTarget = {
  memberId: number;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  ethereumAddress?: string | null;
  avatarUrl?: string | null;
};

const normalizeMemberSearchResult = (item: MemberSearchResult): MemberSearchResult => {
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
  return raw.map(normalizeMemberSearchResult);
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
  return raw.map(normalizeMemberSearchResult);
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

  const raw = (await response.json()) as PublicMemberProfile;
  const fromParts = [raw.firstName, raw.lastName]
    .map(part => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(" ");
  return {
    ...raw,
    name: raw.name?.trim() || fromParts || null,
  };
};

const normalizeFollowTarget = (item: FollowTarget): FollowTarget => {
  const fromParts = [item.firstName, item.lastName]
    .map(part => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(" ");
  return {
    ...item,
    name: item.name?.trim() || fromParts || null,
  };
};

export const fetchFollowingApi = async (ethereumAddress: string): Promise<FollowTarget[]> => {
  const response = await fetch(
    `${API_URL}/api/profiles/${encodeURIComponent(ethereumAddress)}/following`,
  );

  if (!response.ok) {
    throw new Error("Nie udało się pobrać listy obserwowanych.");
  }

  const raw = (await response.json()) as FollowTarget[];
  return raw.map(normalizeFollowTarget);
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

export type IssuerOnChainVerifyResult = {
  ethereumAddress: string;
  isIssuer: boolean;
  networkName: string;
  message: string;
};

/** Ephemeral: check authorizedIssuers on-chain. Nothing is persisted. */
export const verifyIssuerOnChainApi = async (
  ethereumAddress: string,
): Promise<IssuerOnChainVerifyResult> => {
  const response = await fetch(
    `${API_URL}/api/profiles/${encodeURIComponent(ethereumAddress)}/verify-issuer`,
  );

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Nie udało się zweryfikować issuera."));
  }

  return (await response.json()) as IssuerOnChainVerifyResult;
};

export type DocumentVerifyByHashResult = {
  hash: string;
  isAuthentic: boolean;
  isRevoked: boolean;
  status?: number | null;
  message: string;
  transactionHash?: string | null;
  blockNumber?: number | null;
  networkName?: string | null;
};

/** Ephemeral: verify document by hash (DB + chain). Nothing is persisted. */
export const verifyDocumentByHashApi = async (
  hash: string,
): Promise<DocumentVerifyByHashResult> => {
  const response = await fetch(
    `${API_URL}/api/documents/${encodeURIComponent(hash)}/verify`,
  );

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Nie udało się zweryfikować dokumentu."));
  }

  return (await response.json()) as DocumentVerifyByHashResult;
};

export const fetchMyActivityApi = async (): Promise<DocumentActivityItem[]> => {
  const response = await fetch(`${API_URL}/api/profiles/me/activity`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Nie udało się pobrać historii transakcji.");
  }

  return (await response.json()) as DocumentActivityItem[];
};

/** Public activity for `/u/:address` — only documents with visibility=public. */
export const fetchPublicActivityApi = async (
  ethereumAddress: string,
): Promise<DocumentActivityItem[]> => {
  const response = await fetch(
    `${API_URL}/api/profiles/${encodeURIComponent(ethereumAddress)}/activity`,
  );

  if (!response.ok) {
    throw new Error("Nie udało się pobrać historii transakcji.");
  }

  return (await response.json()) as DocumentActivityItem[];
};

/** Fetches PDF with auth cookies and opens it in a new browser tab. */
export const openDocumentPdfInNewTab = async (hash: string): Promise<void> => {
  const response = await fetch(`${API_URL}/api/documents/${encodeURIComponent(hash)}/file`, {
    credentials: "include",
  });

  if (!response.ok) {
    let message = "Nie udało się otworzyć dokumentu.";
    try {
      const text = await response.text();
      if (text) message = text;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const pdfBlob =
    blob.type === "application/pdf" ? blob : new Blob([blob], { type: "application/pdf" });
  const objectUrl = URL.createObjectURL(pdfBlob);
  const opened = window.open(objectUrl, "_blank", "noopener,noreferrer");
  if (!opened) {
    URL.revokeObjectURL(objectUrl);
    throw new Error("Przeglądarka zablokowała nowe okno. Zezwól na pop-upy.");
  }
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
};

export const fetchIssuerInstitutionProfileApi = async (): Promise<IssuerInstitutionProfile | null> => {
  const response = await fetch(`${API_URL}/api/issuer/profile`, {
    credentials: "include",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Nie udało się pobrać profilu instytucji.");
  }

  return (await response.json()) as IssuerInstitutionProfile;
};

/** Public institution card for /u/:address (404 → null). */
export const fetchPublicIssuerInstitutionApi = async (
  ethereumAddress: string,
): Promise<IssuerInstitutionProfile | null> => {
  const response = await fetch(
    `${API_URL}/api/profiles/${encodeURIComponent(ethereumAddress)}/institution`,
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Nie udało się pobrać profilu instytucji.");
  }

  return (await response.json()) as IssuerInstitutionProfile;
};

export const updateIssuerInstitutionProfileApi = async (
  payload: UpdateIssuerInstitutionProfile,
): Promise<IssuerInstitutionProfile> => {
  const response = await fetch(`${API_URL}/api/issuer/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = "Nie udało się zapisać profilu instytucji.";
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  return (await response.json()) as IssuerInstitutionProfile;
};
