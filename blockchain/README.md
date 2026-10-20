# DIVI — Blockchain (DocumentIssuer)

Smart contract for issuing and verifying document hashes on Ethereum (Sepolia / local Hardhat).

## Contracts

| File | Role |
| ---- | ---- |
| `contracts/DocumentIssuer.sol` | Issue / verify / revoke documents; manage issuers & admins |
| `contracts/DocumentTypes.sol` | `DocumentStatus`, `DocumentType`, `Document` struct |

### Roles

- **owner** — deployer; manages admins; always authorized issuer
- **admin** — can `addIssuer` / `removeIssuer`
- **authorizedIssuers** — can `issueDocument`

### Events

- `DocumentIssued`, `DocumentRevoked`
- `IssuerAdded`, `IssuerRemoved`
- `AdminAdded`, `AdminRemoved`

### Status

`Pending` | `Confirmed` | `Revoked` — `verifyDocument` is true only for Confirmed.

## Setup

```bash
cd blockchain
npm install
# Root ../.env must contain SEPOLIA_RPC_URL and SEPOLIA_PRIVATE_KEY for Sepolia deploys
```

## Compile

```bash
npm run compile
# or: npx hardhat compile
```

## Deploy (primary path)

One script for every Hardhat network:

```bash
# Local node (docker compose --profile tools / hardhat node on :8545)
npm run deploy:local
# npx hardhat run scripts/deploy.js --network localhost

# Sepolia
npm run deploy:sepolia
# npx hardhat run scripts/deploy.js --network sepolia
```

Optional: set `INITIAL_ADMIN=0x...` in the environment before deploy.

### After deploy

1. Copy ABI to `backend/Infrastructure/Contracts/DocumentIssuer.abi.json`
2. Set `Blockchain__ContractAddress` / `BLOCKCHAIN_CONTRACT_ADDRESS` in root `.env`

## Deploy via Ignition (optional)

```bash
npx hardhat ignition deploy ignition/modules/DocumentIssuer.ts
npx hardhat ignition deploy ignition/modules/DocumentIssuer.ts --network sepolia
```

## Tests

```bash
npm test
# npx hardhat test
```

## Local RPC

```bash
# from repo root
docker compose --profile tools up
# RPC: http://127.0.0.1:8545
```
