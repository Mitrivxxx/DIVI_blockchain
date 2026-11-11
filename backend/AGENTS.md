# Backend AGENTS


## Scope

This document describes the current backend architecture, module ownership,
runtime configuration, business flows, API behavior and testing setup.

Mandatory backend development constraints are defined in:
`.cursor/rules/backend.mdc`.

Do not duplicate those constraints here.

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

## Modules

| Module | Owns (tables) | Api | Public contracts | Core Services |
| ------ | ------------- | --- | ---------------- | ------------- |
| Identity | `Nonces`, `BlacklistedTokens` | `/Auth/*`, `/api/user-role` | `ITokenBlacklist` | `AuthService`, `JwtService`, `GoogleUserService` |
| Members | `Members`, `MemberRoles`, `MemberFollows` | `/api/GetProfile/*`, `/api/profiles` | `IMemberDirectory` | `MemberDirectory`, `GetProfileService` (MinIO avatars) |
| Issuers | `IssuerApplications`, `IssuerProfiles` | `/api/issuer*`, `/api/institutions`, `/api/admins` | `IIssuerDirectory` | `IssuerApplicationService`, `IssuerProfileService` |
| Documents | `Documents`, `DocumentActivities` | `/api/documents/*`, `/api/share/*`, `/api/profiles/*/credentials` | — | `DocumentService` (Pinata/chain), `CredentialWalletService`, `DocumentTypeCatalog` |

Module dependencies: Identity → Members; Issuers → Members; Documents → Members, Issuers. Domain notes:
- `MemberDirectory.SetRoleAsync` saves `AppDbContext` immediately (commits pending changes for issuer approval).
- `Members` registers `AvatarBlobToMinioMigrator` as an `IPreMigrationStep`.
- `GetProfileController` uses route `api/[controller]` — keep the class name or provide an explicit route.

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
- PDF → SHA-256 → DB/chain status → tx metadata from `Documents` (event-scan fallback); also `GET /api/documents/{hash}/verify` (AllowAnonymous, by hash, ephemeral).
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



## Known debt

- After contract redeploy: update `Blockchain__ContractAddress` / `BLOCKCHAIN_CONTRACT_ADDRESS` in `.env`.

