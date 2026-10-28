# Frontend AGENTS — React 19 + Vite 7

Short SPA context. Broader project overview: `../AGENTS.md`.

## Role

UI for login, document issuing/verification, and profile / issuer-role management. Talks to backend via REST (`/api` proxy in dev). Web3: ethers.js 6 + MetaMask.

## `src/` layout

| Path | Contents |
| ---- | -------- |
| `app/` | Router, layout, auth pages, features |
| `app/features/` | Feature folders: `hooks/`, `components/`, `api/` + main component |
| `app/features/sidebar/tabs.ts` | App tab definitions |
| `service/` | `Web3AuthContext`, JWT helpers |
| `shared/` | Shared UI (Verify, Header, Notify) |
| `public/` | Landing (unauthenticated) |
| `styles/` | Global styles |
| `types/` | API types |

## Assumptions

- Alias `@` → `src/`. Bundler: Vite 7, port **3000**, proxy `/api` → backend.
- Routing: React Router 7. Public `/`, auth `/auth|/login|/register`, app `/app/:tabPath?`.
- Tabs: `dashboard`, `upload`, `issuedDocuments`, `myDocuments`, `verify`, `issuerRole`, `profile`, `help` (+ `notify` via header).
- Role-gated sidebar: `user` (issuer apply + own docs); `issuer`/`admin`/`owner` (upload + issued-by-me revoke + own docs). Notify review: `admin`|`owner`.
- Documents list DTO: `src/types/documents.ts` (`DocumentListItem` + status/type helpers). APIs: `features/documents/api/documentsApi.ts` (`owner`, `issued-by-me`, `revoke`).
- Verify (app + public shared): response uses `isAuthentic` / `isRevoked` / `status` — revoked ≠ missing.
- State: no Redux/Zustand — Context + local hooks.
- Styles: SCSS modules + global for `/app` and auth pages. Tailwind v4 (`@tailwindcss/vite`, `src/styles/tailwind.css`, imported last in `frontend.tsx`) is used only by the landing and `src/shared/verify`.
- Tailwind setup: theme layered, utilities **unlayered** (so they beat unlayered global SCSS like `_base.scss` `h1`), **no preflight** — a minimal reset is scoped to `:where(.landing)`. Tokens: `brand`/`brand-pink` (coral→pink gradient), `canvas`, `hairline`, `shadow-soft`, font Figtree.
- Public landing (`src/public/main-page/MainPage.tsx` + `components/Landing*.tsx`, OriginX-style): own header (nav anchors, login/register, gradient "Podłącz portfel" → MetaMask sign-in), hero with shared `Verify` in a framed card (`#verify`, main element), stack strip, how-it-works, issuers, features, use cases, FAQ, CTA, footer. Does not use shared `Header`.
- `src/shared/verify` (landing only; `/app` uses `features/Verify`): Tailwind dropzone/result/file/blockchain cards; request failures show "BŁĄD WERYFIKACJI" (not a hash mismatch).
- API: Axios; files under `features/*/api/`.
- New feature: folder in `features/` → tab in `tabs.ts` → render in `MainLayout`.

## Key files

- `src/app/frontend.tsx` — entry
- `src/app/App.tsx` — router
- `src/app/features/sidebar/tabs.ts` — tabs / paths
- `src/app/features/issuedDocuments/IssuedDocuments.tsx` — issuer list + revoke
- `src/types/documents.ts` — document list / status helpers
- `src/service/Web3AuthContext.tsx` — wallet / sign-in
- `vite.config.ts` — Vite + proxy

## Env

Vars with `VITE_` prefix (e.g. `VITE_API_URL`). `vite.config.ts` also reads `process.env` (`PORT`, `VITE_PROXY_TARGET`) so Aspire can inject them. Proxies `/api` and `/Auth` to the backend.

## After changes in this layer

Update this file (and root `AGENTS.md` if routing/architecture changes). Keep AGENTS in English.
