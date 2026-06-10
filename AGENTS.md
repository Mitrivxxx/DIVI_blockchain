# AGENTS.md — Instrukcje dla AI pracującego z projektem DIVI

## Czym jest DIVI

DIVI to fullstack aplikacja do wystawiania i weryfikacji dokumentów (dyplomy, certyfikaty, licencje) z wykorzystaniem blockchain Ethereum jako źródła prawdy. Dokumenty są przechowywane na IPFS (Pinata), a ich hash SHA-256 jest zapisywany w smart kontrakcie na sieci Sepolia. System obsługuje trzy metody logowania: e-mail/hasło, portfel Ethereum (Web3 sign-in) oraz Google OAuth.

## Architektura — trzy niezależne warstwy

```
frontend/ (React 19 + Vite 7 + TypeScript)
    ↕ HTTP/REST (proxy /api → backend)
backend/  (ASP.NET Core .NET 8 + EF Core 8 + PostgreSQL 16)
    ↕ Nethereum RPC
blockchain/ (Solidity 0.8.28 + Hardhat 3, sieć Sepolia)
```

## Konwencje kodu

### Backend (.NET 8)

- **Język**: C# 12, nullable reference types włączone, implicit usings
- **Wzorzec**: kontroler → serwis → repozytorium (EF Core bezpośrednio w serwisach, brak osobnej warstwy repo)
- **DI**: rejestracja w `backend/Extensions/ServiceCollectionExtensions.cs` — trzy metody: `AddApplication()` (serwisy), `AddInfrastructure()` (DB, CORS, JWT, Pinata), `AddPresentation()` (controllers, Swagger)
- **Pipeline**: konfiguracja middleware w `backend/Extensions/ApplicationBuilderExtensions.cs`
- **Routing**: kontrolery używają atrybutów `[Route]`. Auth pod `/Auth`, reszta pod `/api/...`
- **Namespace**: wszystko w `backend.*` (np. `backend.Controllers`, `backend.Services.Blockchain`)
- **Logowanie**: Serilog (structured logging). Część kodu używa `Console.WriteLine` — docelowo migrować na Serilog
- **Hasła**: Argon2 via Konscious.Security.Cryptography (`backend/Utils/PasswordHasher.cs`)
- **Tokeny JWT**: access token (15 min) + refresh token w httpOnly cookies. Blacklisting w tabeli `BlacklistedTokens` sprawdzany w `OnTokenValidated`
- **Token z cookie LUB header**: `OnMessageReceived` sprawdza najpierw `Authorization: Bearer ...`, potem cookie `access_token`
- **Env**: plik `.env` w rootcie projektu, ładowany przez `DotNetEnv` w `Program.cs`. Konfiguracja blockchain, Pinata, JWT może być w appsettings.json LUB w zmiennych środowiskowych (env mają priorytet)
- **Migracje**: EF Core, PostgreSQL. Seed data: 3 role (`admin`, `issuer`, `user`) + jeden admin z hardcoded EthereumAddress
- **Smart contract ABI**: plik `backend/Infrastructure/Contracts/DocumentIssuer.abi.json`, kopiowany do output directory

### Frontend (React 19 + TypeScript)

- **Bundler**: Vite 7, dev server na porcie 3000 z proxy `/api` → backend
- **Routing**: React Router 7 (`BrowserRouter`). Publiczna strona pod `/`, auth pod `/auth`, `/login`, `/register`, aplikacja pod `/app/:tabPath?`
- **Taby aplikacji**: zdefiniowane w `frontend/src/app/features/sidebar/tabs.ts` — `dashboard`, `issuerRole`, `upload`, `myDocuments`, `verify`, `profile`, `help`, `notify`
- **State management**: brak globalnego store (Redux/Zustand). Stan zarządzany przez React Context (`Web3AuthContext`) i lokalne hooki
- **Stylowanie**: SCSS moduły + globalne style
- **Web3**: ethers.js 6 do interakcji z portfelem użytkownika (MetaMask). Kontekst w `src/service/Web3AuthContext.tsx`
- **API calls**: Axios, bazowy URL z `VITE_API_URL` lub proxy. Pliki API w folderach `api/` wewnątrz feature directories
- **Struktura feature**: każdy feature ma folder z `hooks/`, `components/`, `api/` i główny komponent (np. `Upload.tsx`, `Verify.tsx`, `Profile.tsx`)
- **Alias**: `@` → `frontend/src/`

### Blockchain (Solidity)

- **Kontrakt**: `DocumentIssuer.sol` + `DocumentTypes.sol` (library z typami enum i struct)
- **Sieć**: Sepolia testnet (chainId 11155111). Hardhat config wspiera też localhost (8545) i edr-simulated
- **Roles w kontrakcie**: `isAdmin` (mapping), `isIssuer` (mapping), `authorizedIssuers` (mapping), `owner` (deployer)
- **Document struct**: `issuer`, `documentOwner`, `issuedAt`, `cid`, `documentType`, `exists`, `status`
- **Typy dokumentów (enum)**: Education(0), ProfessionalCertificates(1), EmploymentDocuments(2), License(3), OtherDocuments(4)

## Kluczowe pliki — mapa nawigacji

| Cel                          | Plik                                                      |
| ---------------------------- | --------------------------------------------------------- |
| Entry point backendu         | `backend/Program.cs`                                      |
| Rejestracja DI               | `backend/Extensions/ServiceCollectionExtensions.cs`       |
| Middleware pipeline           | `backend/Extensions/ApplicationBuilderExtensions.cs`      |
| Konfiguracja bazy danych     | `backend/Data/AppDbContext.cs`                            |
| Opcje konfiguracyjne         | `backend/Infrastructure/Configuration/*.cs`               |
| Logika uploadu dokumentu     | `backend/Services/Documents/DocumentService.cs`           |
| Logika weryfikacji dokumentu | `backend/Services/DocumentVerification/DocumentVerificationService.cs` |
| Interakcja z blockchain      | `backend/Services/Blockchain/BlockchainService*.cs`       |
| JWT + auth serwis            | `backend/Services/Auth/JwtService.cs`, `AuthService.cs`  |
| Issuer workflow              | `backend/Services/Issuers/IssuerApplicationService.cs`    |
| Smart contract               | `blockchain/contracts/DocumentIssuer.sol`                 |
| Typy Solidity                | `blockchain/contracts/DocumentTypes.sol`                  |
| Entry point frontendu        | `frontend/src/app/frontend.tsx`                           |
| Router                       | `frontend/src/app/App.tsx`                                |
| Definicje tabów              | `frontend/src/app/features/sidebar/tabs.ts`               |
| Vite config                  | `frontend/vite.config.ts`                                 |
| Web3 kontekst                | `frontend/src/service/Web3AuthContext.tsx`                 |
| Docker compose               | `docker-compose.yml`                                      |
| Zmienne środowiskowe         | `.env` (gitignored), `.env.example` (wzór)                |

## Modele danych — relacje

```
MemberRole (1) ←——— (*) Member
   Id: 1=admin, 2=issuer, 3=user

Member — główna encja użytkownika
   ├── może mieć EthereumAddress (Web3 login)
   ├── może mieć Email + Password (klasyczny login)
   ├── może mieć GoogleSub (Google login)
   └── może mieć tylko jedno z powyższych lub kombinację

IssuerApplication — wniosek o rolę issuer (niezależna tabela)
   Status: Pending → Approved/Rejected
   Po approve: blockchain tx addIssuer(ethereumAddress)

Nonce — jednorazowe nonce do Web3 sign-in (TTL 5 min, cleanup w background job)

BlacklistedToken — unieważnione JWT po logout (Jti + ExpiryDate)
```

## Flow biznesowy — najważniejsze procesy

### 1. Rejestracja i logowanie
- **E-mail**: POST `/Auth/register` → POST `/Auth/login` → JWT w cookies
- **Web3**: POST `/Auth/nonce` → użytkownik podpisuje nonce w MetaMask → POST `/Auth/verify` → JWT w cookies. Auto-tworzenie Member jeśli nie istnieje
- **Google**: POST `/Auth/google` z ID tokenem → weryfikacja przez Google API → auto-tworzenie Member jeśli nie istnieje

### 2. Upload dokumentu (wymaga roli issuer)
- Frontend wysyła PDF + documentType + owner address
- Backend: SHA-256 → duplikat check → pre-check kontrakt → Pinata upload → `issueDocument()` on-chain → zwróć wynik
- Plik max 5 MB, tylko PDF

### 3. Weryfikacja dokumentu (publiczne)
- Frontend wysyła PDF
- Backend: SHA-256 → `verifyDocument(hash)` on-chain → jeśli istnieje: pobierz txHash, blockNumber, timestamp
- Zwróć wynik: autentyczny/nieautentyczny + dane blockchain

### 4. Aplikacja o rolę issuer
- User wypełnia formularz (instytucja, ETH address, email, opis)
- Admin widzi listę pending → approve/reject
- Approve: backend wywołuje `addIssuer()` na kontrakcie + zmiana statusu w DB

## Porty i URL

| Serwis            | Dev                  | Prod (Docker)        |
| ----------------- | -------------------- | -------------------- |
| Frontend          | http://localhost:3000 | http://localhost:8080 |
| Backend API       | http://localhost:5021 | http://localhost:5021 |
| PostgreSQL        | localhost:5432        | localhost:5432        |
| Hardhat node      | localhost:8545        | localhost:8545        |
| Swagger           | localhost:5021/swagger | niedostępny          |

## Wskazówki dla AI

### Dodając nowy endpoint
1. Stwórz DTO w `backend/DTOs/`
2. Stwórz interface serwisu w odpowiednim folderze `backend/Services/`
3. Zaimplementuj serwis
4. Zarejestruj w `ServiceCollectionExtensions.cs` → `AddApplication()`
5. Stwórz kontroler w `backend/Controllers/` z odpowiednimi atrybutami `[Route]`, `[Authorize]`

### Dodając nowy model/tabelę
1. Stwórz klasę w `backend/Models/`
2. Dodaj `DbSet<T>` w `AppDbContext`
3. Skonfiguruj w `OnModelCreating` jeśli potrzebne
4. Wygeneruj migrację: `dotnet ef migrations add NazwaMigracji -p backend`

### Dodając nowy feature na frontend
1. Stwórz folder w `frontend/src/app/features/nazwaFeature/`
2. Dodaj podfoldery: `hooks/`, `components/`, `api/`
3. Dodaj tab w `frontend/src/app/features/sidebar/tabs.ts`
4. Komponent główny feature'a renderuje się wewnątrz `MainLayout`

### Praca z blockchain
- ABI kontraktu: `backend/Infrastructure/Contracts/DocumentIssuer.abi.json`
- Serwis Nethereum: `backend/Services/Blockchain/BlockchainService*.cs` (partial class)
- Nowe funkcje kontraktu wymagają aktualizacji ABI i odpowiedniej metody w `IBlockchainService` + implementacji
- Testowanie lokalne: Hardhat node (`docker compose --profile tools up`)

### Uwagi
- Plik `.env` w rootcie projektu — NIE commitować (jest w `.gitignore`)
- Backend ładuje `.env` z `Env.Load("../.env")` w `Program.cs`
- Frontend czyta env vars z prefix `VITE_` przez Vite (+ proxy do backendu w dev)
- Niektóre serwisy używają `Console.WriteLine` zamiast Serilog — to techincal debt do poprawki
- Kontroler `UserRoleService.cs` ma nazwę pliku niezgodną z klasą (`UserRoleController`) — zmienić nazwę pliku
- Konfiguracja `Nonce` w `OnModelCreating` jest zagnieżdżona wewnątrz konfiguracji `IssuerApplication` — to bug, powinno być na tym samym poziomie

## Uruchomienie testów

Brak formalnego test suite. Brak projektów testowych w solution. Testowanie manualne przez Swagger (dev) lub frontend.

## Docker Compose — profile

- `docker compose --profile dev up` — DB + backend + frontend (Vite HMR)
- `docker compose --profile prod up` — DB + backend + frontend (Nginx SPA)
- `docker compose --profile tools up` — Hardhat node + blockchain tools shell
