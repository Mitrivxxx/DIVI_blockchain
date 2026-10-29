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

export const shortHex = (value: string | null | undefined, head = 10, tail = 8): string => {
  if (!value) return '—';
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
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
