// API functions for issuer applications

import { API_URL } from "@/types/api";


export type IssuerApplicationListDto = {
  id: string;
  institutionName: string;
  ethereumAddress: string;
  status: string;
};



export async function fetchPendingIssuerApplicationsWithJwt(jwt: string) {
  const res = await fetch(`${API_URL}/api/issuer`, {
    headers: {
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    },
  });
  if (!res.ok) throw new Error("Błąd pobierania danych");
  return await res.json();
}


export async function updateIssuerApplicationStatusWithJwt(id: string, status: 'Approved' | 'Rejected', jwt: string) {
  const res = await fetch(`${API_URL}/api/issuer/${id}/status?status=${status}`, {
    method: 'PATCH',
    headers: {
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`Błąd zmiany statusu na ${status}`);
}