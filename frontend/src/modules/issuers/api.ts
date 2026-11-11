import { API_URL, readErrorMessage } from "@/shared/lib/api";
import type {
  InstitutionListItem,
  IssuerApplicationListDto,
  IssuerInstitutionProfile,
  IssuerOnChainVerifyResult,
  IssuerRoleApplication,
  UpdateIssuerInstitutionProfile,
} from "./types";

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

export function submitIssuerRoleApplication(
  data: IssuerRoleApplication,
  jwt?: string
): Promise<{ success: boolean; message?: string }> {
  return (async () => {
    try {
      const res = await fetch(`${API_URL}/api/issuer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (res.ok) {
        return { success: true };
      } else {
        const result = await res.json();
        return { success: false, message: result?.message };
      }
    } catch (err) {
      return { success: false, message: 'Błąd sieci.' };
    }
  })();
}

type RawIssuerApplication = {
  id?: number | string;
  Id?: number | string;
  institutionName?: string;
  InstitutionName?: string;
  ethereumAddress?: string;
  EthereumAddress?: string;
  status?: string;
  Status?: string;
};

export async function fetchPendingIssuerApplicationsWithJwt(jwt: string): Promise<IssuerApplicationListDto[]> {
  const res = await fetch(`${API_URL}/api/issuer`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Błąd pobierania danych");
  const data = (await res.json()) as RawIssuerApplication[];

  return data
    .map((item) => ({
      id: Number(item.id ?? item.Id),
      institutionName: item.institutionName ?? item.InstitutionName ?? "",
      ethereumAddress: item.ethereumAddress ?? item.EthereumAddress ?? "",
      status: item.status ?? item.Status ?? "",
    }))
    .filter((item) => Number.isFinite(item.id));
}

export async function updateIssuerApplicationStatusWithJwt(id: number, status: 'Approved' | 'Rejected', jwt: string) {
  const res = await fetch(`${API_URL}/api/issuer/${id}/status?status=${status}`, {
    method: 'PATCH',
    credentials: "include",
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Błąd zmiany statusu na ${status}`);
  }
}
