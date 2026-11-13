# Deploy do PWA Prefeitura Digital

Documentacao do ambiente publicado em `https://digital.cujubim.ro.gov.br`.

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
| MySQL 8.4 | host, `127.0.0.1:3306` | banco `app_pwa_prefeitura`, reservado para a evolucao |
| Dados do piloto | `backend/data/estado.json` | persistencia JSON versionada pelo proprio codigo |

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
`/root/pwa-prefeitura-credenciais.txt` (modo `600`). Troque a senha no painel
`/gestao/configuracoes` depois do primeiro acesso.

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

- Arquivo principal: `/home/app-pwa-prefeitura/app/backend/data/estado.json`
- Backup automatico: `estado.json.bak`
- O diretorio `backend/data/` e ignorado pelo Git.

Para backup manual:

```bash
sudo -u app-pwa-prefeitura tar -czf /root/pwa-prefeitura-dados-$(date +%F).tgz \
  -C /home/app-pwa-prefeitura/app/backend data
```

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
