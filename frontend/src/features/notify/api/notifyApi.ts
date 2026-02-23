// API functions for issuer applications
import { API_URL } from "@/types/api";

export type IssuerApplicationListDto = {
  id: string;
  institutionName: string;
  ethereumAddress: string;
  status: string;
};

export async function fetchPendingIssuerApplications(): Promise<IssuerApplicationListDto[]> {
  const res = await fetch(`${API_URL}/api/issuer`);
  if (!res.ok) throw new Error("Błąd pobierania danych");
  return await res.json();
}

export async function updateIssuerApplicationStatus(id: string, status: 'Approved' | 'Rejected'): Promise<void> {
  const res = await fetch(`${API_URL}/api/issuer/${id}/status?status=${status}`, {
    method: 'PATCH',
  });
  if (!res.ok) throw new Error(`Błąd zmiany statusu na ${status}`);
}
