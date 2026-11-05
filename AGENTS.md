# AGENTS.md — Guidance for AI working on DIVI

## What DIVI is

DIVI is a fullstack app for issuing and verifying documents (diplomas, certificates, licenses) with Ethereum as the source of truth. Files live on IPFS (Pinata); their SHA-256 hash is stored in a smart contract on Sepolia. Auth supports email/password, Ethereum wallet (Web3 sign-in), and Google OAuth.

## Per-layer AGENTS (read when working in that folder)

| Layer | File | Contents |
| ----- | ---- | -------- |
| Backend | [`backend/AGENTS.md`](backend/AGENTS.md) | API, DI, auth, services, debt |
| Frontend | [`frontend/AGENTS.md`](frontend/AGENTS.md) | SPA, routing, features, Web3 UI |
| Blockchain | [`blockchain/AGENTS.md`](blockchain/AGENTS.md) | Contract, Hardhat, ABI sync |

**AI duty:** after every completed task, update the relevant `AGENTS.md` (and this file if architecture/flow changes). Keep descriptions short. Write AGENTS files in English.

## Cursor project rules (hard conventions)

Layer rules load via globs (not always-on). Do not duplicate their checklists here.

| Layer | Rule | Globs |
| ----- | ---- | ----- |
| Frontend | [`.cursor/rules/frontend.mdc`](.cursor/rules/frontend.mdc) | `frontend/**/*.{ts,tsx,css}` |
| Backend | [`.cursor/rules/backend.mdc`](.cursor/rules/backend.mdc) | `backend/**/*.{cs,csproj,json}` |
| Blockchain | [`.cursor/rules/blockchain.mdc`](.cursor/rules/blockchain.mdc) | `blockchain/**/*.{sol,js,ts,json}` |
| AGENTS hygiene | [`.cursor/rules/agents-md-maintenance.mdc`](.cursor/rules/agents-md-maintenance.mdc) | alwaysApply |

UI visual system: skill [`.cursor/skills/frontend-development/`](.cursor/skills/frontend-development/).

## Architecture — three independent layers

```
aspire/DIVI.AppHost  → orchestrates postgres + backend + frontend (loads root .env.example)
frontend/ (React 19 + Vite 7 + TypeScript)
 ↕ HTTP/REST (proxy /api → backend)
backend/  (ASP.NET Core .NET 8 + EF Core 8 + PostgreSQL 16)
 ↕ Nethereum RPC
blockchain/ (Solidity 0.8.28 + Hardhat 3, Sepolia)
```

Stack/routing/styling/DI details: layer `*/AGENTS.md` + matching `.cursor/rules/*.mdc`.

## Key files — navigation map

| Purpose | File |
| ------- | ---- |
| Backend entry | `backend/Program.cs` |
| DI registration | `backend/Extensions/ServiceCollectionExtensions.cs` |
| Middleware pipeline | `backend/Extensions/ApplicationBuilderExtensions.cs` |
| DB context | `backend/Data/AppDbContext.cs` |
| Config options | `backend/Infrastructure/Configuration/*.cs` |
| Document upload | `backend/Services/Documents/DocumentService.cs` |
| Credential wallet | `backend/Services/Credentials/CredentialWalletService.cs` |
| Document activity | `backend/Services/Activity/DocumentActivityService.cs` |
| Issuer institution profile | `backend/Services/Issuers/IssuerProfileService.cs` |
| Document verification | `backend/Services/DocumentVerification/DocumentVerificationService.cs` |
| Profile avatars (MinIO) | `backend/Infrastructure/Minio/`, `backend/Services/GetProfile/` |
| Blockchain interaction | `backend/Services/Blockchain/BlockchainService*.cs` |
| JWT + auth | `backend/Services/Auth/JwtService.cs`, `AuthService.cs` |
| Issuer workflow | `backend/Services/Issuers/IssuerApplicationService.cs` |
| Smart contract | `blockchain/contracts/DocumentIssuer.sol` |
| Solidity types | `blockchain/contracts/DocumentTypes.sol` |
| Frontend entry | `frontend/src/app/frontend.tsx` |
| Router | `frontend/src/app/App.tsx` |
| App routes / nav | `frontend/src/app/features/navigation/routes.ts` |
| App header | `frontend/src/app/layout/AppHeader.tsx` |
| Shared Tailwind UI | `frontend/src/shared/ui/index.tsx` |
| Vite config | `frontend/vite.config.ts` |
| Web3 context | `frontend/src/service/Web3AuthContext.tsx` |
| Docker Compose | `docker-compose.yml` |
| Aspire AppHost | `aspire/DIVI.AppHost/AppHost.cs` |
| Aspire defaults | `aspire/DIVI.ServiceDefaults/` |
| Env vars | `.env` (gitignored), `.env.example` (Aspire + shared config; committed test values) |

## Data models — relationships

```
MemberRole (1) ←——— (*) Member
   Id: 1=admin, 2=issuer, 3=user, 4=owner

Member — main user entity
 ├── may have EthereumAddress (Web3 login)
 ├── may have Email + Password (classic login)
 ├── may have GoogleSub (Google login)
 ├── AvatarUrl → public MinIO object URL (bucket `divi-avatars`; no blob columns)
 └── may have any one or a combination of the above

IssuerApplication — issuer role application (separate table)
   Status: Pending → Approved/Rejected
   On approve (admin or owner): addIssuer(ethereumAddress) + Member.MemberRoleId = issuer
     + upsert IssuerProfile (InstitutionName, Description from application)
   Applicant must already exist as Member with that EthereumAddress

IssuerProfile — 1:1 with Member (institution identity, off-chain)
   InstitutionName, Description?, LogoUrl?, WebsiteUrl?, Country?, TaxId?

Document — off-chain mirror of issued docs (PK = Hash)
 Cid, IssuerAddress (on-chain/hot-wallet), OwnerAddress, IssuedByMemberId?, DocumentType,
 TxHash, BlockNumber, Status, IssuedAt, PeriodStart?, ExpiresAt?, Title? (Education degree/field; Experience job title),
 Visibility (private|unlisted|public), ShareToken? (for unlisted share links)

DocumentActivity — audit log (issue / revoke)
   DocumentHash, ActivityType (Issued|Revoked), TxHash?, BlockNumber?, MemberId?, CreatedAt

Nonce — one-time Web3 sign-in nonce (TTL 5 min, cleanup via background job)

BlacklistedToken — invalidated JWT after logout (Jti + ExpiryDate)
```

## Business flows — main processes

### 1. Registration and login
- **Email**: POST `/Auth/register` → POST `/Auth/login` → JWT in cookies
- **Web3**: POST `/Auth/nonce` → user signs nonce in MetaMask → POST `/Auth/verify` → JWT in cookies. Auto-creates Member if missing
- **Google**: POST `/Auth/google` with ID token → Google API verify → auto-creates Member if missing

### 2. Document upload (issuer role required)
- Form order: documentType → owner → PDF **or** period dates (Education/Experience: no PDF)
- PDF types: SHA-256 → Pinata → `issueDocument()` → `Documents` row (max 5 MB PDF)
- Education/Experience: hash of `type|owner|title|from|to`, CID `meta:{hash}`, `PeriodStart`/`ExpiresAt`, `Title` (Education: tytuł/kierunek; Experience: stanowisko), no Pinata
- Lists (`/api/documents/owner/...`, `/issuer/...`, `/issued-by-me`) read from PostgreSQL
- PDF preview: `GET /api/documents/{hash}/file` (not for metadata-only docs)

### 3. Document verification (public)
- Frontend sends PDF
- Backend: SHA-256 → resolve status (DB / chain) → tx metadata from `Documents` (fallback: event scan for legacy)
- Return `IsAuthentic` (Confirmed), `IsRevoked`, `Status`, + blockchain data
- Revoke: `DELETE /api/documents/{hash}/revoke` (issuer of that upload / admin / owner) → on-chain + DB Status=Revoked

### 4. Issuer role application
- User (`Roles = user`) submits form (institution, ETH address, email, description)
- Admin or owner sees pending list → approve/reject
- Approve: backend calls `addIssuer()` on contract, sets `MemberRoleId = issuer`, seeds `IssuerProfile`, updates application status
- Issuer updates institution via `GET/PATCH /api/issuer/profile` (logo URL, website, country, NIP/KRS)
- Document/verify/credential DTOs: `IssuerDisplayName` from profile (+ `IssuedByMemberId`); credential `IssuerLogoUrl` = institution LogoUrl or issuing member AvatarUrl; `IssuerAddress` remains hot-wallet
- Owner manages admins via `POST/DELETE /api/admins` (DB + on-chain `addAdmin`/`removeAdmin`)

### 5. Credential wallet / portfolio
- Owner: `GET /api/profiles/me/credentials` → `{ sections: [{ documentType, label, items }] }` (always 5 type sections); `PATCH .../visibility` (`private`|`unlisted`|`public`)
- Unlisted → `ShareToken`; public share `GET /api/share/{token}` (Confirmed only, no CID)
- Public portfolio: `GET /api/profiles/{ethereumAddress}/credentials` (same section shape; Confirmed + public, no CID)
- Network directory: `GET /api/profiles` (auth) → Moja sieć lists all members/roles; Member search: `GET /api/profiles/search?q=` (auth; name or ETH address) → header dropdown; public card `GET /api/profiles/{address}`; UI `/u/:address`
- Frontend: profile Certyfikat tab shows sections stacked; `/share/:token`

### 6. Document activity / transaction history
- On issue and revoke: append `DocumentActivities` row (hash, type, txHash, block?, memberId, timestamp)
- `GET /api/profiles/me/activity` — DB feed for member (actions + owned/issued docs); fallback Issued from `Documents` when no activity row
- Frontend: profile Transactions tab

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

Follow the matching `.cursor/rules/{frontend,backend,blockchain}.mdc` when editing that layer. Quick pointers:

- **New endpoint:** DTO → service (+ `AddApplication`) → controller (`/Auth` or `/api/...`). See `backend.mdc`.
- **New table:** Model → `DbSet` → migration (`dotnet ef migrations add … -p backend`).
- **New FE feature:** `features/<name>/` → `App.tsx` + `routes.ts` / header; Tailwind + `@/shared/ui`. See `frontend.mdc` + skill.
- **Contract change:** compile → copy ABI → `IBlockchainService*` → env address. See `blockchain.mdc`.

### Notes
- Root `.env` — do NOT commit. Prefer `.env.example` for shared/Aspire config.
- Frontend reads `VITE_` / `PORT` from process env (Aspire) or parent-dir env files.
- `Member.Email` is unique (nullable for Web3-only); register normalizes to lowercase.

## Running tests

No formal test suite. No test projects in the solution. Manual testing via Swagger (dev) or frontend.

## Aspire (preferred local run)

```bash
dotnet run --project aspire/DIVI.AppHost
```

Starts PostgreSQL (container) + pgAdmin (`http://localhost:5050`), **MinIO-compatible** object store via `soldevelo/minio` (S3 API `9000`, console `9001`, named volume `divi-aspire-minio` — data persists across Aspire restarts; containers themselves are removed on stop), backend (5021), frontend (Vite via `AddViteApp`), dashboard. Config from root `.env.example`. Profile avatars → bucket `divi-avatars` (public read). Official `minio/minio` / `quay.io/minio` images are no longer anonymously pullable.

## Docker Compose — profiles

- `docker compose --profile dev up` — DB + MinIO + backend + frontend (Vite HMR)
- `docker compose --profile prod up` — DB + MinIO + backend + frontend (Nginx SPA)
- `docker compose --profile tools up` — Hardhat node + blockchain tools shell
