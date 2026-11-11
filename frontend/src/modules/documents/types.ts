import { shortHex } from '@/shared/lib/format';

/** Mirrors backend DocumentListItemDto (camelCase JSON). */
export type DocumentListItem = {
  hash: string;
  issuer: string;
  issuedAt: string;
  periodStart?: string | null;
  expiresAt?: string | null;
  title?: string | null;
  cid?: string;
  documentType?: number;
  txHash?: string | null;
  blockNumber?: number;
  status?: number;
  ownerAddress?: string | null;
  issuedByMemberId?: number | null;
  issuerDisplayName?: string | null;
};

export const DOCUMENT_STATUS = {
  Pending: 0,
  Confirmed: 1,
  Revoked: 2,
} as const;

export const documentStatusLabel = (status: number | null | undefined): string => {
  switch (status) {
    case DOCUMENT_STATUS.Pending:
      return 'Pending';
    case DOCUMENT_STATUS.Confirmed:
      return 'Confirmed';
    case DOCUMENT_STATUS.Revoked:
      return 'Revoked';
    default:
      return '—';
  }
};

/** Mirrors backend DocumentTypeCatalog (0–4). */
export const DOCUMENT_TYPE_SECTIONS = [
  { id: 0, apiValue: 'Education', label: 'Wykształcenie' },
  { id: 1, apiValue: 'Experience', label: 'Doświadczenie' },
  { id: 2, apiValue: 'Licenses and certificates', label: 'Licencje i certyfikaty' },
  { id: 3, apiValue: 'Recommendation', label: 'Rekomendacja' },
  { id: 4, apiValue: 'Honors and awards', label: 'Wyróżnienia i nagrody' },
] as const;

/** Education + Experience: period dates instead of PDF. */
export const METADATA_DOCUMENT_TYPE_API_VALUES = new Set<string>([
  'Education',
  'Experience',
]);

export const isMetadataDocumentType = (apiValue: string | null | undefined): boolean =>
  Boolean(apiValue && METADATA_DOCUMENT_TYPE_API_VALUES.has(apiValue));

/** Education requires title / field of study on upload. */
export const isEducationDocumentType = (apiValue: string | null | undefined): boolean =>
  apiValue === 'Education';

/** Experience requires job title (stanowisko) on upload. */
export const isExperienceDocumentType = (apiValue: string | null | undefined): boolean =>
  apiValue === 'Experience';

/** Education + Experience both send a free-text `title` with period dates. */
export const isTitledMetadataDocumentType = (apiValue: string | null | undefined): boolean =>
  isEducationDocumentType(apiValue) || isExperienceDocumentType(apiValue);

export const documentTypeLabel = (documentType: number | null | undefined): string => {
  const section = DOCUMENT_TYPE_SECTIONS.find(s => s.id === documentType);
  return section?.label ?? '—';
};

export const formatDocumentPeriod = (
  periodStart: string | null | undefined,
  expiresAt: string | null | undefined,
  issuedAt?: string | null,
): string => {
  if (periodStart) {
    const from = new Date(periodStart).toLocaleDateString('pl-PL');
    if (expiresAt) {
      return `${from} – ${new Date(expiresAt).toLocaleDateString('pl-PL')}`;
    }
    return from;
  }
  if (issuedAt) {
    return new Date(issuedAt).toLocaleString('pl-PL');
  }
  return '—';
};

/** Prefer institution name; fall back to truncated on-chain issuer address. */
export const formatIssuerLabel = (
  displayName: string | null | undefined,
  address: string | null | undefined,
): string => {
  const name = displayName?.trim();
  if (name) return name;
  return shortHex(address);
};

/** True when CID points to an IPFS PDF (not Education/Experience metadata). */
export const hasDocumentPdfFile = (cid: string | null | undefined): boolean => {
  const value = cid?.trim();
  if (!value) return false;
  return !value.toLowerCase().startsWith('meta:');
};

/** Owner-owned documents from GET /api/documents/owner/{address}. */
export type OwnerCertificate = DocumentListItem;

export type CredentialVisibility = 'private' | 'unlisted' | 'public';

/** Owner credential wallet item from GET /api/profiles/me/credentials. */
export type CredentialItem = {
  hash: string;
  documentType: number;
  status: number;
  issuedAt: string;
  periodStart?: string | null;
  expiresAt?: string | null;
  title?: string | null;
  issuerAddress: string;
  ownerAddress: string;
  txHash: string;
  blockNumber: number;
  visibility: CredentialVisibility;
  shareToken?: string | null;
  cid: string;
  issuedByMemberId?: number | null;
  issuerDisplayName?: string | null;
  issuerLogoUrl?: string | null;
};

export type CredentialSection = {
  documentType: number;
  label: string;
  items: CredentialItem[];
};

/** Grouped wallet from GET /api/profiles/me/credentials. */
export type CredentialWallet = {
  sections: CredentialSection[];
};

/** Public share / portfolio item (no CID; use hasPdfFile for preview). */
export type PublicCredential = {
  hash: string;
  documentType: number;
  status: number;
  issuedAt: string;
  periodStart?: string | null;
  expiresAt?: string | null;
  title?: string | null;
  issuerAddress: string;
  ownerAddress: string;
  txHash: string;
  blockNumber: number;
  visibility: CredentialVisibility;
  issuedByMemberId?: number | null;
  issuerDisplayName?: string | null;
  issuerLogoUrl?: string | null;
  hasPdfFile?: boolean;
};

export type PublicCredentialSection = {
  documentType: number;
  label: string;
  items: PublicCredential[];
};

export type PublicCredentialWallet = {
  sections: PublicCredentialSection[];
};

export type DocumentActivityItem = {
  hash: string;
  activityType: string;
  txHash?: string | null;
  blockNumber?: number | null;
  memberId?: number | null;
  timestamp: string;
  ownerAddress?: string | null;
  fromFallback: boolean;
  cid?: string | null;
  hasPdfFile?: boolean;
};

/** Result of POST /api/documents/verify-document. Status: 0=Pending, 1=Confirmed, 2=Revoked; null if never issued. */
export type VerifyResult = {
  hash: string;
  isAuthentic: boolean;
  isRevoked: boolean;
  status?: number | null;
  message: string;
  transactionHash?: string | null;
  blockNumber?: number | null;
  blockTimestamp?: string | null;
  networkName?: string | null;
  issuerAddress?: string | null;
  issuedByMemberId?: number | null;
  issuerDisplayName?: string | null;
};

export type DocumentVerifyByHashResult = {
  hash: string;
  isAuthentic: boolean;
  isRevoked: boolean;
  status?: number | null;
  message: string;
  transactionHash?: string | null;
  blockNumber?: number | null;
  networkName?: string | null;
};

export type UploadDocumentParams = {
  documentType: string;
  owner: string;
  file?: File | null;
  periodFrom?: string;
  periodTo?: string;
  title?: string;
};
