# Backend AGENTS — ASP.NET Core .NET 10 (`net10.0`)

Short API-layer context. Broader project overview: `../AGENTS.md`.  
**Hard conventions (single source):** [`.cursor/rules/backend.mdc`](../.cursor/rules/backend.mdc) — do not restate them here.

## Role

REST API: auth (email / Web3 / Google), document upload + verification, profiles, issuer applications. PostgreSQL (EF Core 8 packages on TFM `net10.0`) + Nethereum (Sepolia) + Pinata (IPFS) + MinIO (avatars). Built as a **modular monolith** (modules: Identity, Members, Issuers, Documents).

## Structure (map) — modular monolith

One `backend.csproj`, one process, one `AppDbContext`. HTTP contract is module-agnostic.

```
backend/
  Program.cs
  Host/                 # AddModules(), pipeline, CORS, JWT wiring, Swagger, HealthController
  BuildingBlocks/       # MemberRoles (ids/names), ClaimsPrincipal.GetMemberId()
  Infrastructure/
    Persistence/        # AppDbContext, DatabaseInitializerHostedService, IPreMigrationStep, Migrations/
    Blockchain/         # IBlockchainService + BlockchainService* (Nethereum adapter)
    Contracts/          # DocumentIssuer.abi.json
    Pinata/ Minio/ Google/ Configuration/ Logging/ Swagger/
  Modules/
    Identity/ Members/ Issuers/ Documents/
```

Per module: `Api/` (controllers) · `Application/` (services, internal) · `Contracts/` (public interfaces + DTOs) · `Domain/` (entities) · `Persistence/` (`IEntityTypeConfiguration`) · `{Module}Module.cs` (`Add{Module}Module()`).

## Modules

| Module | Owns (tables) | Api | Public contracts (used by others) |
| ------ | ------------- | --- | --------------------------------- |
| Identity | `Nonces`, `BlacklistedTokens` | `/Auth/*`, `/api/user-role` | `ITokenBlacklist` (JWT `OnTokenValidated` in Host) |
| Members | `Members`, `MemberRoles`, `MemberFollows` | `/api/GetProfile/*`, `/api/profiles` directory/search/public card/follow | `IMemberDirectory` (`MemberAccount` lookups by id/email/ETH/GoogleSub, create, set role) |
| Issuers | `IssuerApplications`, `IssuerProfiles` | `/api/issuer*`, `/api/institutions`, `/api/admins` | `IIssuerDirectory` (display name, logo with avatar fallback) |
| Documents | `Documents`, `DocumentActivities` | `/api/documents/*`, `/api/share/*`, `/api/profiles/me/credentials*`, `/api/profiles/{address}/credentials`, `/api/profiles/me/activity`, `/api/profiles/{address}/activity` (`CredentialWalletController`) | — |

Dependencies (contracts only): Identity → Members; Issuers → Members; Documents → Members, Issuers. Members depends on no module. A module only touches its own `DbSet`s. Cross-module FKs to `Members` (`Documents.IssuedByMemberId`, `DocumentActivities.MemberId`, `IssuerProfiles.MemberId`) are id-only and configured in `AppDbContext`. `MemberDirectory.SetRoleAsync` saves the shared scoped `AppDbContext`, so caller changes pending in the same request are committed with it (issuer approval relies on this). Members registers `AvatarBlobToMinioMigrator` as an `IPreMigrationStep`. `GetProfileController` uses `api/[controller]` — keep the class name (or an explicit route).

## Runtime assumptions

- TFM **`net10.0`** (`backend.csproj`). Aspire AppHost / ServiceDefaults also `net10.0`.
- Env: root `.env.example` (fallback `.env`) via `DotNetEnv`; `DB_*` → `Database:*`. Aspire injects DB/JWT/Pinata/Blockchain/MinIO.
- ServiceDefaults: `AddServiceDefaults()` + `MapDefaultEndpoints()` (`/health`, `/alive` in Development).
- JWT: access (~15 min) + refresh in httpOnly cookies; blacklist `BlacklistedTokens`; Bearer header **or** `access_token` cookie.
- ABI: `Infrastructure/Contracts/DocumentIssuer.abi.json` (copied to output).
- API port **5021**. Swagger in Development. Dev CORS allows any `localhost` origin (Aspire Vite).

## Key files

- `Program.cs` — entry
- `Host/ServiceCollectionExtensions.cs` — infrastructure + `AddModules()`
- `Host/ApplicationBuilderExtensions.cs` — middleware
- `Infrastructure/Persistence/AppDbContext.cs` — single context; applies module configurations + cross-module FKs
- `Infrastructure/Persistence/Migrations/` — EF migrations (`-o Infrastructure/Persistence/Migrations`)
- `Modules/{Module}/{Module}Module.cs` — module DI
- `Modules/Identity/Application/` — `AuthService`, `JwtService`, `GoogleUserService` (`UserService`), `TokenBlacklist`, `NonceCleanupService`
- `Modules/Members/Application/MemberDirectory.cs` — `IMemberDirectory` implementation
- `Modules/Members/Application/GetProfileService.cs` + `Infrastructure/Minio/` — avatars → MinIO `divi-avatars`
- `Modules/Issuers/Application/` — `IssuerApplicationService`, `IssuerProfileService`, `IssuerDirectory`, `AdminManagementService`
- `Modules/Documents/Application/DocumentService.cs` — PDF → Pinata → chain, or Education/Experience metadata (`title` + period; `meta:` CID)
- `Modules/Documents/Domain/DocumentTypeCatalog.cs` — types 0–4; `IsMetadataOnly`
- `Modules/Documents/Application/` — `DocumentVerificationService`, `CredentialWalletService`, `DocumentActivityService`
- `Infrastructure/Blockchain/BlockchainService*.cs` — Nethereum partial

## Roles (DB / JWT)

| Id | Name | Notes |
| -- | ---- | ----- |
| 1 | admin | Approves issuer applications; managed by owner |
| 2 | issuer | Upload documents (`Roles = issuer,admin,owner`) |
| 3 | user | Default; submits issuer application |
| 4 | owner | Superuser; seed address = contract deployer / `Blockchain__PrivateKey` |

Refresh token reloads role from DB (not stale access claims).

## Business flows (backend detail)

### Auth (Identity)
- Email: `POST /Auth/register` → `POST /Auth/login` → JWT cookies. Email unique (nullable OK for Web3-only); register stores lowercase; `409` if taken.
- Web3: `POST /Auth/nonce` → MetaMask sign → `POST /Auth/verify` → JWT; auto-create Member if missing.
- Google: `POST /Auth/google` (ID token) → verify → JWT; auto-create if missing.
- `POST /Auth/refresh` (AllowAnonymous) renews cookies + returns `{ token }` for SPA restore.

### Document issue / list / revoke (Documents)
- Issuer(+): form type → owner → PDF **or** period (Education/Experience: no PDF; require `title`).
- PDF: SHA-256 → Pinata → `issueDocument()` → `Documents` row (max 5 MB).
- Metadata types: hash `type|owner|title|from|to`, CID `meta:{hash}`, `PeriodStart`/`ExpiresAt`/`Title`; no Pinata.
- Persist after issue: Hash, Cid, IssuerAddress=hot-wallet, OwnerAddress, IssuedByMemberId, TxHash, BlockNumber, Status=Confirmed, Visibility=private; log `DocumentActivities`.
- Lists from DB: `GET /api/documents/owner/{addr}`, `/issuer/{addr}`, `/issued-by-me`.
- PDF file: `GET /api/documents/{hash}/file` (AllowAnonymous when visibility=public; else owner / issuing member / admin|owner); not for `meta:`.
- Revoke: `DELETE /api/documents/{hash}/revoke` (issuer if `IssuedByMemberId` matches; admin/owner any) → on-chain + DB Status=Revoked + activity row.

### Verify (Documents)
- PDF → SHA-256 → DB/chain status → tx metadata from `Documents` (event-scan fallback).
- Returns `IsAuthentic` (Confirmed), `IsRevoked`, `Status`, blockchain fields.
- DTOs expose `IssuedByMemberId` + `IssuerDisplayName` (IssuerProfile); hot-wallet stays `IssuerAddress`.

### Issuer application / institution / admins (Issuers)
- User applies → admin/owner approve/reject.
- Approve: on-chain `addIssuer` + `MemberRoleId = issuer` + upsert `IssuerProfile` (applicant must already be Member with that ETH).
- Institution: `GET/PATCH /api/issuer/profile` (`issuer,admin,owner`); public card `GET /api/profiles/{address}/institution` (AllowAnonymous, 404 if none).
- Catalog: `GET /api/institutions?q=&limit=` (AllowAnonymous list/search); `GET /api/institutions/{memberId}` detail (includes member `ethereumAddress` when set).
- Owner: `POST/DELETE /api/admins` (DB + `addAdmin`/`removeAdmin`).

### Credentials / share / network / activity (Documents; directory/search/public card in Members)
- `GET /api/profiles/me/credentials` → `{ sections: [...] }` (always 5 types); `PATCH .../visibility` (`private`|`unlisted`|`public`).
- Unlisted → `ShareToken`; `GET /api/share/{token}` (Confirmed only, no CID).
- Public: `GET /api/profiles/{address}/credentials` (Confirmed + public, no CID; `hasPdfFile` for preview).
- Ephemeral issuer check: `GET /api/profiles/{address}/verify-issuer` — `authorizedIssuers` on-chain (`isIssuer`); no DB writes.
- Directory: `GET /api/profiles` (auth); search `GET /api/profiles/search?q=` (min 2 chars); public card `GET /api/profiles/{address}` (no email).
- Credential items: `IssuerDisplayName` + `IssuerLogoUrl` (profile LogoUrl else member AvatarUrl).
- Activity: `GET /api/profiles/me/activity` (auth, all related docs); public `GET /api/profiles/{address}/activity` (AllowAnonymous, only `visibility=public`, no CID); fallback synthetic Issued from `Documents` when no row; `Cid` null for `meta:` / public.

### Profile / avatar / follow (Members)
- Name/email/bio via `GetProfile` PATCH endpoints; external links `PATCH /api/GetProfile/links` (`linkedInUrl` / `githubUrl` / `websiteUrl`, http(s) only; empty clears).
- Avatar: JPEG/PNG/WebP ≤2 MB → MinIO; store URL only on `Member.AvatarUrl`.
- Follow: `POST/DELETE /api/profiles/{address}/follow` (auth); `GET .../follow-status` (auth); `GET .../following` (public list of people that member follows). Public card includes `memberId` + external links (no email).

## Tests (`tests/backend.Tests`)

- Run: `dotnet test tests/backend.Tests` (~5 s). Safety net for refactors: asserts the **HTTP contract** (routes, status codes, cookies, camelCase JSON) via raw `JsonElement`, not backend DTO classes.
- `Infrastructure/DiviApiFactory.cs` boots real `Program` (env `Testing`) with EF InMemory (seed via `EnsureCreated`), removes `DatabaseInitializerHostedService` / `NonceCleanupService`, and swaps `IBlockchainService`, `IMinioObjectStorage`, Pinata HTTP handler for fakes. Only `tests/backend.Tests/Infrastructure/` references backend types — update its usings when namespaces move.
- Auth helpers: real Web3 sign-in (`LoginWithWalletAsync`, Nethereum key) or minted JWT (`CreateClientAs(memberId, roleId)`); seeded owner via `GetSeededOwnerIdAsync`.
- Not covered: PostgreSQL specifics (unique indexes, filters, migrations), Google login, real chain/Pinata/MinIO, PDF download from IPFS gateway.

## Known debt

- Some areas may still use `Console.WriteLine` — prefer Serilog when touching them.
- After contract redeploy: update `Blockchain__ContractAddress` / `BLOCKCHAIN_CONTRACT_ADDRESS` in `.env`.

## After changes in this layer

Update this file (and root `AGENTS.md` only if cross-layer architecture / key-file map changes). Keep English. Follow `.cursor/rules/task-verification.mdc` before calling the task done.
