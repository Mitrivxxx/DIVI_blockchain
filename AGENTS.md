# AGENTS.md — Guidance for AI working on DIVI

## What DIVI is

DIVI is a fullstack app for issuing and verifying documents (diplomas, certificates, licenses) with Ethereum as the source of truth. Files live on IPFS (Pinata); their SHA-256 hash is stored in a smart contract on Sepolia. Auth supports email/password, Ethereum wallet (Web3 sign-in), and Google OAuth.

## Per-layer AGENTS (read when working in that folder)

| Layer | File | Contents |
| ----- | ---- | -------- |
| Backend | [`backend/AGENTS.md`](backend/AGENTS.md) | API, auth, services, **detailed backend flows**, debt |
| Frontend | [`frontend/AGENTS.md`](frontend/AGENTS.md) | SPA, routing, features, Web3 UI |
| Blockchain | [`blockchain/AGENTS.md`](blockchain/AGENTS.md) | Contract, Hardhat, ABI sync |

**AI duty:** after every completed task, update the relevant `AGENTS.md` (and this file if architecture/flow **map** changes). Keep descriptions short. Write AGENTS files in English.

## Cursor project rules (hard conventions)

Layer rules load via globs (not always-on). Do not duplicate their checklists here.

| Layer | Rule | Globs |
| ----- | ---- | ----- |
| Frontend | [`.cursor/rules/frontend.mdc`](.cursor/rules/frontend.mdc) | `frontend/**/*.{ts,tsx,css}` |
| Backend | [`.cursor/rules/backend.mdc`](.cursor/rules/backend.mdc) | `backend/**/*.{cs,csproj,json}` |
| Blockchain | [`.cursor/rules/blockchain.mdc`](.cursor/rules/blockchain.mdc) | `blockchain/**/*.{sol,js,ts,json}` |
| AGENTS hygiene | [`.cursor/rules/agents-md-maintenance.mdc`](.cursor/rules/agents-md-maintenance.mdc) | alwaysApply |
| Task verification | [`.cursor/rules/task-verification.mdc`](.cursor/rules/task-verification.mdc) | alwaysApply |

UI visual system: skill [`.cursor/skills/frontend-development/`](.cursor/skills/frontend-development/).

## Architecture — three independent layers

```
aspire/DIVI.AppHost  → orchestrates postgres + backend + frontend (loads root .env.example)
frontend/ (React 19 + Vite 7 + TypeScript)
 ↕ HTTP/REST (proxy /api → backend)
backend/  (ASP.NET Core .NET 10 modular monolith — Modules: Identity, Members, Issuers, Documents;
           EF Core 8 pkgs + PostgreSQL 16, single AppDbContext)
 ↕ Nethereum RPC
blockchain/ (Solidity 0.8.28 + Hardhat 3, Sepolia)
```

Stack/routing/styling/DI details: layer `*/AGENTS.md` + matching `.cursor/rules/*.mdc`.  
**Backend endpoint & flow detail:** [`backend/AGENTS.md`](backend/AGENTS.md) only — not duplicated below.

## Key files — navigation map

| Purpose | File |
| ------- | ---- |
| Backend entry | `backend/Program.cs` |
| Host composition / DI | `backend/Host/ServiceCollectionExtensions.cs` |
| Middleware pipeline | `backend/Host/ApplicationBuilderExtensions.cs` |
| Module registration | `backend/Modules/{Module}/{Module}Module.cs` |
| DB context | `backend/Infrastructure/Persistence/AppDbContext.cs` |
| Config options | `backend/Infrastructure/Configuration/*.cs` |
| Document upload | `backend/Modules/Documents/Application/DocumentService.cs` |
| Credential wallet | `backend/Modules/Documents/Application/CredentialWalletService.cs` |
| Document activity | `backend/Modules/Documents/Application/DocumentActivityService.cs` |
| Document verification | `backend/Modules/Documents/Application/DocumentVerificationService.cs` |
| Issuer institution profile | `backend/Modules/Issuers/Application/IssuerProfileService.cs` |
| Issuer workflow | `backend/Modules/Issuers/Application/IssuerApplicationService.cs` |
| Profile avatars (MinIO) | `backend/Infrastructure/Minio/`, `backend/Modules/Members/Application/` |
| JWT + auth | `backend/Modules/Identity/Application/JwtService.cs`, `AuthService.cs` |
| Blockchain interaction | `backend/Infrastructure/Blockchain/BlockchainService*.cs` |
| Backend API tests | `tests/backend.Tests/` (factory + fakes in `Infrastructure/`) |
| Smart contract | `blockchain/contracts/DocumentIssuer.sol` |
| Solidity types | `blockchain/contracts/DocumentTypes.sol` |
| Frontend entry | `frontend/src/app/frontend.tsx` |
| Router | `frontend/src/app/App.tsx` |
| App routes / nav | `frontend/src/app/features/navigation/routes.ts` |
| Institutions catalog | `frontend/src/app/features/institutions/` · `GET /api/institutions` |
| Profile / institution hero UI | `frontend/src/app/features/profile/components/ProfileHeroPanel.tsx` |
| App header | `frontend/src/app/layout/AppHeader.tsx` |
| Shared Tailwind UI | `frontend/src/shared/ui/index.tsx` |
| Vite config | `frontend/vite.config.ts` |
| Web3 context | `frontend/src/service/Web3AuthContext.tsx` |
| Docker Compose | `docker-compose.yml` |
| Aspire AppHost | `aspire/DIVI.AppHost/AppHost.cs` |
| Aspire defaults | `aspire/DIVI.ServiceDefaults/` |
| Env vars | `.env` (gitignored), `.env.example` (Aspire + shared config; committed test values) |

## Data models — relationships (overview)

```
MemberRole (1) ←——— (*) Member
   Id: 1=admin, 2=issuer, 3=user, 4=owner

Member — Email? / Password? / EthereumAddress? / GoogleSub? / AvatarUrl (MinIO) / LinkedInUrl? / GithubUrl? / WebsiteUrl?
MemberFollow — FollowerMemberId → FollowingMemberId (observe)
IssuerApplication — Pending → Approved/Rejected → addIssuer + role issuer + IssuerProfile
IssuerProfile — 1:1 Member (InstitutionName, Description?, LogoUrl?, WebsiteUrl?, Country?, TaxId?)
Document — PK=Hash; Cid, IssuerAddress, OwnerAddress, IssuedByMemberId?, type, tx, status, visibility, ShareToken?
DocumentActivity — Issued|Revoked audit
Nonce — Web3 sign-in (TTL 5 min)
BlacklistedToken — logout JTI blacklist
```

Full field/API semantics: [`backend/AGENTS.md`](backend/AGENTS.md).

## Business flows — overview

Cross-layer summaries only. **Endpoint-level detail → [`backend/AGENTS.md`](backend/AGENTS.md).**

1. **Auth** — email register/login, Web3 nonce+sign, or Google ID token → JWT cookies.
2. **Issue document** — issuer uploads PDF (Pinata + chain) or Education/Experience metadata (`meta:` CID) → `Documents` + activity.
3. **Verify / revoke** — hash PDF → authenticity/revocation; revoke updates chain + DB.
4. **Become issuer** — user applies → admin/owner approve → on-chain `addIssuer` + DB role + `IssuerProfile`.
5. **Credential wallet** — visibility private/unlisted/public; share token; public `/u/:address` + `/share/:token`.
6. **Activity** — issue/revoke history on profile Transactions tab.

## Ports and URLs

| Service | Dev | Prod (Docker) |
| ------- | --- | ------------- |
| Frontend | http://localhost:3000 | http://localhost:8080 |
| Backend API | http://localhost:5021 | http://localhost:5021 |
| PostgreSQL | localhost:5432 | localhost:5432 |
| MinIO S3 / console | localhost:9000 / 9001 | localhost:9000 / 9001 |
| Hardhat node | localhost:8545 | localhost:8545 |
| Swagger | localhost:5021/swagger | unavailable |

## Tips for AI

Follow `.cursor/rules/{frontend,backend,blockchain}.mdc` for the layer you edit, and **always** `.cursor/rules/task-verification.mdc` before finishing.

- **New endpoint / table / contract change:** see the matching layer rule + layer `AGENTS.md`.
- Root `.env` — do NOT commit. Prefer `.env.example`.
- Frontend env: `VITE_` / `PORT` from process env (Aspire) or parent-dir env files.

## Running tests

Backend: `dotnet test tests/backend.Tests` — HTTP contract tests (xUnit + `WebApplicationFactory`, EF InMemory, fake blockchain/Pinata/MinIO; no Docker or network). Details: [`backend/AGENTS.md`](backend/AGENTS.md).  
Frontend / blockchain: no test suite — manual checks via Swagger (dev) or UI.  
Per `task-verification.mdc`: always report what you built/verified and what you did **not** test.

## Aspire (preferred local run)

```bash
dotnet run --project aspire/DIVI.AppHost
```

Starts PostgreSQL (container) + pgAdmin (`http://localhost:5050`), **MinIO-compatible** object store via `soldevelo/minio` (S3 API `9000`, console `9001`, named volume `divi-aspire-minio` — data persists across Aspire restarts; containers themselves are removed on stop), backend (5021), frontend (Vite via `AddViteApp`), dashboard. Config from root `.env.example`. Profile avatars → bucket `divi-avatars` (public read). Official `minio/minio` / `quay.io/minio` images are no longer anonymously pullable.

## Docker Compose — profiles

- `docker compose --profile dev up` — DB + MinIO + backend + frontend (Vite HMR)
- `docker compose --profile prod up` — DB + MinIO + backend + frontend (Nginx SPA)
- `docker compose --profile tools up` — Hardhat node + blockchain tools shell
