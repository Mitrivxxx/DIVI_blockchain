import axios from 'axios';
import { API_URL } from '@/types/api';

export type UploadDocumentParams = {
  documentType: string;
  owner: string;
  file?: File | null;
  periodFrom?: string;
  periodTo?: string;
  title?: string;
};

export const uploadDocument = async ({
  documentType,
  owner,
  file,
  periodFrom,
  periodTo,
  title,
}: UploadDocumentParams) => {
  const formData = new FormData();
  formData.append('documentType', documentType);
  formData.append('owner', owner);
  if (file) {
    formData.append('file', file);
  }
  if (periodFrom) {
    formData.append('periodFrom', periodFrom);
  }
  if (periodTo) {
    formData.append('periodTo', periodTo);
  }
  if (title) {
    formData.append('title', title);
  }

  const response = await axios.post(
    `${API_URL}/api/documents/upload-document`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      withCredentials: true,
    },
  );

  return response.data as { hash: string; cid: string; message?: string; txHash?: string };
};

export const verifyDocument = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(
    `${API_URL}/api/documents/verify-document`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );

  return response.data as {
    hash: string;
    isAuthentic: boolean;
    isRevoked: boolean;
    status?: number | null;
    message: string;
    transactionHash?: string | null;
    blockNumber?: number | null;
    blockTimestamp?: string | null;
    networkName?: string | null;
  };
};
