export type { ProfileData } from "@/modules/identity";

export type ProfileProps = {
  userRole?: string | null;
  walletAddress?: string | null;
};

export type ProfileExternalLinks = {
  linkedInUrl: string;
  githubUrl: string;
  websiteUrl: string;
};

export type EditableField = "name" | "email" | "bio";

export type MemberSearchResult = {
  memberId: number;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  ethereumAddress: string;
  role?: string | null;
  avatarUrl?: string | null;
};

export type PublicMemberProfile = {
  memberId?: number | null;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  ethereumAddress?: string | null;
  role?: string | null;
  bio?: string | null;
  linkedInUrl?: string | null;
  githubUrl?: string | null;
  websiteUrl?: string | null;
  avatarUrl?: string | null;
  createdAt?: string | null;
};

export type FollowTarget = {
  memberId: number;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  ethereumAddress?: string | null;
  avatarUrl?: string | null;
};
