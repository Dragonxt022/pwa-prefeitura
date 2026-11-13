#!/usr/bin/env bash
# Instala e publica o PWA Prefeitura Digital neste servidor.
#
# Uso (como root):
#   sudo bash deploy/instalar.sh
#
# O script e idempotente: pode ser executado novamente para reaplicar
# dependencias, build, PM2, firewall e o gateway nginx.
set -euo pipefail

APP_SLUG="pwa-prefeitura"
APP_USER="app-${APP_SLUG}"
APP_HOME="/home/${APP_USER}"
APP_DIR="${APP_HOME}/app"
REPO_URL="${REPO_URL:-https://github.com/Dragonxt022/pwa-prefeitura.git}"
PUBLIC_URL="${PUBLIC_URL:-https://digital.cujubim.ro.gov.br}"
WWW_URL="${WWW_URL:-https://www.digital.cujubim.ro.gov.br}"
API_PORT="${API_PORT:-3000}"
PROXY_NETWORK="${PROXY_NETWORK:-proxy}"
PROXY_SUBNET="${PROXY_SUBNET:-172.18.0.0/16}"
NGINX_CONTAINER="${NGINX_CONTAINER:-digital-home}"
NGINX_IMAGE="${NGINX_IMAGE:-nginx:alpine}"
ENV_FILE="${APP_HOME}/.config/app.env"
CRED_FILE="/root/${APP_SLUG}-credenciais.txt"

log() {
  echo
  echo "==> $*"
}

if [[ ${EUID} -ne 0 ]]; then
  echo "Execute como root: sudo bash deploy/instalar.sh" >&2
  exit 1
fi

for bin in git node npm pm2 docker ufw openssl; do
  if ! command -v "${bin}" >/dev/null 2>&1; then
    echo "Dependencia ausente: ${bin}" >&2
    exit 1
  fi
done

log "1/7 - usuario Linux e banco MySQL"
if id "${APP_USER}" >/dev/null 2>&1; then
  echo "Usuario ${APP_USER} ja existe; mantendo banco e credenciais."
else
  criar-app "${APP_SLUG}"
fi

log "2/7 - codigo da aplicacao"
if [[ -d "${APP_DIR}/.git" ]]; then
  runuser -u "${APP_USER}" -- git -C "${APP_DIR}" pull --ff-only
else
  install -d -m 750 -o "${APP_USER}" -g "${APP_USER}" "${APP_HOME}"
  runuser -u "${APP_USER}" -- git clone "${REPO_URL}" "${APP_DIR}"
fi

log "3/7 - variaveis de ambiente"
if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Arquivo ${ENV_FILE} nao encontrado. Rode 'sudo criar-app ${APP_SLUG}'." >&2
  exit 1
fi

if ! grep -q '^PORT=' "${ENV_FILE}"; then
  DEMO_PASSWORD="$(openssl rand -base64 48 | tr -dc 'A-Za-z0-9' | head -c 24)"
  cat >> "${ENV_FILE}" <<EOF
PORT=${API_PORT}
APP_URL=${PUBLIC_URL}
CORS_ORIGINS=${PUBLIC_URL},${WWW_URL}
COOKIE_SECURE=true
MOCK_LATENCY_MS=0
DEMO_PASSWORD=${DEMO_PASSWORD}
EOF

  umask 077
  cat > "${CRED_FILE}" <<EOF
PWA Prefeitura Digital - credenciais do painel de gestao
Gerado em: $(date -Is)

Contas demonstrativas (mesma senha):
  admin@prefeitura.demo
  triagem@prefeitura.demo
  obras@prefeitura.demo
  zeladoria@prefeitura.demo
  ambiente@prefeitura.demo
  fiscalizacao@prefeitura.demo
  mobilidade@prefeitura.demo
  ouvidoria@prefeitura.demo

Senha: ${DEMO_PASSWORD}

Troque a senha pelo painel em /gestao/configuracoes e mantenha este arquivo
fora de qualquer repositorio. Para recriar as contas semente com outra senha,
remova DEMO_PASSWORD do ${ENV_FILE}, apague backend/data/estado.json e
reinicie o PM2 (isso perde os dados do piloto).
EOF
  chmod 600 "${CRED_FILE}"
  echo "Credenciais iniciais gravadas em ${CRED_FILE} (modo 600)."
else
  echo "Variaveis de aplicacao ja configuradas em ${ENV_FILE}."
fi

chown "${APP_USER}:${APP_USER}" "${ENV_FILE}"
chmod 600 "${ENV_FILE}"

log "4/7 - dependencias e build"
runuser -u "${APP_USER}" -- bash -lc "
  set -euo pipefail
  cd '${APP_DIR}'
  npm --prefix backend ci --no-audit --no-fund
  npm --prefix frontend ci --no-audit --no-fund
  npm --prefix frontend run build
"

log "5/7 - processo PM2"
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

if ! systemctl is-enabled "pm2-${APP_USER}" >/dev/null 2>&1; then
  pm2 startup systemd -u "${APP_USER}" --hp "${APP_HOME}" >/dev/null
fi
systemctl enable "pm2-${APP_USER}" >/dev/null 2>&1 || true

log "6/7 - firewall (somente a rede proxy acessa a API)"
ufw allow from "${PROXY_SUBNET}" to any port "${API_PORT}" proto tcp \
  comment "proxy -> ${APP_SLUG}" >/dev/null

log "7/7 - gateway nginx na rede ${PROXY_NETWORK}"
install -d -m 755 /opt/digital-home/conf
install -m 644 "${APP_DIR}/deploy/nginx/digital-home.conf" /opt/digital-home/conf/default.conf

docker rm -f "${NGINX_CONTAINER}" >/dev/null 2>&1 || true
docker run -d \
  --name "${NGINX_CONTAINER}" \
  --restart unless-stopped \
  --network "${PROXY_NETWORK}" \
  --add-host host.docker.internal:host-gateway \
  -v "${APP_DIR}/frontend/dist:/usr/share/nginx/html:ro" \
  -v "/opt/digital-home/conf/default.conf:/etc/nginx/conf.d/default.conf:ro" \
  "${NGINX_IMAGE}" >/dev/null

log "verificacao"
for _ in $(seq 1 30); do
  if docker exec "${NGINX_CONTAINER}" wget -qO- "http://127.0.0.1/api/health" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
docker exec "${NGINX_CONTAINER}" wget -qO- "http://127.0.0.1/api/health"
echo
runuser -u "${APP_USER}" -- pm2 status

echo
echo "Publicado: ${PUBLIC_URL}"
echo "API interna: http://host.docker.internal:${API_PORT} (via nginx)"
echo "Credenciais: ${CRED_FILE}"
