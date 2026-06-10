# DIVI — Decentralized Document Issuing & Verification Infrastructure

System do wystawiania, przechowywania i weryfikacji dokumentów (dyplomy, certyfikaty, licencje) z wykorzystaniem blockchain Ethereum, IPFS (Pinata) i klasycznego backendu .NET.

## Architektura

```
┌─────────────┐       ┌──────────────┐       ┌──────────────────┐
│  Frontend    │──────▶│  Backend API │──────▶│  PostgreSQL 16   │
│  React 19   │  HTTP │  .NET 8      │  EF   │  (dane użytk.)   │
│  Vite 7     │       │  Kestrel     │       └──────────────────┘
└─────────────┘       │              │
                      │              │──────▶ Ethereum Sepolia
                      │              │        (Nethereum, smart contract)
                      │              │
                      │              │──────▶ Pinata / IPFS
                      └──────────────┘        (przechowywanie plików PDF)
```

Trzeci komponent to **smart contract** `DocumentIssuer` (Solidity 0.8.28, Hardhat 3) wdrażany na sieć Sepolia.

## Stack technologiczny

| Warstwa      | Technologia                                              |
| ------------ | -------------------------------------------------------- |
| Frontend     | React 19, TypeScript, Vite 7, React Router 7, SCSS, ethers.js 6 |
| Backend      | .NET 8 (ASP.NET Core), EF Core 8, Nethereum 5.8, Serilog |
| Baza danych  | PostgreSQL 16                                            |
| Blockchain   | Solidity 0.8.28, Hardhat 3, sieć Sepolia                |
| IPFS         | Pinata Cloud API                                         |
| Auth         | JWT (access + refresh w httpOnly cookies), Web3 wallet sign-in, Google OAuth |
| Deployment   | Docker Compose (profile `dev` / `prod` / `tools`), Nginx, systemd |

## Struktura katalogów

```
DIVI/
├── backend/                 # ASP.NET Core Web API
│   ├── Controllers/         # Endpointy REST
│   ├── Models/              # Encje EF Core (Member, Nonce, IssuerApplication, ...)
│   ├── DTOs/                # Data Transfer Objects
│   ├── Services/            # Logika biznesowa
│   │   ├── Auth/            # Generowanie nonce, JWT, logowanie
│   │   ├── Blockchain/      # Nethereum — interakcja z kontraktem
│   │   ├── Documents/       # Upload: SHA-256 → Pinata → Blockchain
│   │   ├── DocumentVerification/  # Weryfikacja: hash ↔ blockchain
│   │   ├── Issuers/         # Workflow aplikacji o rolę issuer
│   │   ├── GetProfile/      # Odczyt/aktualizacja profilu
│   │   └── BackgroundJobs/  # Czyszczenie wygasłych nonce
│   ├── Infrastructure/      # Konfiguracja, Pinata client, Google Auth, Swagger
│   ├── Migrations/          # EF Core migracje (PostgreSQL)
│   ├── Extensions/          # DI rejestracja i middleware pipeline
│   ├── Data/                # AppDbContext
│   └── Utils/               # PasswordHasher (Argon2), StringToBytes32
├── frontend/                # React SPA
│   └── src/
│       ├── app/             # Strony aplikacji (po zalogowaniu)
│       │   ├── auth/        # LoginPage, RegisterPage, AuthPage (Web3)
│       │   ├── features/    # Dashboard, Upload, Verify, Profile, IssuerRole, ...
│       │   ├── layout/      # MainLayout z Sidebar
│       │   └── components/  # Wspólne UI
│       ├── public/          # Strona publiczna (landing)
│       ├── shared/          # Komponenty wielokrotnego użytku (Verify, Header, Notify)
│       ├── service/         # Web3AuthContext, JWT utils
│       └── types/           # Typy API
├── blockchain/              # Smart contract Solidity
│   ├── contracts/           # DocumentIssuer.sol, DocumentTypes.sol
│   └── hardhat.config.js
├── deployment/              # Nginx config, systemd service, deploy script
├── docker-compose.yml       # Profile: dev, prod, tools
├── .env.example             # Wzór zmiennych środowiskowych
└── DIVI.sln                 # Solution Visual Studio
```

## Modele danych (PostgreSQL)

### Member
Użytkownik systemu. Może logować się przez e-mail/hasło, portfel Ethereum lub Google.

| Pole              | Typ           | Opis                                |
| ----------------- | ------------- | ----------------------------------- |
| Id                | int (PK, AI)  | Identyfikator                       |
| FirstName         | string?       | Imię                                |
| LastName          | string?       | Nazwisko                            |
| Email             | string?       | E-mail                              |
| Password          | string?       | Hash hasła (Argon2)                 |
| EthereumAddress   | string?(42)   | Adres portfela Ethereum             |
| GoogleSub         | string?       | Google subject ID (unique)          |
| MemberRoleId      | int (FK)      | Rola: 1=admin, 2=issuer, 3=user    |
| Bio               | string?       | Biogram                             |
| AvatarUrl         | string?       | URL avatara                         |
| CreatedAt         | DateTime      | Data rejestracji                    |

### MemberRole
Role systemowe (seed data: `admin`, `issuer`, `user`).

### IssuerApplication
Wniosek o przyznanie roli wystawcy dokumentów.

| Pole              | Typ                        | Opis                          |
| ----------------- | -------------------------- | ----------------------------- |
| Id                | int (PK, AI)                | Identyfikator                 |
| InstitutionName   | string(100)                | Nazwa instytucji              |
| EthereumAddress   | string(42)                 | Adres Ethereum wnioskodawcy   |
| Email             | string(100)                | E-mail kontaktowy             |
| Description       | string(500)                | Opis                          |
| Status            | enum (Pending/Approved/Rejected) | Status wniosku          |
| CreatedAt         | DateTime                   | Data złożenia                 |

### Nonce
Jednorazowy nonce do Web3 sign-in (wygasa po 5 minutach).

### BlacklistedToken
Unieważnione tokeny JWT (po wylogowaniu, sprawdzane na `OnTokenValidated`).

## Endpointy API

### Auth (`/Auth`)
| Metoda | Ścieżka          | Autoryzacja  | Opis                                   |
| ------ | ----------------- | ------------ | -------------------------------------- |
| POST   | `/Auth/nonce`     | anonymous    | Generuje nonce dla adresu Ethereum     |
| POST   | `/Auth/verify`    | anonymous    | Weryfikuje podpis Web3 → wydaje JWT    |
| POST   | `/Auth/register`  | anonymous    | Rejestracja e-mail/hasło               |
| POST   | `/Auth/login`     | anonymous    | Logowanie e-mail/hasło → JWT cookies   |
| POST   | `/Auth/refresh`   | cookie       | Odświeżenie tokenów                    |
| POST   | `/Auth/logout`    | Authorize    | Wylogowanie + blacklist JWT            |
| POST   | `/Auth/google`    | anonymous    | Logowanie przez Google ID token        |

### Documents (`/api/documents`)
| Metoda | Ścieżka                        | Opis                                          |
| ------ | ------------------------------- | --------------------------------------------- |
| POST   | `/api/documents/upload-document`| Upload PDF → SHA-256 → Pinata → Blockchain    |
| POST   | `/api/documents/verify-document`| Weryfikacja PDF: hash ↔ blockchain             |
| GET    | `/api/documents/owner/{addr}`   | Dokumenty wystawione na dany adres Ethereum    |

### Issuer Applications (`/api/issuer`)
| Metoda | Ścieżka                  | Autoryzacja | Opis                              |
| ------ | ------------------------- | ----------- | --------------------------------- |
| POST   | `/api/issuer`             | user        | Złóż wniosek o rolę issuer       |
| GET    | `/api/issuer`             | admin       | Lista wniosków pending            |
| PATCH  | `/api/issuer/{id}/status` | admin       | Zatwierdź/odrzuć wniosek          |

### Profile (`/api/GetProfile`)
| Metoda | Ścieżka                   | Autoryzacja | Opis                    |
| ------ | -------------------------- | ----------- | ----------------------- |
| GET    | `/api/GetProfile`          | Authorize   | Pobierz profil          |
| PATCH  | `/api/GetProfile/name`     | Authorize   | Aktualizuj imię/nazwisko|
| PATCH  | `/api/GetProfile/email`    | Authorize   | Aktualizuj e-mail       |
| PATCH  | `/api/GetProfile/bio`      | Authorize   | Aktualizuj bio          |
| DELETE | `/api/GetProfile/name`     | Authorize   | Usuń imię/nazwisko      |
| DELETE | `/api/GetProfile/email`    | Authorize   | Usuń e-mail             |
| DELETE | `/api/GetProfile/bio`      | Authorize   | Usuń bio                |

### Inne
| Metoda | Ścieżka           | Opis                        |
| ------ | ------------------ | --------------------------- |
| GET    | `/health`          | Health check                |
| GET    | `/api/user-role`   | Rola aktualnie zalogowanego |

## Smart Contract — DocumentIssuer

Wdrożony na Ethereum Sepolia. Główne funkcje:

- **issueDocument(hash, cid, owner, type)** — wystawienie dokumentu (tylko issuer)
- **verifyDocument(hash)** — sprawdzenie czy hash istnieje w blockchain
- **getDocument(hash)** — pobranie metadanych dokumentu
- **getDocumentsByOwner(owner)** — lista dokumentów danego właściciela
- **applyForIssuer()** — zgłoszenie się na wystawcę
- **approveIssuer(addr)** — zatwierdzenie wystawcy (tylko admin)
- **addIssuer/removeIssuer** — zarządzanie wystawcami (tylko owner)

Typy dokumentów: `Education`, `ProfessionalCertificates`, `EmploymentDocuments`, `License`, `OtherDocuments`.

## Flow upload dokumentu

1. Użytkownik (issuer) uploaduje PDF + podaje typ dokumentu i adres właściciela
2. Backend oblicza SHA-256 pliku
3. Backend sprawdza czy hash już istnieje w blockchain (duplikat)
4. Pre-check kontraktu (dry-run)
5. Upload pliku do Pinata → otrzymanie CID (IPFS hash)
6. Transakcja `issueDocument` na blockchain → potwierdzenie (Confirmed)
7. Zwrócenie hash, CID i txHash do frontendu

## Flow weryfikacji dokumentu

1. Użytkownik uploaduje PDF
2. Backend oblicza SHA-256
3. Sprawdzenie hash w blockchain (`verifyDocument`)
4. Jeśli istnieje → pobranie metadanych (txHash, blockNumber, timestamp, network)
5. Zwrócenie wyniku: autentyczny / nieautentyczny

## Uruchomienie

### Wymagania
- Docker + Docker Compose
- Node.js 20+ (dla blockchain tooling)
- .NET SDK 8.0 (dla developmentu lokalnego)

### Dev (Docker)
```bash
cp .env.example .env
# Uzupełnij: POSTGRES_PASSWORD, JWT_KEY, PINATA_JWT, Blockchain__PrivateKey, Blockchain__RpcUrl, Blockchain__ContractAddress
docker compose --profile dev up --build
```
- Frontend: http://localhost:3000
- Backend: http://localhost:5021
- Swagger: http://localhost:5021/swagger (tylko dev)

### Prod (Docker)
```bash
docker compose --profile prod up --build -d
```
- Aplikacja: http://localhost:8080

### Blockchain tools
```bash
docker compose --profile tools up --build -d
# Hardhat node: http://localhost:8545
```

## Zmienne środowiskowe

| Zmienna                         | Wymagana | Opis                              |
| ------------------------------- | -------- | --------------------------------- |
| POSTGRES_PASSWORD               | tak      | Hasło PostgreSQL                  |
| JWT_KEY                         | tak      | Klucz symetryczny JWT (min 32 ch)|
| PINATA_JWT                      | tak      | Token JWT do Pinata API           |
| Blockchain__RpcUrl              | tak      | URL RPC sieci Ethereum (Sepolia)  |
| Blockchain__ContractAddress     | tak      | Adres wdrożonego kontraktu        |
| Blockchain__PrivateKey          | tak      | Klucz prywatny konta issuer       |
| SEPOLIA_RPC_URL                 | nie      | RPC dla Hardhat (deploy)          |
| SEPOLIA_PRIVATE_KEY             | nie      | Klucz prywatny do deploy          |
