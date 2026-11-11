# AGENTS.md

## What DIVI is

DIVI is a fullstack app for issuing and verifying documents with Ethereum as the source of truth. Files live on IPFS (Pinata); their SHA-256 hash is stored in a smart contract on Sepolia. 

## Per-layer AGENTS (read when working in that folder)

| Layer | File | Contents |
|---|---|---|
| Backend | `backend/AGENTS.md` | Backend architecture, modules, persistence and API |
| Frontend | `frontend/AGENTS.md` | Frontend modules (mirroring backend), slices, routes and state management |
| Blockchain | `blockchain/AGENTS.md` | Smart contracts, deployment and blockchain integration |
| Tests | `tests/AGENTS.md` | Test suites, in-memory fakes, fixtures and runner filters |


## System architecture

DIVI consists of three main application layers:

- Frontend — React modular monolith (same modules as the backend) responsible for UI, user interactions and wallet integration.
- Backend — ASP.NET Core modular monolith responsible for business logic, authentication, persistence and external integrations.
- Blockchain — Solidity smart contracts responsible for on-chain issuer authorization and document verification data.

Orchestration & runtime:
- .NET Aspire — primary local development orchestrator (spins up Postgres, MinIO, backend API, and Vite frontend).
- Docker Compose — containerized environments for dev, production, and blockchain tool containers.

External infrastructure:
- PostgreSQL — application persistence.
- Pinata/IPFS — document storage.
- MinIO — user avatar storage.
- Ethereum Sepolia — blockchain network.

Communication:
- Frontend ↔ Backend — REST API (JSON over HTTP).
- Backend ↔ Blockchain — Ethereum RPC via Nethereum.
- Frontend ↔ Blockchain — Web3 wallet (ethers.js) for signing and verification.
- Backend ↔ Storage — S3 API (MinIO) and REST API (Pinata/IPFS).

The backend coordinates off-chain and on-chain operations.
The blockchain is the source of truth for on-chain document and issuer state.


## Key files — navigation map

| Purpose | File |
| ------- | ---- |
| Backend entry point | `backend/Program.cs` |
| Frontend entry point | `frontend/src/app/frontend.tsx` |
| Smart contract | `blockchain/contracts/DocumentIssuer.sol` |
| Aspire AppHost | `aspire/DIVI.AppHost/AppHost.cs` |
| Docker Compose | `docker-compose.yml` |
| Main configurations | `.env` / `.env.example`, `backend/appsettings.json`, `frontend/vite.config.ts` |

Backend data models, entity relationships and persistence details: [`backend/AGENTS.md`](backend/AGENTS.md).

## Business flows — overview

1. Authentication — email/password, Web3 wallet and Google(only MVP) authentication.
2. Document issuance — issuers create PDF-based or metadata-based documents.
3. Verification — document authenticity is verified using SHA-256 and blockchain data.
4. Issuer onboarding — applications are reviewed and approved by administrators.
5. Credential wallet — users manage document visibility and share credentials.
6. Activity history — document issuance and revocation events are displayed to users.

## Ports and URLs

| Service | Dev | Prod (Docker) |
| ------- | --- | ------------- |
| Frontend | http://localhost:3000 | http://localhost:8080 |
| Backend API | http://localhost:5021 | http://localhost:5021 |
| PostgreSQL | localhost:5432 | localhost:5432 |
| MinIO S3 / console | localhost:9000 / 9001 | localhost:9000 / 9001 |
| Hardhat node | localhost:8545 | localhost:8545 |
| Swagger | localhost:5021/swagger | unavailable |


