# Frontend AGENTS — React 19 + Vite 7

Short SPA context. Broader project overview: `../AGENTS.md`. Hard conventions: `.cursor/rules/frontend.mdc`. UI skill: `.cursor/skills/frontend-development/`.

## Role

UI for login, document issuing/verification, and profile / issuer-role management. Talks to backend via REST (`/api` proxy in dev). Web3: ethers.js 6 + MetaMask.

## `src/` layout

| Path | Contents |
| ---- | -------- |
| `app/` | Router, layout, auth pages, features |
| `app/features/` | Feature folders: `hooks/`, `components/`, `api/` + main component |
| `app/features/navigation/routes.ts` | App routes / primary nav / role helpers |
| `app/layout/` | `MainLayout` + `AppHeader` (authenticated shell) |
| `service/` | `Web3AuthContext`, JWT helpers |
| `shared/` | Shared UI (`shared/ui`, Verify, Header, Notify) |
| `public/` | Marketing landing (unauthenticated) at `/public` |
| `styles/` | Tailwind theme + auth CSS globals |
| `types/` | API types |

## Assumptions

- Alias `@` → `src/`. Bundler: Vite 7, port **3000**, proxy `/api` → backend.
- Routing: React Router 7. Marketing `/public`, auth `/auth|/login|/register`, authenticated app at `/` (+ `/network`, `/institutions`, `/i/:memberId`, `/verify`, `/profile`, …). Legacy `/app/:path` redirects to new paths. `/share/:token` public credential smoke page.
- Mount: always `#root`; Tailwind always loaded. Auth pages keep plain CSS (`auth/*.css` + `app/style/`).
- Primary header nav: Strona główna `/`, Moja sieć `/network`, Instytucje `/institutions`. Header `app-search` searches members via `GET /api/profiles/search?q=` (name or ETH); results open `/u/:ethereumAddress` (own address → `/profile`).
- Profile dropdown: Wyświetl profil, Zweryfikuj teraz, Moje dokumenty; user → **Chcę być issuerem**; issuer/admin/owner → upload / issued (+ notify for admin/owner); Wyloguj → `/public`.
- Guest on protected routes → `/public`. Post-login → `/`. Unknown shell paths redirect to `/`; `/u/:ethereumAddress` and `/i/:memberId` are known shell paths (`isKnownAppPath`).
- Missing backend/blockchain capabilities are marked with red `MissingBackendNote` (social feed).
- Moja sieć `/network`: `GET /api/profiles` — all members/roles; cards link to `/u/:address` when ETH address exists.
- Instytucje `/institutions`: catalog cards link to issuer **member** profile `/u/:eth` when ETH exists (`/i/:memberId` redirects there). Issuer = the company; company facts (Witryna / Branża / Siedziba) live under `/u/…` → Informacje. Credential issuer links also go to `/u/:issuerAddress`.
- Public member page: `/u/:ethereumAddress` (`PublicProfile.tsx`) — hero with **Obserwuj** + **Zweryfikuj issuera** + `ProfileNavTabs` (Informacje / Dokumenty i certyfikaty / Followers). Own `/profile` uses the same tabs; verify lives in the hero actions.
- Own `/profile` public/private toggle (local UI): **public** shows e-mail (+ traditional account fields); **private** = Web3-only (hides e-mail). Documents, activity, and issuer institution form stay visible in both modes.
- Documents list DTO: `src/types/documents.ts` (`DOCUMENT_TYPE_SECTIONS`, `isMetadataDocumentType`, `hasDocumentPdfFile`, `formatDocumentPeriod`). APIs: `features/documents/api/documentsApi.ts`. PDF preview: `openDocumentPdfInNewTab` (`GET /api/documents/{hash}/file`) — shown as **Pokaż dokument** on profile credentials, Moje dokumenty, Wystawione, Historia (only when CID is a real IPFS file, not `meta:`).
- Upload form order: type → owner → PDF **or** period dates (Education/Experience hide file picker). Metadata types also require `title`: Education → **Tytuł / kierunek**, Experience → **Stanowisko**.
- Profile layout: LinkedIn-style **ProfileHeroPanel** + **ProfileNavTabs** — `/profile` and `/u/…`: `Informacje` | `Dokumenty i certyfikaty` | `Followers` | `Historia transakcji`. Public historia/credentials use `hasPdfFile` + `GET /api/documents/{hash}/file` (public visibility) for **Pokaż dokument**. No separate „pełny profil instytucji” — issuer firm fields live in Informacje. AppHeader is sticky. `avatarUrl` is a public MinIO object URL. Session restore via `POST /Auth/refresh`.
- Verify (app + public shared): `isAuthentic` / `isRevoked` / `status`.
- State: Context + local hooks (no Redux/Zustand).
- Styles: authenticated shell + landing use Tailwind v4 (`.landing` / `.app-shell` scoped reset in `styles/tailwind.css`). Tokens: `brand`/`brand-pink`, `canvas`, `hairline`, `shadow-soft`, Figtree. Shared primitives: `src/shared/ui` (`LogoLink`, `Container`, `buttonDark`/`buttonLight`, `GradientButton`, `AppCard`, `MissingBackendNote`).
- Public landing: OriginX-style sections under `src/public/main-page/` (incl. `#profiles` — credential wallet / public `/u/…` + share visibility). Landing `./ui` re-exports `@/shared/ui`. Header/footer anchors: verify, how-it-works, issuers, profiles, faq.
- **Style skill:** `.cursor/skills/frontend-development/` applies to the whole frontend UI (landing, app-shell, features, shared) — not only `/public`.
- `src/shared/verify` (landing hero); app uses `features/Verify`.
- New authenticated page: feature folder → route in `App.tsx` under `MainLayout` → optional entry in `navigation/routes.ts` / `AppHeader`.

## Key files

- `src/app/frontend.tsx` — entry (`#root`)
- `src/app/App.tsx` — router
- `src/app/layout/MainLayout.tsx` / `AppHeader.tsx` — authenticated chrome
- `src/app/features/navigation/routes.ts` — paths / roles
- `src/shared/ui/index.tsx` — shared Tailwind primitives
- `src/app/features/profile/components/ProfileHeroPanel.tsx` — identity hero shell (cover / avatar / meta / actions / tabs)
- `src/app/features/profile/components/ProfileNavTabs.tsx` — underline section tabs
- `src/app/features/issuedDocuments/IssuedDocuments.tsx` — issuer list + revoke
- `src/service/Web3AuthContext.tsx` — wallet / sign-in
- `vite.config.ts` — Vite + proxy

## Env

Vars with `VITE_` prefix (e.g. `VITE_API_URL`). `vite.config.ts` also reads `process.env` (`PORT`, `VITE_PROXY_TARGET`) so Aspire can inject them. Proxies `/api` and `/Auth` to the backend.

## After changes in this layer

Update this file (and root `AGENTS.md` if routing/architecture changes). Keep AGENTS in English.
