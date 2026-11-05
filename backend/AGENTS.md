# Backend AGENTS — ASP.NET Core .NET 10 (`net10.0`)

Short API-layer context. Broader project overview: `../AGENTS.md`.  
**Hard conventions (single source):** [`.cursor/rules/backend.mdc`](../.cursor/rules/backend.mdc) — do not restate them here.

## Role

REST API: auth (email / Web3 / Google), document upload + verification, profiles, issuer applications. PostgreSQL (EF Core 8 packages on TFM `net10.0`) + Nethereum (Sepolia) + Pinata (IPFS) + MinIO (avatars).

## Structure (map)

| Folder | Contents |
| ------ | -------- |
| `Controllers/` | Endpoints (`/Auth`, `/api/...`) |
| `Services/` | Business logic (Auth, Documents, Blockchain, Issuers, …) |
| `Models/` + `Data/` | EF entities + `AppDbContext` |
| `DTOs/` | Request/response contracts |
| `Extensions/` | DI + pipeline |
| `Infrastructure/` | Config, Pinata, MinIO, Google, Swagger, contract ABI |
| `Migrations/` | EF Core (PostgreSQL) |
| `Utils/` | Argon2, helpers |

## Runtime assumptions

- TFM **`net10.0`** (`backend.csproj`). Aspire AppHost / ServiceDefaults also `net10.0`.
- Env: root `.env.example` (fallback `.env`) via `DotNetEnv`; `DB_*` → `Database:*`. Aspire injects DB/JWT/Pinata/Blockchain/MinIO.
- ServiceDefaults: `AddServiceDefaults()` + `MapDefaultEndpoints()` (`/health`, `/alive` in Development).
- JWT: access (~15 min) + refresh in httpOnly cookies; blacklist `BlacklistedTokens`; Bearer header **or** `access_token` cookie.
- ABI: `Infrastructure/Contracts/DocumentIssuer.abi.json` (copied to output).
- API port **5021**. Swagger in Development. Dev CORS allows any `localhost` origin (Aspire Vite).

## Key files

- `Program.cs` — entry
- `Extensions/ServiceCollectionExtensions.cs` — DI
- `Extensions/ApplicationBuilderExtensions.cs` — middleware
- `Services/Documents/DocumentService.cs` — PDF → Pinata → chain, or Education/Experience metadata (`title` + period; `meta:` CID)
- `Services/Documents/DocumentTypeCatalog.cs` — types 0–4; `IsMetadataOnly`
- `Services/DocumentVerification/DocumentVerificationService.cs`
- `Services/Credentials/CredentialWalletService.cs` / `Services/Activity/DocumentActivityService.cs`
- `Services/Blockchain/BlockchainService*.cs` — Nethereum partial
- `Services/GetProfile/` + `Infrastructure/Minio/` — avatars → MinIO `divi-avatars`
- `Services/Auth/`, `Services/Issuers/`, `Services/Admins/`
- `Controllers/ProfilesController.cs`, `ShareController.cs`, `IssuerProfileController.cs`, `AdminController.cs`

## Roles (DB / JWT)

| Id | Name | Notes |
| -- | ---- | ----- |
| 1 | admin | Approves issuer applications; managed by owner |
| 2 | issuer | Upload documents (`Roles = issuer,admin,owner`) |
| 3 | user | Default; submits issuer application |
| 4 | owner | Superuser; seed address = contract deployer / `Blockchain__PrivateKey` |

Refresh token reloads role from DB (not stale access claims).

## Business flows (backend detail)

### Auth
- Email: `POST /Auth/register` → `POST /Auth/login` → JWT cookies. Email unique (nullable OK for Web3-only); register stores lowercase; `409` if taken.
- Web3: `POST /Auth/nonce` → MetaMask sign → `POST /Auth/verify` → JWT; auto-create Member if missing.
- Google: `POST /Auth/google` (ID token) → verify → JWT; auto-create if missing.
- `POST /Auth/refresh` (AllowAnonymous) renews cookies + returns `{ token }` for SPA restore.

### Document issue / list / revoke
- Issuer(+): form type → owner → PDF **or** period (Education/Experience: no PDF; require `title`).
- PDF: SHA-256 → Pinata → `issueDocument()` → `Documents` row (max 5 MB).
- Metadata types: hash `type|owner|title|from|to`, CID `meta:{hash}`, `PeriodStart`/`ExpiresAt`/`Title`; no Pinata.
- Persist after issue: Hash, Cid, IssuerAddress=hot-wallet, OwnerAddress, IssuedByMemberId, TxHash, BlockNumber, Status=Confirmed, Visibility=private; log `DocumentActivities`.
- Lists from DB: `GET /api/documents/owner/{addr}`, `/issuer/{addr}`, `/issued-by-me`.
- PDF file: `GET /api/documents/{hash}/file` (owner / issuing member / admin|owner); not for `meta:`.
- Revoke: `DELETE /api/documents/{hash}/revoke` (issuer if `IssuedByMemberId` matches; admin/owner any) → on-chain + DB Status=Revoked + activity row.

### Verify
- PDF → SHA-256 → DB/chain status → tx metadata from `Documents` (event-scan fallback).
- Returns `IsAuthentic` (Confirmed), `IsRevoked`, `Status`, blockchain fields.
- DTOs expose `IssuedByMemberId` + `IssuerDisplayName` (IssuerProfile); hot-wallet stays `IssuerAddress`.

### Issuer application / institution / admins
- User applies → admin/owner approve/reject.
- Approve: on-chain `addIssuer` + `MemberRoleId = issuer` + upsert `IssuerProfile` (applicant must already be Member with that ETH).
- Institution: `GET/PATCH /api/issuer/profile` (`issuer,admin,owner`).
- Owner: `POST/DELETE /api/admins` (DB + `addAdmin`/`removeAdmin`).

### Credentials / share / network / activity
- `GET /api/profiles/me/credentials` → `{ sections: [...] }` (always 5 types); `PATCH .../visibility` (`private`|`unlisted`|`public`).
- Unlisted → `ShareToken`; `GET /api/share/{token}` (Confirmed only, no CID).
- Public: `GET /api/profiles/{address}/credentials` (Confirmed + public, no CID).
- Directory: `GET /api/profiles` (auth); search `GET /api/profiles/search?q=` (min 2 chars); public card `GET /api/profiles/{address}` (no email).
- Credential items: `IssuerDisplayName` + `IssuerLogoUrl` (profile LogoUrl else member AvatarUrl).
- Activity: `GET /api/profiles/me/activity`; fallback synthetic Issued from `Documents` when no row; `Cid` null for `meta:`.

### Profile / avatar
- Name/email/bio via `GetProfile` PATCH endpoints.
- Avatar: JPEG/PNG/WebP ≤2 MB → MinIO; store URL only on `Member.AvatarUrl`.

## Known debt

- Some areas may still use `Console.WriteLine` — prefer Serilog when touching them.
- After contract redeploy: update `Blockchain__ContractAddress` / `BLOCKCHAIN_CONTRACT_ADDRESS` in `.env`.

## After changes in this layer

Update this file (and root `AGENTS.md` only if cross-layer architecture / key-file map changes). Keep English. Follow `.cursor/rules/task-verification.mdc` before calling the task done.
