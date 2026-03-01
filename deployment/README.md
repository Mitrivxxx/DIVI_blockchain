# Deployment (Nginx + backend)

## Co robi skrypt

Skrypt `deployment/scripts/deploy_nginx.sh`:
- instaluje Nginx,
- buduje frontend (Vite),
- publikuje backend .NET do `/opt/divi/backend`,
- kopiuje frontend do `/var/www/divi/frontend`,
- rejestruje usługę systemd `divi-backend`,
- konfiguruje Nginx jako reverse proxy do backendu na `127.0.0.1:5021`.

## Uruchomienie

Z katalogu projektu:

```bash
chmod +x deployment/scripts/deploy_nginx.sh
sudo ./deployment/scripts/deploy_nginx.sh twoja-domena.pl
```

Jeśli nie podasz domeny, użyte zostanie `server_name _`.

## Po wdrożeniu

- Aplikacja web: `http://twoja-domena.pl`
- API przez Nginx:
  - `/api/*`
  - `/auth/*`
  - `/Auth/*`
  - `/health`

## Debug

```bash
systemctl status divi-backend --no-pager
journalctl -u divi-backend -n 100 --no-pager
systemctl status nginx --no-pager
nginx -t
```

## Docker (zalecane)

### 1) Przygotowanie zmiennych

W katalogu głównym projektu:

```bash
cp .env.example .env
```

Uzupełnij w `.env` co najmniej:
- `POSTGRES_PASSWORD`
- `JWT_KEY`
- `SEPOLIA_PRIVATE_KEY`
- `PINATA_JWT`
- `BLOCKCHAIN_RPC_URL`
- `BLOCKCHAIN_CONTRACT_ADDRESS`

### 2) Tryb developerski

Uruchamia: PostgreSQL + backend + frontend Vite (HMR)

```bash
docker compose --profile dev up --build
```

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5021`
- Health: `http://localhost:5021/health`

### 3) Tryb produkcyjny (lokalny)

Uruchamia: PostgreSQL + backend + frontend na Nginx (SPA + reverse proxy `/api`)

```bash
docker compose --profile prod up --build -d
```

- Aplikacja: `http://localhost:8080`
- API przez frontend Nginx: `http://localhost:8080/api/...`

### 4) Narzędzia blockchain (opcjonalne)

```bash
docker compose --profile tools up --build -d
```

- Hardhat node: `http://localhost:8545`
- Shell narzędziowy: `docker exec -it divi-blockchain-tools sh`

### 5) Operacje serwisowe

```bash
docker compose ps
docker compose logs -f backend
docker compose down
docker compose down -v
```
