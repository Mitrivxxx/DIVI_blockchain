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
| `Infrastructure/` | Config, Pinata, Google, Swagger, contract ABI |
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
- `Services/Documents/DocumentService.cs` — upload (hash → Pinata → chain → `Documents` row)
- `Services/DocumentVerification/DocumentVerificationService.cs` — verify (DB tx metadata, event-scan fallback)
- `Models/Document.cs` — off-chain document metadata (`Documents` table, PK = hash)
- `Services/Blockchain/BlockchainService*.cs` — Nethereum (partial); `IssueDocumentAsync` returns tx + block
- `Services/Auth/` — JWT, login, Web3 nonce
- `Services/Issuers/IssuerApplicationService.cs` — approve → `addIssuer()` + DB role `issuer`
- `Services/Admins/AdminManagementService.cs` — owner-only add/remove admin (DB + chain)
- `Controllers/AdminController.cs` — `POST/DELETE /api/admins` (`Roles = owner`)

## Roles (DB / JWT)

| Id | Name | Notes |
| -- | ---- | ----- |
| 1 | admin | Approves issuer applications; managed by owner |
| 2 | issuer | Upload documents (`Roles = issuer,admin,owner`) |
| 3 | user | Default; submits issuer application |
| 4 | owner | Superuser; seed address = contract deployer / `Blockchain__PrivateKey` |

- Issuer approve: `Roles = admin,owner` → on-chain `addIssuer` + `MemberRoleId = 2`. Applicant must already be a `Member` with that ETH address.
- Refresh token reloads role from DB (not from old access claims).
- After successful issue: persist `Documents` (Hash, Cid, IssuerAddress=hot-wallet, OwnerAddress, IssuedByMemberId, TxHash, BlockNumber, Status=Confirmed).
- Lists: `GET /api/documents/owner/{addr}`, `/issuer/{addr}`, `/issued-by-me` read from DB (not chain event scan).
- Revoke: `DELETE /api/documents/{hash}/revoke` (`issuer` only if `IssuedByMemberId` matches; `admin`/`owner` any) → on-chain `revokeDocument` → DB `Status=2`. Verify returns `IsAuthentic` / `IsRevoked` / `Status`.

## Assumptions (auth / members)

- `Member.Email` has a unique index (multiple NULLs OK for Web3-only accounts). Register stores lowercase email and returns `409 Conflict` if taken.
- Auth Web3 verify + issuer services use Serilog (not `Console.WriteLine`).

## Known debt / notes

- Some other areas may still use `Console.WriteLine` — prefer Serilog when touching them.
- After contract redeploy: update `Blockchain__ContractAddress` / `BLOCKCHAIN_CONTRACT_ADDRESS` in `.env`.

## After changes in this layer

Update this file (and root `AGENTS.md` if architecture/flow changes). Keep AGENTS in English.
