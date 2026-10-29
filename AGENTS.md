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

## Architecture — three independent layers

```
aspire/DIVI.AppHost  → orchestrates postgres + backend + frontend (loads root .env.example)
frontend/ (React 19 + Vite 7 + TypeScript)
 ↕ HTTP/REST (proxy /api → backend)
backend/  (ASP.NET Core .NET 8 + EF Core 8 + PostgreSQL 16)
 ↕ Nethereum RPC
blockchain/ (Solidity 0.8.28 + Hardhat 3, Sepolia)
```

## Code conventions

### Backend (.NET 8)

- **Language**: C# 12, nullable reference types on, implicit usings
- **Pattern**: controller → service (EF Core used directly in services; no separate repo layer)
- **DI**: `backend/Extensions/ServiceCollectionExtensions.cs` — `AddApplication()` (services), `AddInfrastructure()` (DB, CORS, JWT, Pinata, MinIO avatars), `AddPresentation()` (controllers, Swagger)
- **Pipeline**: middleware in `backend/Extensions/ApplicationBuilderExtensions.cs`
- **Routing**: `[Route]` attributes. Auth under `/Auth`, rest under `/api/...`
- **Namespace**: `backend.*` (e.g. `backend.Controllers`, `backend.Services.Blockchain`)
- **Logging**: Serilog (structured). Some code still uses `Console.WriteLine` — migrate to Serilog
- **Passwords**: Argon2 via Konscious.Security.Cryptography (`backend/Utils/PasswordHasher.cs`)
- **JWT**: access token (15 min) + refresh token in httpOnly cookies. Blacklisting via `BlacklistedTokens`, checked in `OnTokenValidated`
- **Token from cookie OR header**: `OnMessageReceived` checks `Authorization: Bearer ...` first, then cookie `access_token`
- **Env**: root `.env.example` (fallback `.env`) via `DotNetEnv` in `Program.cs`; `DB_*` → `Database:*`. Blockchain/Pinata/JWT/MinIO may live in appsettings OR env (env wins). Profile avatars use MinIO (`MINIO_*` / `Minio__*`); document files stay on Pinata/IPFS.
- **Migrations**: EF Core, PostgreSQL. Seed: 4 roles (`admin`, `issuer`, `user`, `owner`) + one owner Member (address = contract deployer / `Blockchain__PrivateKey`)
- **Smart contract ABI**: `backend/Infrastructure/Contracts/DocumentIssuer.abi.json`, copied to output directory
- **App roles**: owner (superuser) → admin (approve issuer apps) → issuer (upload) → user (apply). JWT claim `ClaimTypes.Role`.

### Frontend (React 19 + TypeScript)

- **Bundler**: Vite 7, dev server port 3000 with proxy `/api` → backend
- **Routing**: React Router 7. Marketing `/public`, auth `/auth|/login|/register`, authenticated app at `/` (`/network`, `/institutions`, `/verify`, `/profile`, `/u/:ethereumAddress`, …). Legacy `/app/*` redirects. `/share/:token` public share.
- **App chrome**: `AppHeader` (logo, member search by name/ETH, primary nav, profile dropdown) — see `frontend/src/app/features/navigation/routes.ts`
- **State**: no Redux/Zustand. React Context (`Web3AuthContext`) + local hooks
- **Styling**: auth SCSS; landing (`.landing`) + app shell (`.app-shell`) use Tailwind v4 (shared `frontend/src/shared/ui`)
- **Web3**: ethers.js 6 + MetaMask. Context in `src/service/Web3AuthContext.tsx`
- **API**: Axios; base URL from `VITE_API_URL` or proxy. API files under feature `api/` folders
- **Feature layout**: each feature folder has `hooks/`, `components/`, `api/` + main component (e.g. `Upload.tsx`, `Verify.tsx`, `Profile.tsx`)
- **Alias**: `@` → `frontend/src/`

### Blockchain (Solidity)

- **Contract**: `DocumentIssuer.sol` + `DocumentTypes.sol` (library with enums and struct)
- **Network**: Sepolia testnet (chainId 11155111). Hardhat also supports localhost (8545) and edr-simulated
- **On-chain roles**: `owner` (deployer), `isAdmin` (owner-managed), `authorizedIssuers` (gates `issueDocument`; owner or admin manage via `addIssuer`/`removeIssuer`)
- **Document struct**: `issuer`, `documentOwner`, `issuedAt`, `cid`, `documentType`, `exists`, `status`
- **Document types (enum)**: Education(0), Experience(1), LicensesAndCertificates(2), Recommendation(3), HonorsAndAwards(4) — UI: Wykształcenie, Doświadczenie, Licencje i certyfikaty, Rekomendacja, Wyróżnienia i nagrody

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

### Adding a new endpoint
1. Create DTO in `backend/DTOs/`
2. Create service interface under the right `backend/Services/` folder
3. Implement the service
4. Register in `ServiceCollectionExtensions.cs` → `AddApplication()`
5. Create controller in `backend/Controllers/` with `[Route]`, `[Authorize]` as needed

### Adding a new model/table
1. Create class in `backend/Models/`
2. Add `DbSet<T>` in `AppDbContext`
3. Configure in `OnModelCreating` if needed
4. Generate migration: `dotnet ef migrations add MigrationName -p backend`

### Adding a new frontend feature
1. Create folder under `frontend/src/app/features/featureName/`
2. Add `hooks/`, `components/`, `api/`
3. Register route in `frontend/src/app/App.tsx` under `MainLayout`; add path in `navigation/routes.ts` / header if needed
4. Use Tailwind + `shared/ui` (`AppCard`, etc.) inside `.app-shell`

### Working with blockchain
- Contract ABI: `backend/Infrastructure/Contracts/DocumentIssuer.abi.json`
- Nethereum service: `backend/Services/Blockchain/BlockchainService*.cs` (partial class)
- New contract functions require ABI update + method on `IBlockchainService` + implementation
- Local testing: Hardhat node (`docker compose --profile tools up`)

### Notes
- Root `.env` — do NOT commit (in `.gitignore`). Prefer `.env.example` for shared/Aspire config.
- Backend loads `.env.example` (fallback `.env`) via `DotNetEnv` in `Program.cs`; maps `DB_*` → `Database:*`
- Frontend reads `VITE_` / `PORT` from process env (Aspire) or parent-dir env files
- After DocumentIssuer redeploy: update contract address in `.env` / `.env.example` (ABI already synced in repo)
- `Member.Email` is unique (nullable for Web3-only); register normalizes to lowercase

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
