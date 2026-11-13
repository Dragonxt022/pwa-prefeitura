#!/usr/bin/env bash
# Instala e valida o Ollama com o modelo local de triagem.
#
# Uso (como root):
#   sudo bash deploy/instalar-ollama.sh
#
# Idempotente: nao reinstala o Ollama se ele ja estiver presente e apenas baixa
# o modelo quando necessario. O modo de pensamento do Qwen3 fica desativado
# (`think: false`), que e o mesmo parametro usado pela aplicacao.
set -euo pipefail

MODELO="${OLLAMA_MODEL:-qwen3:1.7b}"
BASE_URL="${OLLAMA_URL:-http://127.0.0.1:11434}"

log() {
  echo
  echo "==> $*"
}

if [[ ${EUID} -ne 0 ]]; then
  echo "Execute como root: sudo bash deploy/instalar-ollama.sh" >&2
  exit 1
fi

log "1/4 - instalacao"
if command -v ollama >/dev/null 2>&1; then
  echo "Ollama ja instalado: $(ollama --version 2>/dev/null | head -n 1)"
else
  curl -fsSL https://ollama.com/install.sh | sh
fi
systemctl enable --now ollama

log "2/4 - aguardando a API"
for _ in $(seq 1 60); do
  if curl -fsS "${BASE_URL}/api/version" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done
curl -fsS "${BASE_URL}/api/version"
echo

log "3/4 - modelo ${MODELO}"
ollama pull "${MODELO}"

log "4/4 - validacao com pensamento desativado"
RESPOSTA="$(curl -fsS "${BASE_URL}/api/chat" \
  -H 'Content-Type: application/json' \
  -d "{\"model\":\"${MODELO}\",\"stream\":false,\"think\":false,\"keep_alive\":\"30m\",\"messages\":[{\"role\":\"user\",\"content\":\"Responda apenas com a palavra ok.\"}]}")"

if ! grep -q '"content"' <<<"${RESPOSTA}"; then
  echo "Resposta inesperada do Ollama: ${RESPOSTA}" >&2
  exit 1
fi

if grep -q '"thinking"' <<<"${RESPOSTA}"; then
  echo "O modelo devolveu raciocinio mesmo com think:false: ${RESPOSTA}" >&2
  exit 1
fi

echo "${RESPOSTA}"
echo
echo "Ollama pronto em ${BASE_URL} com ${MODELO}, sem modo de pensamento."
echo "No painel: Configuracoes -> IA -> provedor Ollama, modelo ${MODELO}, URL ${BASE_URL}."
