export type AppRouteKey =
  | "home"
  | "network"
  | "institutions"
  | "issuerRole"
  | "upload"
  | "issuedDocuments"
  | "myDocuments"
  | "verify"
  | "profile"
  | "help"
  | "notify";

export type PrimaryNavKey = "home" | "network" | "institutions";

export interface AppRoute {
  key: AppRouteKey;
  label: string;
  path: string;
}

/** Primary header center nav */
export const primaryNav: { key: PrimaryNavKey; label: string; path: string }[] = [
  { key: "home", label: "Strona główna", path: "/" },
  { key: "network", label: "Moja sieć", path: "/network" },
  { key: "institutions", label: "Instytucje", path: "/institutions" },
];

const routePathByKey: Record<AppRouteKey, string> = {
  home: "/",
  network: "/network",
  institutions: "/institutions",
  issuerRole: "/issuer-role",
  upload: "/upload",
  issuedDocuments: "/issued-documents",
  myDocuments: "/my-documents",
  verify: "/verify",
  profile: "/profile",
  help: "/help",
  notify: "/notifications",
};

const routeKeyByPath = Object.entries(routePathByKey).reduce<Record<string, AppRouteKey>>(
  (acc, [key, path]) => {
    acc[path] = key as AppRouteKey;
    return acc;
  },
  {},
);

export const getRoutePath = (key: AppRouteKey): string => routePathByKey[key];

export const getRouteKeyByPath = (pathname: string): AppRouteKey | undefined => {
  if (pathname === "/" || pathname === "") {
    return "home";
  }
  return routeKeyByPath[pathname];
};

/** Public member profile `/u/:ethereumAddress` — dynamic, not in the static map. */
export const isPublicProfilePath = (pathname: string): boolean => /^\/u\/[^/]+$/.test(pathname);

/** Shell paths that should render inside MainLayout (static routes + public profile). */
export const isKnownAppPath = (pathname: string): boolean =>
  Boolean(getRouteKeyByPath(pathname)) || isPublicProfilePath(pathname);

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

/** Legacy /app/:tabPath → new absolute path */
export const legacyAppPathRedirect = (tabPath?: string): string => {
  if (!tabPath || tabPath === "dashboard") {
    return "/";
  }
  const legacyMap: Record<string, string> = {
    network: "/network",
    institutions: "/institutions",
    "issuer-role": "/issuer-role",
    upload: "/upload",
    "issued-documents": "/issued-documents",
    "my-documents": "/my-documents",
    verify: "/verify",
    profile: "/profile",
    help: "/help",
    notifications: "/notifications",
  };
  return legacyMap[tabPath] ?? "/";
};
