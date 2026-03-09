import axios from 'axios';
import { API_URL } from '@/types/api';

export type VerifyResult = {
  hash: string;
  isAuthentic: boolean;
  message: string;
};

export const verifyDocument = async (file: File): Promise<VerifyResult> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(
    `${API_URL}/api/documents/verify-document`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );

  return response.data as VerifyResult;
};
