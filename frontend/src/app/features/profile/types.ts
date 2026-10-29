import type { DocumentListItem } from "@/types/documents";

export type ProfileProps = {
  userRole?: string | null;
  walletAddress?: string | null;
};

export type ProfileData = {
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  ethereumAddress?: string | null;
  role?: string | null;
  email?: string | null;
  bio?: string | null;
  createdAt?: string | null;
  avatarUrl?: string | null;
};

export type EditableField = "name" | "email" | "bio";

/** Owner-owned documents from GET /api/documents/owner/{address}. */
export type OwnerCertificate = DocumentListItem;

export type CredentialVisibility = "private" | "unlisted" | "public";

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

/** Public share / portfolio item (no CID). */
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
};

export type PublicCredentialSection = {
  documentType: number;
  label: string;
  items: PublicCredential[];
};

export type PublicCredentialWallet = {
  sections: PublicCredentialSection[];
};

export type IssuerInstitutionProfile = {
  memberId: number;
  institutionName: string;
  description?: string | null;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  country?: string | null;
  taxId?: string | null;
  updatedAt: string;
};

export type UpdateIssuerInstitutionProfile = {
  institutionName?: string;
  description?: string | null;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  country?: string | null;
  taxId?: string | null;
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
};
