# Deploy do PWA Prefeitura Digital

Documentacao do ambiente publicado em `https://digital.cujubim.ro.gov.br`.

Para a visao completa do servidor (dados de hardware, rede, firewall, pastas,
usuarios, MySQL, tunel, backup, diagnostico e credenciais), consulte
[`doc/05-infraestrutura-servidor.md`](../doc/05-infraestrutura-servidor.md).
Este README e o runbook resumido do dia a dia.

## Arquitetura

```text
Internet
  └─ Cloudflare (HTTPS, DNS)
       └─ Cloudflare Tunnel (container cloudflared, rede proxy)
            └─ http://digital-home:80 (nginx)
                 ├─ /        → build do frontend (frontend/dist)
                 └─ /api/    → http://host.docker.internal:3000 (Express/PM2)
```

| Componente | Onde roda | Observacao |
|---|---|---|
| `cloudflared` | container na rede `proxy` | tunel `digital.cujubim` |
| `digital-home` | container `nginx:alpine` na rede `proxy` | entrega o SPA e faz proxy da API |
| API Express | host, via PM2 | usuario Linux `app-pwa-prefeitura` |
| MySQL 8.4 | host, `127.0.0.1:3306` | banco `app_pwa_prefeitura`: catalogo e dados do piloto |
| Ollama | host, `127.0.0.1:11434` | modelo local `qwen3:1.7b`, pensamento desativado |
| `estado.json` | `backend/data/` | legado; importado uma unica vez na primeira carga do MySQL |

O firewall libera a porta `3000` apenas para a sub-rede `172.18.0.0/16`
(rede `proxy`). A LAN e a internet nao acessam a API diretamente.

## Primeira instalacao

Pre-requisitos ja provisionados no servidor: Docker, Node 24, PM2, MySQL,
`criar-app`, rede `proxy` e o tunel Cloudflare.

```bash
# como root, dentro do clone do repositorio
sudo bash deploy/instalar.sh
```

O script:

1. cria o usuario Linux e o banco MySQL com `criar-app` (se ainda nao existirem);
2. clona ou atualiza o repositorio em `/home/app-pwa-prefeitura/app`;
3. gera as variaveis da aplicacao e uma senha forte para as contas demo;
4. instala dependencias e gera o build do frontend;
5. inicia o processo `pwa-prefeitura` no PM2 e habilita o boot;
6. libera a porta da API somente para a rede `proxy`;
7. recria o container `digital-home` com o nginx e o build atual.

As credenciais iniciais do painel ficam em
`/root/pwa-prefeitura-credenciais.txt` (modo `600`). A senha e definida por
`DEMO_PASSWORD` na primeira inicializacao. Para troca-la, remova a variavel,
apague `backend/data/estado.json` e reinicie o PM2 (isso recria as contas
semente e perde os dados do piloto). Novos usuarios podem ser criados pelo
painel.

## Atualizacao

O fluxo de desenvolvimento e: alterar e testar na maquina local, commitar,
enviar para o GitHub e atualizar o servidor.

```bash
git push origin main          # na maquina de desenvolvimento

# no servidor, como root
sudo bash deploy/atualizar.sh
```

O script faz `git pull --ff-only`, `npm ci`, build do frontend, recarrega o
nginx e reinicia o PM2. O arquivo `backend/data/estado.json` e preservado.

## Operacao

```bash
# status e logs da API
sudo systemctl status pm2-app-pwa-prefeitura
sudo systemctl restart pm2-app-pwa-prefeitura
sudo -u app-pwa-prefeitura -H pm2 status
sudo -u app-pwa-prefeitura -H pm2 logs pwa-prefeitura --lines 100

# logs e teste do gateway
docker logs digital-home --tail 100
docker exec digital-home wget -qO- http://127.0.0.1/api/health

# teste publico
curl -fsS https://digital.cujubim.ro.gov.br/api/health
```

### Variaveis de ambiente

Arquivo real: `/home/app-pwa-prefeitura/.config/app.env` (modo `600`).
Modelo comentado: [`deploy/app.env.example`](./app.env.example).

| Variavel | Uso |
|---|---|
| `PORT` | porta da API (padrao `3000`) |
| `APP_URL` | URL publica usada em e-mails |
| `CORS_ORIGINS` | origens permitidas pelo CORS |
| `COOKIE_SECURE` | envia o cookie de sessao apenas por HTTPS |
| `MOCK_LATENCY_MS` | latencia artificial (`0` em producao) |
| `DEMO_PASSWORD` | senha das contas semente na primeira inicializacao |

### Dados

- Fonte principal: MySQL `app_pwa_prefeitura` (catalogo, solicitacoes, usuarios, sessoes, configuracoes
  e contas de cidadaos).
- O `backend/data/estado.json` existente e importado automaticamente no primeiro start com o banco
  vazio; nas inicializacoes seguintes ele nao e mais lido nem regravado.
- Dados pessoais de cidadaos ficam em `dados_cidadaos` e `dados_cidadaos_sessoes`; sessoes expiradas sao
  removidas na inicializacao. A exclusao de conta anonimiza o cadastro e revoga as sessoes.
- Backup do banco: `mysqldump` do schema `app_pwa_prefeitura`.
- O diretorio `backend/data/` e ignorado pelo Git.

Para backup manual:

```bash
sudo mysqldump --single-transaction app_pwa_prefeitura \
  | gzip > /root/pwa-prefeitura-dados-$(date +%F).sql.gz
```

### IA local (Ollama)

```bash
sudo bash deploy/instalar-ollama.sh
```

O script instala o Ollama, habilita o servico, baixa `qwen3:1.7b` e valida a API com
`think: false`. No painel, escolha o provedor **Ollama**, modelo `qwen3:1.7b` e URL
`http://127.0.0.1:11434`, depois use **Testar IA**.

A classificacao roda em fila depois de o pedido ser gravado. Ajuste com
`TRIAGEM_FILA_CONCORRENCIA` (padrao `1`), `TRIAGEM_FILA_AVISO` (padrao `2`) e
`TRIAGEM_FILA_MAX` (padrao `20`).

### Privacidade e LGPD

- O Aviso de Privacidade fica em `/privacidade` e a versao aceita no cadastro e registrada no banco.
- Rotas `/api/cidadao` exigem sessao propria, respondem `no-store` e nao entram no cache do nginx ou do
  Service Worker.
- O backup do banco inclui dados pessoais: guarde os arquivos em `/root/backups` com permissao restrita e
  defina prazo de descarte.

## Cloudflare

Rota do tunel:

| Hostname | Servico |
|---|---|
| `digital.cujubim.ro.gov.br` | `http://digital-home:80` |
| `www.digital.cujubim.ro.gov.br` | `http://digital-home:80` |

O `www.digital` depende de um certificado que cubra dois niveis de subdominio
(Total TLS ou Advanced Certificate Manager). Sem isso, o handshake TLS falha
antes de chegar ao nginx.

## Solucao de problemas

| Sintoma | Verificacao |
|---|---|
| `502 Bad Gateway` | `pm2 status` e `docker exec digital-home wget -qO- http://127.0.0.1/api/health` |
| API responde mas o site nao | conferir o bind mount de `frontend/dist` e `nginx -t` |
| Login nao mantem sessao | `COOKIE_SECURE=true` exige HTTPS; testar pelo dominio publico |
| `413` ao enviar foto | `client_max_body_size` do nginx (3 MB) e limite do Express (2 MB) |
| Erro de certificado em `www.digital` | habilitar Total TLS/ACM na Cloudflare |
