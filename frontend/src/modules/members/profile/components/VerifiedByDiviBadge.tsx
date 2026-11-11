import verifiedIcon from "@/assets/icons/verified_width_divi.svg";

const ISSUER_LIKE = new Set(["issuer", "admin", "owner", "1", "2", "4"]);

export const isIssuerLikeRole = (role: string | null | undefined): boolean => {
  if (!role) return false;
  return ISSUER_LIKE.has(role.trim().toLowerCase());
};

/** Verified-issuer mark next to the profile name; hover shows Polish tooltip. */
const VerifiedByDiviBadge = ({ className = "" }: { className?: string }) => (
  <span
    className={`inline-flex shrink-0 align-middle ${className}`}
    title="Zweryfikowany przez DIVI"
  >
    <img
      src={verifiedIcon}
      alt="Zweryfikowany przez DIVI"
      className="size-5 sm:size-6"
    />
  </span>
);

export default VerifiedByDiviBadge;
