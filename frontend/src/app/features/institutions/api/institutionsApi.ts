import { API_URL } from "@/types/api";

export type InstitutionListItem = {
  memberId: number;
  institutionName: string;
  description?: string | null;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  country?: string | null;
  taxId?: string | null;
  updatedAt: string;
  ethereumAddress?: string | null;
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

export const listInstitutionsApi = async (
  query?: string,
  limit = 100,
): Promise<InstitutionListItem[]> => {
  const params = new URLSearchParams({ limit: String(limit) });
  const q = query?.trim() ?? "";
  if (q.length >= 2) {
    params.set("q", q);
  }

  const response = await fetch(`${API_URL}/api/institutions?${params}`);
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Nie udało się pobrać katalogu instytucji."));
  }

  return (await response.json()) as InstitutionListItem[];
};

export const fetchInstitutionApi = async (memberId: number): Promise<InstitutionListItem> => {
  const response = await fetch(`${API_URL}/api/institutions/${memberId}`);

  if (response.status === 404) {
    throw new Error("Nie znaleziono instytucji.");
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Nie udało się pobrać instytucji."));
  }

  return (await response.json()) as InstitutionListItem;
};
