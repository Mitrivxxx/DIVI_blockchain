export type InstitutionListItem = {
  memberId: number;
  institutionName: string;
  description?: string | null;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  country?: string | null;
  taxId?: string | null;
  updatedAt: string;
  ethereumAddress?: string | null;
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

export type IssuerOnChainVerifyResult = {
  ethereumAddress: string;
  isIssuer: boolean;
  networkName: string;
  message: string;
};

export interface IssuerRoleApplication {
  institutionName: string;
  ethereumAddress: string;
  email: string;
  description: string;
}

export type IssuerApplicationListDto = {
  id: number;
  institutionName: string;
  ethereumAddress: string;
  status: string;
};
