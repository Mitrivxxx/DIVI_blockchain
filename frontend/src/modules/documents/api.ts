import axios from 'axios';
import { API_URL, readErrorMessage } from '@/shared/lib/api';
import type {
  CredentialItem,
  CredentialVisibility,
  CredentialWallet,
  DocumentActivityItem,
  DocumentListItem,
  DocumentVerifyByHashResult,
  OwnerCertificate,
  PublicCredential,
  PublicCredentialWallet,
  UploadDocumentParams,
  VerifyResult,
} from './types';

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

export const verifyDocument = async (file: File): Promise<VerifyResult> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(
    `${API_URL}/api/documents/verify-document`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      withCredentials: true,
    },
  );

  return response.data as VerifyResult;
};

/** Ephemeral: verify document by hash (DB + chain). Nothing is persisted. */
export const verifyDocumentByHashApi = async (
  hash: string,
): Promise<DocumentVerifyByHashResult> => {
  const response = await fetch(
    `${API_URL}/api/documents/${encodeURIComponent(hash)}/verify`,
  );

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Nie udało się zweryfikować dokumentu.'));
  }

  return (await response.json()) as DocumentVerifyByHashResult;
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

export const fetchOwnerCertificatesApi = async (ownerAddress: string): Promise<OwnerCertificate[]> => {
  const response = await fetch(`${API_URL}/api/documents/owner/${encodeURIComponent(ownerAddress)}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Nie udało się pobrać certyfikatów właściciela.');
  }

  return (await response.json()) as OwnerCertificate[];
};

/** Fetches PDF with auth cookies and opens it in a new browser tab. */
export const openDocumentPdfInNewTab = async (hash: string): Promise<void> => {
  const response = await fetch(`${API_URL}/api/documents/${encodeURIComponent(hash)}/file`, {
    credentials: 'include',
  });

  if (!response.ok) {
    let message = 'Nie udało się otworzyć dokumentu.';
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
    blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' });
  const objectUrl = URL.createObjectURL(pdfBlob);
  const opened = window.open(objectUrl, '_blank', 'noopener,noreferrer');
  if (!opened) {
    URL.revokeObjectURL(objectUrl);
    throw new Error('Przeglądarka zablokowała nowe okno. Zezwól na pop-upy.');
  }
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
};

export const fetchMyCredentialsApi = async (): Promise<CredentialWallet> => {
  const response = await fetch(`${API_URL}/api/profiles/me/credentials`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Nie udało się pobrać credential wallet.');
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
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ visibility }),
    },
  );

  if (!response.ok) {
    let message = 'Nie udało się zmienić widoczności.';
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
    throw new Error('Shared credential not found.');
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
    throw new Error('Nie udało się pobrać publicznych credentials.');
  }

  return (await response.json()) as PublicCredentialWallet;
};

export const fetchMyActivityApi = async (): Promise<DocumentActivityItem[]> => {
  const response = await fetch(`${API_URL}/api/profiles/me/activity`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Nie udało się pobrać historii transakcji.');
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
    throw new Error('Nie udało się pobrać historii transakcji.');
  }

  return (await response.json()) as DocumentActivityItem[];
};
