export const isIssuerToolRole = (role: string | null | undefined): boolean => {
  const normalized = role?.trim().toLowerCase();
  return (
    normalized === "issuer" ||
    normalized === "2" ||
    normalized === "admin" ||
    normalized === "1" ||
    normalized === "owner" ||
    normalized === "4"
  );
};

export const isAdminReviewRole = (role: string | null | undefined): boolean => {
  const normalized = role?.trim().toLowerCase();
  return normalized === "admin" || normalized === "1" || normalized === "owner" || normalized === "4";
};

export const isPlainUserRole = (role: string | null | undefined): boolean => {
  if (isIssuerToolRole(role)) return false;
  return true;
};
