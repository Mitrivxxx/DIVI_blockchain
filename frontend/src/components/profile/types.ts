export type ProfileProps = {
  userRole?: string | null;
  walletAddress?: string | null;
};

export type ProfileData = {
  name?: string | null;
  ethereumAddress: string;
  role?: string | null;
  email?: string | null;
  bio?: string | null;
  createdAt?: string | null;
  avatarUrl?: string | null;
};

export type EditableField = "name" | "email" | "bio";
export type ProfileTab = "profile" | "certyfikat" | "transactions";
