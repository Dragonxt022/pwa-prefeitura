#!/usr/bin/env bash
# Atualiza a aplicacao publicada a partir do repositorio Git.
#
# Uso (como root):
#   sudo bash deploy/atualizar.sh
#
# Faz pull, reinstala dependencias, gera o build, recarrega o nginx e reinicia
# o processo PM2. O arquivo de dados do piloto nao e alterado.
set -euo pipefail

APP_SLUG="pwa-prefeitura"
APP_USER="app-${APP_SLUG}"
APP_HOME="/home/${APP_USER}"
APP_DIR="${APP_HOME}/app"
API_PORT="${API_PORT:-3000}"
NGINX_CONTAINER="${NGINX_CONTAINER:-digital-home}"
ENV_FILE="${APP_HOME}/.config/app.env"

log() {
  echo
  echo "==> $*"
}

if [[ ${EUID} -ne 0 ]]; then
  echo "Execute como root: sudo bash deploy/atualizar.sh" >&2
  exit 1
fi

log "1/4 - codigo"
runuser -u "${APP_USER}" -- git -C "${APP_DIR}" pull --ff-only

log "2/4 - dependencias e build"
runuser -u "${APP_USER}" -- bash -lc "
  set -euo pipefail
  cd '${APP_DIR}'
  npm --prefix backend ci --no-audit --no-fund
  npm --prefix frontend ci --no-audit --no-fund
  npm --prefix frontend run build
"

log "3/4 - nginx"
install -m 644 "${APP_DIR}/deploy/nginx/digital-home.conf" /opt/digital-home/conf/default.conf
if docker ps --format '{{.Names}}' | grep -qx "${NGINX_CONTAINER}"; then
  docker exec "${NGINX_CONTAINER}" nginx -t
  docker exec "${NGINX_CONTAINER}" nginx -s reload
else
  echo "Container ${NGINX_CONTAINER} ausente; rode deploy/instalar.sh." >&2
  exit 1
fi

log "4/4 - PM2"
runuser -u "${APP_USER}" -- bash -lc "
  set -euo pipefail
  set -a
  . '${ENV_FILE}'
  set +a
  cd '${APP_DIR}/backend'
  if pm2 describe '${APP_SLUG}' >/dev/null 2>&1; then
    pm2 restart '${APP_SLUG}' --update-env
  else
    pm2 start server.js --name '${APP_SLUG}' --time
  fi
  pm2 save
"

log "verificacao"
docker exec "${NGINX_CONTAINER}" wget -qO- "http://127.0.0.1/api/health"
echo
echo "Atualizacao concluida (API na porta ${API_PORT})."
