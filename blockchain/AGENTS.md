# Blockchain AGENTS — Solidity + Hardhat 3

Short on-chain layer context. Broader project overview: `../AGENTS.md`.

## Role

Smart contract `DocumentIssuer`: stores document SHA-256 hash + metadata (issuer, documentOwner, CID, type, status). Target network: **Sepolia** (chainId `11155111`). Backend calls the contract via Nethereum.

## Structure

| Path | Contents |
| ---- | -------- |
| `contracts/DocumentIssuer.sol` | Main contract |
| `contracts/DocumentTypes.sol` | Enums + `Document` struct |
| `scripts/deploy.js` | **Single** deploy entry (local + Sepolia via `--network`) |
| `ignition/modules/DocumentIssuer.ts` | Optional Ignition module |
| `hardhat.config.js` | Networks: localhost, Sepolia, edr-simulated |
| `artifacts/` | Build artifacts (after compile) |

## Deploy

```bash
cd blockchain
npm run compile
npm run deploy:local      # --network localhost
npm run deploy:sepolia    # --network sepolia (needs SEPOLIA_* in ../.env)
# optional: INITIAL_ADMIN=0x... npm run deploy:sepolia
```

After deploy: copy ABI → `backend/Infrastructure/Contracts/DocumentIssuer.abi.json` and set `Blockchain__ContractAddress` in root `.env`.

## Assumptions

- Solidity **0.8.28**, optimizer on (200 runs). Env: root `../.env` (`SEPOLIA_RPC_URL`, `SEPOLIA_PRIVATE_KEY`).
- **Roles (single model):**
  - `owner` — deployer (`msg.sender` in constructor); manages admins; always in `authorizedIssuers`.
  - `isAdmin` — set by owner via `addAdmin` / `removeAdmin`.
  - `authorizedIssuers` — only mapping that gates `issueDocument` (`onlyIssuer`). Managed by owner **or** admin via `addIssuer` / `removeIssuer`.
- Issuer applications are **off-chain** (Postgres). No on-chain `applyForIssuer` / `approveIssuer` / `isIssuer`.
- Constructor: `(address[] initialIssuers, address initialAdmin)` — `initialAdmin` may be `address(0)`.
- Document key = `bytes32` hash; fields: issuer, documentOwner, issuedAt, cid, documentType, exists, status.
- Types (`DocumentType`): Education(0), Experience(1), LicensesAndCertificates(2), Recommendation(3), HonorsAndAwards(4).
- Status: Pending / Confirmed / **Revoked**. `exists` stays true after revoke; `verifyDocument` = exists && Confirmed.
- `revokeDocument(hash)` — document issuer, admin, or owner; emits `DocumentRevoked`.
- Events: `DocumentIssued`, `DocumentRevoked`, `IssuerAdded` / `IssuerRemoved`, `AdminAdded` / `AdminRemoved`.
- After contract change: **compile → copy ABI** to `backend/Infrastructure/Contracts/DocumentIssuer.abi.json` → update `IBlockchainService` / `BlockchainService*` → **redeploy** and update contract address in env.

## Local node

```bash
docker compose --profile tools up
# RPC: localhost:8545
```

## After changes in this layer

Update this file, the backend ABI, and root `AGENTS.md` if contract API / roles / types change. Keep AGENTS in English.
