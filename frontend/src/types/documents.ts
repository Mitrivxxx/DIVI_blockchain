/** Mirrors backend DocumentListItemDto (camelCase JSON). */
export type DocumentListItem = {
  hash: string;
  issuer: string;
  issuedAt: string;
  cid?: string;
  documentType?: number;
  txHash?: string | null;
  blockNumber?: number;
  status?: number;
  ownerAddress?: string | null;
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

export const documentTypeLabel = (documentType: number | null | undefined): string => {
  switch (documentType) {
    case 0:
      return 'Education';
    case 1:
      return 'Professional certificates';
    case 2:
      return 'Employment documents';
    case 3:
      return 'License';
    case 4:
      return 'Other';
    default:
      return '—';
  }
};

export const shortHex = (value: string | null | undefined, head = 10, tail = 8): string => {
  if (!value) return '—';
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
};
