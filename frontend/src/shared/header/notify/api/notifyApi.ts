// API functions for issuer applications

import { API_URL } from "@/types/api";


export type IssuerApplicationListDto = {
  id: number;
  institutionName: string;
  ethereumAddress: string;
  status: string;
};

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



export async function fetchPendingIssuerApplicationsWithJwt(jwt: string) {
  const res = await fetch(`${API_URL}/api/issuer`, {
    headers: {
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    },
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
    headers: {
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    },
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Błąd zmiany statusu na ${status}`);
  }
}