import axios from 'axios';
import { API_URL } from '@/types/api';

export const uploadDocument = async (file: File, documentType: string, owner: string) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentType', documentType);
  formData.append('owner', owner);

  const response = await axios.post(
    `${API_URL}/api/documents/upload-document`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );

  return response.data;
};
