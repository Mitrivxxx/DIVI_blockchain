#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Uruchom jako root (sudo)."
  exit 1
fi

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SERVER_NAME="${1:-_}"
BUILD_USER="${SUDO_USER:-$USER}"
BACKEND_PUBLISH_DIR="$PROJECT_DIR/backend/.publish"

run_as_build_user() {
  local cmd="$1"
  sudo -u "$BUILD_USER" -H bash -lc "export NVM_DIR=\"\$HOME/.nvm\"; if [ -s \"\$NVM_DIR/nvm.sh\" ]; then . \"\$NVM_DIR/nvm.sh\"; fi; $cmd"
}

echo "==> [1/8] Instalacja Nginx"
apt update -y
apt install -y nginx

echo "==> [2/8] Build frontendu"
run_as_build_user "cd '$PROJECT_DIR/frontend' && npm install && npm run build"

echo "==> [3/8] Publikacja backendu"
rm -rf "$BACKEND_PUBLISH_DIR"
run_as_build_user "cd '$PROJECT_DIR/backend' && dotnet publish -c Release -o '$BACKEND_PUBLISH_DIR'"
rm -rf /opt/divi/backend
mkdir -p /opt/divi/backend
cp -r "$BACKEND_PUBLISH_DIR/"* /opt/divi/backend/
if [[ -f "$PROJECT_DIR/.env" ]]; then
  cp "$PROJECT_DIR/.env" /opt/divi/backend/.env
fi
chown -R www-data:www-data /opt/divi/backend

echo "==> [4/8] Kopiowanie frontendu"
mkdir -p /var/www/divi/frontend
rm -rf /var/www/divi/frontend/*
cp -r "$PROJECT_DIR/frontend/dist/"* /var/www/divi/frontend/
chown -R www-data:www-data /var/www/divi

echo "==> [5/8] Konfiguracja systemd backend"
cp "$PROJECT_DIR/deployment/systemd/divi-backend.service" /etc/systemd/system/divi-backend.service
systemctl daemon-reload
systemctl enable divi-backend.service
systemctl restart divi-backend.service

echo "==> [6/8] Konfiguracja Nginx"
sed "s/__SERVER_NAME__/${SERVER_NAME}/g" \
  "$PROJECT_DIR/deployment/nginx/divi.conf.template" \
  > /etc/nginx/sites-available/divi

ln -sf /etc/nginx/sites-available/divi /etc/nginx/sites-enabled/divi
rm -f /etc/nginx/sites-enabled/default

echo "==> [7/8] Test Nginx"
nginx -t

echo "==> [8/8] Restart Nginx"
systemctl enable nginx
systemctl restart nginx

echo "Gotowe. Sprawdź: http://${SERVER_NAME}"
echo "Status backendu: systemctl status divi-backend --no-pager"
