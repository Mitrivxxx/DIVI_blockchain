# Frontend AGENTS

React 19 + Vite 7 SPA (Tailwind v4, React Router 7, ethers 6 / MetaMask). Mandatory rules: `.cursor/rules/frontend.mdc`. UI system: `.cursor/skills/frontend-development/`.

## Structure (map) — modular monolith

```
frontend/src/
  app/          # frontend.tsx (entry), App.tsx (router), layout/ (MainLayout, AppHeader), pages/ (Home, Help)
  modules/
    identity/ members/ issuers/ documents/   # index.ts + api.ts + types.ts + <slice>/
  shared/       # ui/ (Tailwind primitives), components/ (FilePicker, CopyField), lib/ (api, format, routes)
  public/       # landing /public
  styles/ assets/
```

## Modules

| Module | Slices | Routes | Backend APIs |
| ------ | ------ | ------ | ------------ |
| identity | `session/` (Web3AuthContext, JWT refresh, current member), `login/`, `role/` | `/auth`, `/login`, `/register` | `/Auth/*`, `/api/user-role`, `GET /api/GetProfile` |
| members | `profile/`, `public-profile/`, `network/` | `/profile`, `/u/:address`, `/network` | `/api/GetProfile/*` (writes), `/api/profiles` (list/search/card/follow) |
| issuers | `institutions/`, `application/`, `approvals/`, `institution-profile/` | `/institutions`, `/i/:memberId`, `/issuer-role`, `/notifications` | `/api/institutions`, `/api/issuer*`, `/api/profiles/*/institution`, `/verify-issuer` |
| documents | `upload/`, `my-documents/`, `issued/`, `verify/` (page + landing `widget/`), `credentials/` | `/upload`, `/my-documents`, `/issued-documents`, `/verify`, `/share/:token` | `/api/documents/*`, `/api/share/*`, `/api/profiles/*/credentials`, `/activity` |

Dependencies: members → documents, issuers, identity; documents → identity; issuers → identity. Opposite of backend on purpose: the profile UI composes credentials and institution cards.

## Domain notes

- Auth: JWT in memory + httpOnly cookies; restore via `POST /Auth/refresh`. Email session flag `EMAIL_LOGIN_STORAGE_KEY`. Guest on shell routes → `/public`; unknown shell path → `/`.
- Roles (`identity` `isIssuerToolRole` / `isAdminReviewRole` / `isPlainUserRole`): user → issuer application; issuer/admin/owner → upload/issued; admin/owner → approvals.
- Documents: Education/Experience are metadata types (no PDF, `title` + period, CID `meta:`). PDF preview (`openDocumentPdfInNewTab`) only when `hasDocumentPdfFile`. Verify returns `isAuthentic` / `isRevoked` / `status`.
- Profile: own `/profile` and public `/u/:address` share `ProfileHeroPanel` + `ProfileNavTabs`. Credential visibility: `private` | `unlisted` (share token) | `public`.
- `avatarUrl` is a public MinIO URL (`resolveAvatarSrc`). Missing backend features → `MissingBackendNote`.

## Env

`VITE_API_URL` (default `http://localhost:5021` in dev). Vite reads `PORT` / `VITE_PROXY_TARGET` (Aspire) and proxies `/api` + `/Auth`. Dev port 3000.
