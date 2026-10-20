import axios from 'axios';
import { API_URL } from '@/types/api';
import type { DocumentListItem } from '@/types/documents';

export const fetchOwnerDocuments = async (ownerAddress: string): Promise<DocumentListItem[]> => {
  const response = await axios.get<DocumentListItem[]>(
    `${API_URL}/api/documents/owner/${encodeURIComponent(ownerAddress)}`,
    { withCredentials: true },
  );
  return response.data;
};

export const fetchIssuedByMe = async (): Promise<DocumentListItem[]> => {
  const response = await axios.get<DocumentListItem[]>(`${API_URL}/api/documents/issued-by-me`, {
    withCredentials: true,
  });
  return response.data;
};

export const revokeDocument = async (hash: string): Promise<void> => {
  await axios.delete(`${API_URL}/api/documents/${encodeURIComponent(hash)}/revoke`, {
    withCredentials: true,
  });
};
