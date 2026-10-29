# Backend AGENTS — ASP.NET Core .NET 8

Short API-layer context. Broader project overview: `../AGENTS.md`.

## Role

REST API: auth (email / Web3 / Google), document upload + verification, profiles, issuer applications. PostgreSQL (EF Core) + Nethereum (Sepolia) + Pinata (IPFS).

## Structure

| Folder | Contents |
| ------ | -------- |
| `Controllers/` | Endpoints (`/Auth`, `/api/...`) |
| `Services/` | Business logic (Auth, Documents, Blockchain, Issuers, …) |
| `Models/` + `Data/` | EF entities + `AppDbContext` |
| `DTOs/` | Request/response contracts |
| `Extensions/` | DI (`AddApplication` / `AddInfrastructure` / `AddPresentation`) + pipeline |
| `Infrastructure/` | Config, Pinata, MinIO (avatars), Google, Swagger, contract ABI |
| `Migrations/` | EF Core (PostgreSQL) |
| `Utils/` | Argon2, helpers |

## Assumptions

- Pattern: **controller → service** (no separate repo; EF in services).
- Namespace: `backend.*`. New service → register in `AddApplication()`.
- JWT: access (15 min) + refresh in httpOnly cookies; blacklist in `BlacklistedTokens`.
- Token: `Authorization: Bearer` header **or** `access_token` cookie.
- Env: root `.env.example` (fallback `.env`) via `DotNetEnv`; `DB_*` aliased to `Database:*`. Aspire injects DB/JWT/Pinata/Blockchain.
- ServiceDefaults: `builder.AddServiceDefaults()` + `MapDefaultEndpoints()` (`/health`, `/alive` in Development).
- ABI: `Infrastructure/Contracts/DocumentIssuer.abi.json` (copied to output).
- API port: `5021`. Swagger in dev only. Dev CORS allows any `localhost` origin (Aspire Vite port).

## Key files

- `Program.cs` — entry
- `Extensions/ServiceCollectionExtensions.cs` — DI
- `Extensions/ApplicationBuilderExtensions.cs` — middleware
- `Services/Documents/DocumentService.cs` — upload: PDF → Pinata → chain, or Education/Experience metadata (`periodFrom`/`periodTo`, Education also requires `title` = tytuł/kierunek, synthetic `meta:` CID, no Pinata)
- `Services/Documents/DocumentTypeCatalog.cs` — DocumentType 0–4; `IsMetadataOnly` for Education/Experience
- `Services/DocumentVerification/DocumentVerificationService.cs` — verify (DB tx metadata, event-scan fallback)
- `Models/Document.cs` — off-chain document metadata (`Documents` table, PK = hash; `Visibility` + `ShareToken`)
- `Services/Credentials/CredentialWalletService.cs` — owner credential wallet + public share/portfolio
- `Services/Activity/DocumentActivityService.cs` — issue/revoke event log + `/me/activity`
- `Services/Blockchain/BlockchainService*.cs` — Nethereum (partial); `IssueDocumentAsync` returns tx + block
- `Services/GetProfile/` — profile GET/PATCH name|email|bio; avatar POST/DELETE → MinIO; GET redirects to public object URL
- `Infrastructure/Minio/` — S3 SigV4 client (`IMinioObjectStorage`); works with Aspire/compose `soldevelo/minio` (community MinIO); bucket auto-create + public-read policy; one-shot `AvatarBlobToMinioMigrator` before dropping legacy columns
- `Services/Auth/` — JWT, login, Web3 nonce
- `Services/Issuers/IssuerApplicationService.cs` — approve → `addIssuer()` + DB role `issuer` + seed `IssuerProfile`
- `Services/Issuers/IssuerProfileService.cs` — institution profile (name, description, logo URL, website, country, tax id)
- `Controllers/IssuerProfileController.cs` — `GET/PATCH /api/issuer/profile` (`issuer,admin,owner`)
- `Models/IssuerProfile.cs` — 1:1 with Member; public display name for documents/verify
- `Services/Admins/AdminManagementService.cs` — owner-only add/remove admin (DB + chain)
- `Controllers/AdminController.cs` — `POST/DELETE /api/admins` (`Roles = owner`)
- `Controllers/ProfilesController.cs` — `/api/profiles/search?q=`, public `{address}`, `{address}/credentials`, `/me/credentials`
- `Controllers/ShareController.cs` — `GET /api/share/{token}`

## Roles (DB / JWT)

| Id | Name | Notes |
| -- | ---- | ----- |
| 1 | admin | Approves issuer applications; managed by owner |
| 2 | issuer | Upload documents (`Roles = issuer,admin,owner`) |
| 3 | user | Default; submits issuer application |
| 4 | owner | Superuser; seed address = contract deployer / `Blockchain__PrivateKey` |

- Issuer approve: `Roles = admin,owner` → on-chain `addIssuer` + `MemberRoleId = 2` + upsert `IssuerProfile` from application InstitutionName/Description. Applicant must already be a `Member` with that ETH address.
- Document list/verify/credential DTOs expose `IssuedByMemberId` + `IssuerDisplayName` (from IssuerProfile; hot-wallet stays in `Issuer` / `IssuerAddress`).
- Refresh token reloads role from DB (not from old access claims).
- After successful issue: persist `Documents` (Hash, Cid, IssuerAddress=hot-wallet, OwnerAddress, IssuedByMemberId, TxHash, BlockNumber, Status=Confirmed, Visibility=private).
- Lists: `GET /api/documents/owner/{addr}`, `/issuer/{addr}`, `/issued-by-me` read from DB (not chain event scan).
- PDF preview: `GET /api/documents/{hash}/file` (`[Authorize]`) — owner / issuing member / admin|owner; streams PDF from Pinata IPFS gateway via CID.
- Revoke: `DELETE /api/documents/{hash}/revoke` (`issuer` only if `IssuedByMemberId` matches; `admin`/`owner` any) → on-chain `revokeDocument` → DB `Status=2`. Verify returns `IsAuthentic` / `IsRevoked` / `Status`.
- Credential wallet: `GET /api/profiles/me/credentials` returns `{ sections: [{ documentType, label, items }] }` — always 5 type sections. Owner + public/share items include `IssuerDisplayName` + `IssuerLogoUrl` (IssuerProfile.LogoUrl, else issuing Member.AvatarUrl). `PATCH .../visibility` returns a single item. Public portfolio/share still omit CID.
- Network directory: `GET /api/profiles` (`[Authorize]`) lists all Members (every role; optional `limit`, default 200). Member search: `GET /api/profiles/search?q=` (`[Authorize]`, min 2 chars) matches EthereumAddress / FirstName / LastName (members with an address only); returns `MemberSearchResultDto` (no email). Public card: `GET /api/profiles/{address}` (no email).
- Activity feed: `DocumentActivities` logged on issue/revoke; `GET /api/profiles/me/activity` (member actions + owned/issued docs). Fallback synthetic `Issued` from `Documents.TxHash`/`BlockNumber` when no activity row yet.

## Assumptions (auth / members)

- `Member.Email` has a unique index (multiple NULLs OK for Web3-only accounts). Register stores lowercase email and returns `409 Conflict` if taken.
- Auth Web3 verify + issuer services use Serilog (not `Console.WriteLine`).
- Profile name: `PATCH /api/GetProfile/name` accepts `{ name }` (or FirstName/LastName); response DTO includes computed `Name`. Avatar: `POST/DELETE /api/GetProfile/avatar` (auth) uploads JPEG/PNG/WebP ≤2 MB to **MinIO** (`divi-avatars` bucket) and stores public URL in `Member.AvatarUrl` only (no `AvatarData` / local `Data/avatars`). `GET /api/GetProfile/avatar/{memberId}` redirects to that MinIO URL. Config: `Minio__*` / `MINIO_*` in `.env.example`.
- `POST /Auth/refresh` (AllowAnonymous) renews cookies and returns `{ token }` so SPA restores session after Aspire/page reload.

## Known debt / notes

- Some other areas may still use `Console.WriteLine` — prefer Serilog when touching them.
- After contract redeploy: update `Blockchain__ContractAddress` / `BLOCKCHAIN_CONTRACT_ADDRESS` in `.env`.

## After changes in this layer

Update this file (and root `AGENTS.md` if architecture/flow changes). Keep AGENTS in English.
