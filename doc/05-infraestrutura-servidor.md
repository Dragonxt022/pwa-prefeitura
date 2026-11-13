# 05 — Infraestrutura do servidor e operação

| Campo | Valor |
|---|---|
| Documento | Infraestrutura, deploy e operação do servidor |
| Versão | 1.0 |
| Data | 13/11/2026 |
| Status | Ambiente publicado e validado (inclui teste de reboot) |
| Responsável | Equipe de TI / Infraestrutura |
| Referências | [deploy/README.md](../deploy/README.md) · [01](01-projeto-inicial.md) · [02](02-requisitos.md) · [03](03-plano-execucao.md) · [04](04-validacao.md) |

> **Este documento não contém senhas nem tokens.** Ele é versionado no GitHub.
> As credenciais reais ficam apenas no servidor, em
> `/root/infraestrutura-credenciais.md` (modo `600`). Veja a seção
> [Credenciais](#13-credenciais).

> **Atenção:** o repositório `Dragonxt022/pwa-prefeitura` é público. Este arquivo
> descreve a topologia interna da prefeitura. Se a organização exigir sigilo
> dessa topologia, mova este documento para um repositório privado.

---

## 1. Visão geral

O servidor `192.168.0.116` hospeda o piloto **Prefeitura Digital** e a
infraestrutura de publicação via Cloudflare Tunnel. Ele também executa o
Portainer para administração dos containers e o MySQL 8.4 para as aplicações
que vierem a utilizá-lo.

| Recurso | Endereço |
|---|---|
| Site publicado | <https://digital.cujubim.ro.gov.br> |
| Painel de gestão | <https://digital.cujubim.ro.gov.br/gestao> |
| Health check da API | <https://digital.cujubim.ro.gov.br/api/health> |
| Portainer | <https://192.168.0.116:9443> |
| Cloudflare Zero Trust | <https://one.dash.cloudflare.com/9e1efa8f7b498b3f6d4fcd9946ab9968> |
| Repositório | <https://github.com/Dragonxt022/pwa-prefeitura> |
| Acesso SSH | `ssh administrador@192.168.0.116` |

O `www.digital.cujubim.ro.gov.br` está roteado no túnel, mas ainda não abre em
HTTPS porque o certificado da Cloudflare cobre apenas um nível de subdomínio.
Veja [pendências](#15-pendências-e-próximos-passos).

---

## 2. Dados do servidor

| Item | Valor |
|---|---|
| Hostname | `admin` |
| IP na LAN | `192.168.0.116/24` |
| Gateway | `192.168.0.3` |
| Servidores DNS | `192.168.0.3`, `170.79.87.11`, `8.8.8.8` |
| Sistema operacional | Ubuntu 26.04.1 LTS |
| Kernel | `7.0.0-43-generic` |
| Arquitetura | x86-64 |
| CPU | Intel Core i5-7200U, 4 vCPUs (2 núcleos, 2 threads/núcleo) |
| Memória | 15 GiB |
| Disco | 98 GB no LVM raiz (≈ 84 GB livres em 13/11/2026) |
| Fuso horário | `America/Sao_Paulo` (UTC−03) |
| SSH | porta 22, autenticação por senha habilitada |
| Usuário administrativo | `administrador` (grupos `sudo` e `docker`) |

### Serviços e versões

| Software | Versão | Observação |
|---|---|---|
| Docker Engine | 29.1.3 | containers e rede `proxy` |
| Docker Compose | 2.40.3 | disponível, não usado no deploy atual |
| Node.js | 24.22.3 | runtime do backend e build do frontend |
| npm | 11.19.1 | instalação de dependências |
| PM2 | 7.1.2 | processo do backend, supervisionado pelo systemd |
| MySQL Server | 8.4.13 | escuta apenas em `127.0.0.1` |
| Git | 2.53.0 | clone e atualização do repositório |
| Portainer CE | `portainer/portainer-ce:lts` (2.45.3) | administração de containers |
| cloudflared | `cloudflare/cloudflared:latest` | túnel `digital.cujubim` |
| nginx | `nginx:alpine` | gateway público do PWA |

---

## 3. Arquitetura

```text
Internet
  │  HTTPS (Cloudflare edge)
  ▼
Cloudflare DNS + Tunnel "digital.cujubim"
  │  conexões QUIC de saída (sem portas inbound)
  ▼
Container cloudflared  ── rede Docker "proxy" ──┐
  │  http://digital-home:80                     │
  ▼                                             │
Container digital-home (nginx:alpine)           │
  ├── /            → /usr/share/nginx/html      │  bind mount:
  │                    (frontend/dist)           │  /home/app-pwa-prefeitura/app/frontend/dist
  └── /api/        → http://host.docker.internal:3000
                        │
                        ▼
              Host: PM2 + Node.js (Express)
              usuário app-pwa-prefeitura
              /home/app-pwa-prefeitura/app/backend
                        │
                        ├── backend/data/estado.json (solicitações, usuários, sessões e configurações)
                        └── MySQL 127.0.0.1:3306 (catálogo administrativo)
```

### Componentes

| Componente | Onde roda | Responsabilidade |
|---|---|---|
| `cloudflared` | container na rede `proxy` | mantém o túnel com a Cloudflare |
| `digital-home` | container `nginx:alpine` na rede `proxy` | entrega o SPA e faz proxy de `/api` |
| API Express | host, via PM2/systemd | regras de negócio, autenticação e persistência |
| MySQL 8.4 | host, `127.0.0.1:3306` | catálogo de secretarias, setores, serviços e auditoria |
| `portainer` | container na rede `proxy` | administração visual do Docker |
| PM2 | host, usuário `app-pwa-prefeitura` | gerencia o processo Node |
| systemd | host | sobe o PM2 no boot e reinicia em caso de falha |

---

## 4. Rede, DNS e firewall

### Rede local e Docker

| Item | Valor |
|---|---|
| Interface LAN | `enp1s0` — `192.168.0.116/24` |
| Gateway da LAN | `192.168.0.3` |
| Rede Docker `proxy` | `172.18.0.0/16` |
| Gateway da rede `proxy` | `172.18.0.1` |
| Containers na `proxy` | `digital-home` (`.2`), `portainer` (`.3`), `cloudflared` (`.4`) |
| Rede Docker padrão | `docker0` — `172.17.0.1/16` (não usada pelo deploy) |

Os IPs dos containers são dinâmicos. **Sempre use o nome do container** nas
rotas do túnel e nas configurações do nginx (`digital-home:80`,
`portainer:9443`), nunca o IP.

### Portas e exposição

| Porta | Serviço | Exposição |
|---|---|---|
| `22/tcp` | SSH | LAN (UFW permite) |
| `9443/tcp` | Portainer | LAN — publicada pelo Docker, que contorna o UFW |
| `3000/tcp` | API Express | somente `172.18.0.0/16` (UFW) |
| `3306/tcp` | MySQL | somente `127.0.0.1` |
| `80/tcp` | nginx `digital-home` | apenas dentro da rede `proxy` (sem porta publicada) |
| `443/tcp` | Cloudflare | internet, terminada na borda da Cloudflare |

### UFW

```text
[ 1] 22/tcp       ALLOW IN    Anywhere
[ 2] 3000/tcp     ALLOW IN    172.18.0.0/16   # proxy -> pwa-prefeitura
[ 3] 22/tcp (v6)  ALLOW IN    Anywhere (v6)
```

Regras padrão: negar entrada, permitir saída. O Docker publica portas
diretamente via iptables e **não** é filtrado pelo UFW; por isso o `9443` do
Portainer fica acessível na LAN mesmo com o UFW ativo.

### Zona DNS e túnel

| Item | Valor |
|---|---|
| Zona | `cujubim.ro.gov.br` |
| Nameservers | `robin.ns.cloudflare.com`, `julian.ns.cloudflare.com` |
| Túnel | `digital.cujubim` |
| Tunnel ID | `c5bc9814-5066-45fa-8f34-baa06a7024b0` |
| Account ID | `9e1efa8f7b498b3f6d4fcd9946ab9968` |
| CNAME do túnel | `c5bc9814-5066-45fa-8f34-baa06a7024b0.cfargotunnel.com` |
| Token do túnel | somente em `/root/infraestrutura-credenciais.md` |

Rotas publicadas:

| Hostname | Serviço de destino | Situação |
|---|---|---|
| `digital.cujubim.ro.gov.br` | `http://digital-home:80` | **funcionando** |
| `www.digital.cujubim.ro.gov.br` | `http://digital-home:80` | rota criada, TLS pendente |

O certificado Universal SSL atual cobre `cujubim.ro.gov.br` e
`*.cujubim.ro.gov.br`. Não cobre `www.digital.cujubim.ro.gov.br` (dois níveis).
Para liberar, habilitar **Total TLS** ou **Advanced Certificate Manager** na
zona. O teste de TLS retorna `SSL alert 40 (handshake failure)` antes de chegar
ao nginx.

### DNS na estação Windows do administrador

O DNS interno `192.168.0.3` e o DNS `170.79.87.11` responderam `NXDOMAIN` para
o novo hostname enquanto `8.8.8.8` e `1.1.1.1` resolviam. Foi criada uma regra
**NRPT** apenas para `.cujubim.ro.gov.br` na estação `bruno\administrador`:

```powershell
# verificar
Get-DnsClientNrptRule | Where-Object { $_.Namespace -like '*cujubim*' }

# recriar (PowerShell como administrador)
Add-DnsClientNrptRule -Namespace ".cujubim.ro.gov.br" `
  -NameServers "1.1.1.1","1.0.0.1" `
  -Comment "Digital Cujubim - contorna cache negativo do DNS local"

ipconfig /flushdns
```

Regra existente: `{6A687ACE-E87F-48CE-9433-DB389B8E6257}`. Isso é um contorno
local; a correção definitiva é ajustar o DNS interno da rede.

---

## 5. Estrutura de pastas do servidor

```text
/usr/local/sbin/criar-app                  # provisiona usuário Linux + banco + env + PM2
/usr/local/sbin/                           # scripts administrativos
/etc/systemd/system/
└── pm2-app-pwa-prefeitura.service         # serviço que sobe o PM2 no boot

/opt/digital-home/
├── conf/
│   └── default.conf                       # configuração do nginx (gateway)
└── html/                                  # página de construção antiga (legado, não usada)

/root/
├── portainer-admin.txt                    # credenciais do Portainer (600)
├── pwa-prefeitura-credenciais.txt         # contas do painel PWA (600)
└── infraestrutura-credenciais.md          # consolidação das credenciais (600)

/home/app-pwa-prefeitura/                  # usuário Linux dedicado (750)
├── .config/
│   └── app.env                            # variáveis e segredos da aplicação (600)
├── .pm2/                                  # daemon, dump e logs do PM2
│   └── logs/
│       ├── pwa-prefeitura-out.log
│       └── pwa-prefeitura-error.log
└── app/                                   # clone do repositório (750)
    ├── backend/
    │   ├── server.js                      # entrypoint da API (porta 3000)
    │   ├── src/                           # rotas, controladores, serviços...
    │   └── data/
    │       ├── estado.json                # dados do piloto (runtime)
    │       └── estado.json.bak            # backup automático da última versão válida
    ├── frontend/
    │   ├── src/
    │   └── dist/                          # build do Vite (servido pelo nginx)
    ├── deploy/
    │   ├── instalar.sh                    # instalação idempotente
    │   ├── atualizar.sh                   # atualização a partir do Git
    │   ├── nginx/digital-home.conf        # fonte da config do gateway
    │   ├── app.env.example                # modelo das variáveis
    │   └── README.md                      # runbook resumido
    ├── doc/                               # esta documentação
    └── .github/workflows/ci.yml           # CI (lint, testes, build, E2E)
```

### Regras de organização

**No servidor:**

- Cada aplicação tem um usuário Linux `app-<slug>` e um banco `app_<slug>`.
- O código fica em `/home/app-<slug>/app`; nada de rodar como `root`.
- Segredos da aplicação ficam em `/home/app-<slug>/.config/app.env` (modo `600`).
- Credenciais administrativas ficam em `/root/*.txt` ou
  `/root/infraestrutura-credenciais.md` (modo `600`).
- Configuração de gateway fica em `/opt/<gateway>/conf`, montada como diretório
  (não como arquivo único) em `/etc/nginx/conf.d`.
- Dados de runtime não entram no Git (`backend/data/` é ignorado).
- Build não entra no Git (`frontend/dist/` é ignorado).

**No código (resumo do [AGENTS.md](../AGENTS.md)):**

- Backend: `rotas` (endpoints), `controladores` (HTTP), `servicos` (regras),
  `repositorios` (persistência), `middlewares`, `dominio`, `validadores`,
  `apresentadores`, `utils`.
- Frontend: `componentes`, `paginas`, `servicos` (HTTP/API), `hooks`, `utils`,
  `estilos`, `contexto`, `i18n`.
- Rotas não contêm regra de negócio; serviços não importam Express; o frontend
  não faz `fetch` disperso em componentes.
- Nomes de pastas, código, mensagens e interface em português.

---

## 6. Usuários e permissões

| Usuário | Uso | Grupos | Particularidades |
|---|---|---|---|
| `administrador` | acesso humano e administração | `sudo`, `docker` | senha de teste deve ser trocada |
| `app-pwa-prefeitura` | dono do processo e dos arquivos da aplicação | próprio | sem senha de login; shell `/bin/bash` |
| `root` | administração do sistema | — | login SSH por senha desabilitado (`prohibit-password`) |
| `app_pwa_prefeitura@localhost` | usuário MySQL da aplicação | — | senha em `app.env`; acesso local |
| `root@localhost` | administração do MySQL | — | `auth_socket`; usar `sudo mysql` |

Permissões relevantes:

```text
750 app-pwa-prefeitura:app-pwa-prefeitura /home/app-pwa-prefeitura
750 app-pwa-prefeitura:app-pwa-prefeitura /home/app-pwa-prefeitura/app
700 app-pwa-prefeitura:app-pwa-prefeitura /home/app-pwa-prefeitura/.config
600 app-pwa-prefeitura:app-pwa-prefeitura /home/app-pwa-prefeitura/.config/app.env
644 root:root                            /opt/digital-home/conf/default.conf
```

O diretório `backend/data` é criado com `755`, mas fica dentro de
`/home/app-pwa-prefeitura` (`750`), portanto não é acessível por outros usuários
sem privilégio.

---

## 7. Aplicação PWA

### Identificação

| Item | Valor |
|---|---|
| Nome | Prefeitura Digital — piloto |
| Versão | 0.1.0 |
| Repositório | `https://github.com/Dragonxt022/pwa-prefeitura` |
| Branch | `main` |
| Diretório no servidor | `/home/app-pwa-prefeitura/app` |
| Frontend | React 19 + Vite 8 + vite-plugin-pwa 2 |
| Backend | Express 5 (ESM) + MySQL (`mysql2`) + JSON |
| Processo | PM2 `pwa-prefeitura` (systemd `pm2-app-pwa-prefeitura.service`) |
| Porta interna | `3000` |
| Dados | Catálogo no MySQL; demais dados em `backend/data/estado.json` (+ `.bak`) |

O piloto usa dados fictícios. **Não inserir dados pessoais reais** sem revisar
a política de privacidade e a segurança do ambiente.

### Rotas e serviços

| Caminho | Destino |
|---|---|
| `/` | SPA (React Router) |
| `/servicos`, `/acompanhar`, `/perfil`, `/gestao` | SPA com fallback para `index.html` |
| `/api/health` | status da API |
| `/api/servicos`, `/api/avisos`, `/api/configuracoes`, `/api/perfil` | API pública |
| `/api/solicitacoes` | criação e consulta de solicitações |
| `/api/gestao/*` | autenticação e painel de gestão |

### Variáveis de ambiente

Arquivo real: `/home/app-pwa-prefeitura/.config/app.env` (modo `600`).
Modelo: [`deploy/app.env.example`](../deploy/app.env.example).

| Variável | Uso |
|---|---|
| `APP_NAME` | nome lógico da aplicação (`pwa-prefeitura`) |
| `APP_DIR` | diretório da aplicação |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | banco MySQL do catálogo |
| `DB_POOL_SIZE` | conexões simultâneas do pool (`5`) |
| `PORT` | porta da API (`3000`) |
| `APP_URL` | URL pública usada em e-mails |
| `CORS_ORIGINS` | origens permitidas |
| `COOKIE_SECURE` | cookie de sessão apenas em HTTPS (`true`) |
| `MOCK_LATENCY_MS` | latência artificial (`0` em produção) |
| `DEMO_PASSWORD` | senha das contas semente na primeira inicialização |

> O catálogo administrativo usa as variáveis `DB_*`. Sem elas, o backend inicia
> com o catálogo em memória (apenas para desenvolvimento); em produção o painel
> exibe “Memória” e as alterações não sobrevivem a reinícios.

### Contas de demonstração

Todas usam a mesma senha, definida por `DEMO_PASSWORD`:

```text
admin@prefeitura.demo          (admin)
triagem@prefeitura.demo        (triagem)
obras@prefeitura.demo          (setor)
zeladoria@prefeitura.demo      (setor)
ambiente@prefeitura.demo       (setor)
fiscalizacao@prefeitura.demo   (setor)
mobilidade@prefeitura.demo     (setor)
```

A senha **não** está neste documento. Consulte a seção
[Credenciais](#13-credenciais).

### Persistência e backup

- Catálogo: tabelas `catalogo_secretarias`, `catalogo_setores`, `catalogo_servicos`
  e `catalogo_auditoria` no MySQL. O schema e as sementes são criados de forma
  idempotente na inicialização; `INSERT IGNORE` não sobrescreve edições do painel.
- JSON: gravação atômica (arquivo temporário + `fsync` + `rename`) e backup
  automático `estado.json.bak` antes de cada gravação válida.
- Se o JSON principal estiver corrompido, o backend tenta o `.bak`; se ambos forem
  inválidos, o processo falha para não perder dados silenciosamente.
- Não há backup externo agendado. Veja a seção [Backup](#12-backup-e-restauração).

### PWA

- Manifest: `/manifest.webmanifest` (`application/manifest+json`).
- Service Worker: `/sw.js`, sem cache para `/api/gestao` e `/api/solicitacoes`.
- Ícones em `/icons/` (192, 512 e maskable).
- Instalável em Chrome/Edge; requer HTTPS (atendido pela Cloudflare).

---

## 8. Portainer

| Item | Valor |
|---|---|
| Imagem | `portainer/portainer-ce:lts` (2.45.3) |
| Container | `portainer` |
| Rede | `proxy` |
| Porta publicada | `9443` (HTTPS) |
| Volume | `portainer_data` → `/data` |
| Socket | `/var/run/docker.sock` |
| Política de restart | `unless-stopped` |
| URL | <https://192.168.0.116:9443> |
| Usuário | `admin` |
| Senha | `/root/infraestrutura-credenciais.md` (seção Portainer) |

O certificado do Portainer é autoassinado; o navegador exibirá aviso. O
Portainer fica acessível na LAN e **não** é filtrado pelo UFW porque a porta é
publicada pelo Docker.

Atualização (quando necessário):

```bash
sudo docker pull portainer/portainer-ce:lts
sudo docker stop portainer
sudo docker rename portainer portainer-antigo
sudo docker run -d --name portainer --restart unless-stopped \
  --network proxy -p 9443:9443 \
  -v portainer_data:/data \
  -v /var/run/docker.sock:/var/run/docker.sock \
  portainer/portainer-ce:lts
# validar https://192.168.0.116:9443 e depois remover o container antigo
sudo docker rm portainer-antigo
```

---

## 9. MySQL

| Item | Valor |
|---|---|
| Versão | 8.4.13 |
| Escuta | `127.0.0.1:3306` (e socket local) |
| Root | `root@localhost` via `auth_socket` — `sudo mysql` |
| Banco da aplicação | `app_pwa_prefeitura` |
| Usuário da aplicação | `app_pwa_prefeitura@localhost` |
| Senha da aplicação | `DB_PASSWORD` em `app.env` / credenciais no servidor |
| Uso atual | catálogo, solicitações, usuários, sessões, configurações, contas e sessões de cidadãos |

Comandos:

```bash
# entrar como root (sem senha, via socket)
sudo mysql

# entrar no banco da aplicação
sudo mysql app_pwa_prefeitura

# conferir catálogo e dados
sudo mysql app_pwa_prefeitura -e "SELECT COUNT(*) AS secretarias FROM catalogo_secretarias;"
sudo mysql app_pwa_prefeitura -e "SELECT entidade, acao, usuario_nome, em FROM catalogo_auditoria ORDER BY em DESC LIMIT 10;"
sudo mysql app_pwa_prefeitura -e "SELECT COUNT(*) AS solicitacoes FROM dados_solicitacoes;"
sudo mysql app_pwa_prefeitura -e "SELECT COUNT(*) AS usuarios FROM dados_usuarios;"

# backup antes de qualquer migração
sudo mysqldump --single-transaction app_pwa_prefeitura | gzip > /root/pwa-dados-$(date +%F).sql.gz

# listar bancos e usuários
sudo mysql -e "SHOW DATABASES; SELECT user,host FROM mysql.user;"

# testar o usuário da aplicação (senha em app.env)
sudo grep '^DB_PASSWORD=' /home/app-pwa-prefeitura/.config/app.env
mysql -u app_pwa_prefeitura -p app_pwa_prefeitura -e "SELECT 1;"
```

O MySQL não é acessível a partir dos containers da rede `proxy`; se uma
aplicação em container precisar do banco, será necessário um proxy ou uma
decisão explícita de exposição (não fazer isso sem revisar o firewall).

### Dados de cidadãos e LGPD

As contas ficam em `dados_cidadaos` e as sessões em `dados_cidadaos_sessoes`. Senhas usam hash
`scrypt`; sessões expiradas são removidas na inicialização. A exclusão de conta (feita pelo próprio
cidadão em `/perfil`, com confirmação de senha) apaga nome, e-mail, telefone e endereço, anula o hash
da senha, marca `removido_em` e revoga todas as sessões. Registros de solicitações já abertas
permanecem para a finalidade do atendimento público, conforme o Aviso de Privacidade em
`/privacidade`.

Backups do MySQL contêm dados pessoais. Mantenha-os em `/root/backups` com permissão restrita
(`chmod 600`) e descarte conforme a política de retenção do município.

A primeira inicialização com o banco vazio importa `backend/data/estado.json`
em uma transação (solicitações, usuários, sessões, configurações e sequência de
protocolos). Reinícios seguintes leem apenas o MySQL. O arquivo JSON fica
preservado como cópia histórica e não é mais atualizado.

### IA local (Ollama)

| Item | Valor |
|---|---|
| Serviço | `ollama` (systemd), `127.0.0.1:11434` |
| Modelo | `qwen3:1.7b` |
| Pensamento | desativado (`think: false` na API `/api/chat`) |
| Instalação | `sudo bash deploy/instalar-ollama.sh` |

A aplicação usa a API nativa do Ollama, não o endpoint `/v1`, justamente para
enviar `think: false`. A configuração fica em Configurações → IA (provedor
Ollama, modelo `qwen3:1.7b`, URL `http://127.0.0.1:11434`).

```bash
sudo systemctl status ollama
curl -s http://127.0.0.1:11434/api/version
sudo -u ollama ollama list
```

---

## 10. Cloudflare Tunnel

| Item | Valor |
|---|---|
| Nome | `digital.cujubim` |
| Tunnel ID | `c5bc9814-5066-45fa-8f34-baa06a7024b0` |
| Account ID | `9e1efa8f7b498b3f6d4fcd9946ab9968` |
| Container | `cloudflared` |
| Imagem | `cloudflare/cloudflared:latest` |
| Rede | `proxy` |
| Comando | `tunnel --no-autoupdate run --token <token>` |
| Token | `/root/infraestrutura-credenciais.md` |
| Política de restart | `unless-stopped` |

Verificação:

```bash
# conexões registradas
sudo docker logs --since 10m cloudflared 2>&1 | grep "Registered tunnel connection"

# métrica de conexões HA (esperado: 4)
sudo docker run --rm --network container:cloudflared curlimages/curl:latest \
  -s http://127.0.0.1:20241/metrics | grep cloudflared_tunnel_ha_connections
```

O token do túnel **não** permite criar DNS ou rotas via API REST (testado:
`Authentication failed`, código `9106`). Para automatizar a criação de rotas é
necessário um API Token temporário com `Cloudflare Tunnel: Edit` e `DNS: Edit`.

### Recriar o container do túnel

O token está no arquivo de credenciais. O comando é:

```bash
sudo docker rm -f cloudflared
sudo docker run -d --name cloudflared --restart unless-stopped \
  --network proxy \
  cloudflare/cloudflared:latest tunnel --no-autoupdate run --token "<TOKEN>"
```

Nunca cole o token em chats, issues ou commits.

---

## 11. Deploy e atualização

### Fluxo

```text
Estação Windows (desenvolvimento)
  │  git add / commit / push
  ▼
GitHub (origin/main)
  │  git pull --ff-only no servidor
  ▼
/home/app-pwa-prefeitura/app
  │  npm ci + npm run build
  ▼
frontend/dist  ──(bind mount)──►  digital-home:80
backend (PM2)  ◄──/api──────────  digital-home
```

O servidor **não** possui credencial de push no GitHub. Os commits são feitos
na estação de desenvolvimento (onde o Git Credential Manager está configurado)
e o servidor apenas faz `pull`.

### Primeira instalação

```bash
sudo bash /home/app-pwa-prefeitura/app/deploy/instalar.sh
```

O script é idempotente e executa:

1. `criar-app pwa-prefeitura` (usuário Linux + banco + env), se necessário;
2. clone ou `git pull` do repositório;
3. geração de `DEMO_PASSWORD` e do arquivo de credenciais;
4. `npm ci` do backend e do frontend + build do Vite;
5. início do processo no PM2 + `pm2 save` + entrega ao systemd;
6. regra de UFW para a rede `proxy`;
7. criação do container `digital-home` com a config e o build;
8. health check interno.

### Atualização

```bash
sudo bash /home/app-pwa-prefeitura/app/deploy/atualizar.sh
```

O script faz `git pull --ff-only`, `npm ci`, build, `chmod` do `dist`, recarrega
o nginx e reinicia o PM2, preservando `backend/data/estado.json`.

> **Atenção:** se a alteração for nos próprios scripts de deploy, execute o
> comando **duas vezes**. O Bash carrega o arquivo antes do `git pull`; a
> primeira execução usa a versão antiga e a segunda usa a nova.

### Rollback

Prefira reverter pelo Git para manter o histórico linear:

```bash
# na estação de desenvolvimento
git revert <commit>
git push origin main

# no servidor
sudo bash /home/app-pwa-prefeitura/app/deploy/atualizar.sh
```

Evite `git checkout` no servidor: o `git pull --ff-only` seguinte falharia em
HEAD destacado.

### Testes antes do deploy

```bash
npm --prefix backend test       # node:test (21 testes)
npm --prefix frontend run lint  # oxlint
npm run build                   # build do Vite
npm run test:e2e                # Playwright (requer navegador instalado)
```

O CI em `.github/workflows/ci.yml` executa lint, testes de backend, build e E2E
a cada push em `main`.

---

## 12. Backup e restauração

> **Situação atual:** não há backup automático agendado. O JSON tem backup
> local (`.bak`), mas ele fica no mesmo disco. Configure uma rotina externa.

### O que backupar

| Item | Caminho |
|---|---|
| Dados do piloto | `/home/app-pwa-prefeitura/app/backend/data/` |
| Variáveis/segredos | `/home/app-pwa-prefeitura/.config/app.env` |
| Config do gateway | `/opt/digital-home/conf/` |
| Credenciais administrativas | `/root/infraestrutura-credenciais.md` e `/root/*.txt` |
| Catálogo no MySQL | dump de `app_pwa_prefeitura` (tabelas `catalogo_*`) |
| Código | já está no GitHub |

### Backup manual

```bash
sudo install -d -m 700 /root/backups

sudo tar -czf "/root/backups/pwa-$(date +%F-%H%M).tgz" \
  /home/app-pwa-prefeitura/app/backend/data \
  /home/app-pwa-prefeitura/.config/app.env \
  /opt/digital-home/conf \
  /root/infraestrutura-credenciais.md

sudo chmod 600 /root/backups/pwa-*.tgz

# Catálogo no MySQL
sudo mysqldump --databases app_pwa_prefeitura \
  > "/root/backups/mysql-app_pwa_prefeitura-$(date +%F).sql"
sudo chmod 600 /root/backups/mysql-*.sql
```

### Restauração

```bash
# 1. parar a aplicação
sudo systemctl stop pm2-app-pwa-prefeitura

# 2. restaurar os arquivos (o tar foi criado com caminhos absolutos)
sudo tar -xzf /root/backups/pwa-AAAA-MM-DD-HHMM.tgz -C /

# 3. corrigir proprietário dos dados
sudo chown -R app-pwa-prefeitura:app-pwa-prefeitura \
  /home/app-pwa-prefeitura/app/backend/data

# 4. subir novamente
sudo systemctl start pm2-app-pwa-prefeitura
curl -fsS https://digital.cujubim.ro.gov.br/api/health
```

### Rotina recomendada (ainda não instalada)

Criar `/usr/local/sbin/backup-pwa` com retenção de 14 dias e agendar em
`/etc/cron.d/pwa-backup`:

```cron
0 2 * * * root /usr/local/sbin/backup-pwa >> /var/log/pwa-backup.log 2>&1
```

Copie os arquivos para um destino externo (NAS, S3, outro servidor). Backup no
mesmo disco não protege contra falha de hardware.

---

## 13. Credenciais

**Nenhuma senha ou token está neste documento.** As credenciais reais ficam
somente no servidor:

| Arquivo | Conteúdo | Permissão |
|---|---|---|
| `/root/infraestrutura-credenciais.md` | consolidação: SSH, Portainer, painel, MySQL, token do túnel | `600` |
| `/root/portainer-admin.txt` | usuário e senha do Portainer | `600` |
| `/root/pwa-prefeitura-credenciais.txt` | contas demo e senha do painel | `600` |
| `/home/app-pwa-prefeitura/.config/app.env` | variáveis e senha do MySQL da aplicação | `600` |

Como ler (somente com `sudo`):

```bash
sudo cat /root/infraestrutura-credenciais.md
```

### Mapa de contas

| Serviço | Usuário | Onde está a senha |
|---|---|---|
| SSH | `administrador` | `infraestrutura-credenciais.md` → SSH |
| Portainer | `admin` | `infraestrutura-credenciais.md` → Portainer |
| Painel PWA | `admin@prefeitura.demo` e demais contas | `infraestrutura-credenciais.md` → Painel PWA |
| MySQL root | `root` | sem senha; `sudo mysql` (auth_socket) |
| MySQL app | `app_pwa_prefeitura` | `app.env` / `infraestrutura-credenciais.md` |
| Cloudflare Tunnel | token do túnel | `infraestrutura-credenciais.md` |

### Política de segredos

- **Nunca** commitar senhas, tokens, `.env` reais ou arquivos de `/root`.
- Compartilhar credenciais apenas por canal seguro (gerenciador de senhas).
- Se um segredo vazar, rotacionar imediatamente e registrar o incidente.
- O token do túnel permite conectar um novo conector à conta; trate-o como
  credencial de infraestrutura.
- O arquivo de dados contém dados pessoais fictícios do piloto; backups também
  devem ser protegidos.

---

## 14. Operação e comandos

### Status geral

```bash
# serviço do PM2 (sobe no boot)
sudo systemctl status pm2-app-pwa-prefeitura
sudo systemctl is-enabled pm2-app-pwa-prefeitura

# processo da aplicação
sudo -u app-pwa-prefeitura -H bash -lc 'cd ~ && pm2 status'
sudo -u app-pwa-prefeitura -H bash -lc 'cd ~ && pm2 describe pwa-prefeitura'

# containers
sudo docker ps
sudo docker network inspect proxy
```

### Logs

```bash
# aplicação (PM2)
sudo tail -n 100 /home/app-pwa-prefeitura/.pm2/logs/pwa-prefeitura-out.log
sudo tail -n 100 /home/app-pwa-prefeitura/.pm2/logs/pwa-prefeitura-error.log

# nginx (gateway)
sudo docker logs digital-home --tail 100

# túnel
sudo docker logs cloudflared --tail 100

# Portainer
sudo docker logs portainer --tail 100
```

### Reiniciar

```bash
# aplicação (recomendado: respeita o systemd)
sudo systemctl restart pm2-app-pwa-prefeitura

# apenas o processo no PM2
sudo -u app-pwa-prefeitura -H bash -lc 'cd ~ && pm2 restart pwa-prefeitura'

# gateway
sudo docker restart digital-home

# túnel
sudo docker restart cloudflared
```

Também é possível usar `deploy/atualizar.sh`, que reinicia a aplicação e
recarrega o nginx.

### Health checks

```bash
# interno (dentro da rede proxy)
sudo docker exec digital-home wget -qO- http://127.0.0.1/api/health

# público
curl -fsS https://digital.cujubim.ro.gov.br/api/health
curl -fsS -o /dev/null -w "%{http_code}\n" https://digital.cujubim.ro.gov.br/
```

### Dados do piloto

```bash
# visualizar
sudo python3 -m json.tool /home/app-pwa-prefeitura/app/backend/data/estado.json | less

# contagens
sudo python3 -c "import json; d=json.load(open('/home/app-pwa-prefeitura/app/backend/data/estado.json')); print('solicitacoes', len(d['solicitacoes']), 'usuarios', len(d['usuarios']), 'sessoes', len(d['sessoes']))"

# tamanho
sudo du -h /home/app-pwa-prefeitura/app/backend/data/estado.json
```

### Docker e disco

```bash
sudo docker ps -a
sudo docker system df
sudo docker image prune -f          # remove imagens sem uso
df -h /
free -h
```

### Firewall

```bash
sudo ufw status numbered

# liberar uma porta apenas para a rede proxy
sudo ufw allow from 172.18.0.0/16 to any port <PORTA> proto tcp \
  comment "proxy -> <app>"
```

### Git no servidor

```bash
sudo -u app-pwa-prefeitura -H git -C /home/app-pwa-prefeitura/app status
sudo -u app-pwa-prefeitura -H git -C /home/app-pwa-prefeitura/app log --oneline -10
sudo -u app-pwa-prefeitura -H git -C /home/app-pwa-prefeitura/app pull --ff-only
```

### systemd

```bash
sudo systemctl cat pm2-app-pwa-prefeitura
sudo systemctl restart pm2-app-pwa-prefeitura
sudo systemctl stop pm2-app-pwa-prefeitura
sudo journalctl -u pm2-app-pwa-prefeitura --no-pager -n 100
```

> Se o serviço falhar com `protocol` por causa de `PIDFile`, provavelmente há
> um daemon PM2 iniciado manualmente fora do systemd. Pare com
> `sudo -u app-pwa-prefeitura -H bash -lc 'cd ~ && pm2 kill'` e suba com
> `sudo systemctl start pm2-app-pwa-prefeitura`.

---

## 15. Diagnóstico de problemas

| Sintoma | Verificação | Correção |
|---|---|---|
| `502 Bad Gateway` | `systemctl status`, `pm2 status`, health interno | subir o PM2/API; conferir `host.docker.internal:3000` |
| `403 Forbidden` nos estáticos | permissões de `frontend/dist` | `sudo chmod -R a+rX .../frontend/dist` e rebuild |
| `500` em `/gestao` | mesma causa do 403; logs do nginx | corrigir permissões e recriar/reload do nginx |
| `404` em rota do SPA | `try_files` do nginx | conferir `location /` com fallback `index.html` |
| Login não mantém sessão | `COOKIE_SECURE=true` e HTTPS | acessar pelo domínio público; não usar HTTP |
| Login inválido | `DEMO_PASSWORD` e estado | conferir env; recriar contas semente se necessário |
| Manifest com `octet-stream` | `default_type` no nginx | aplicar config e recarregar |
| Config do nginx não muda | bind mount de arquivo único | montar o diretório `/opt/digital-home/conf` |
| Túnel sem conexão | `docker logs cloudflared` | conferir token/rede; recriar container |
| `www.digital` com erro TLS | certificado da Cloudflare | habilitar Total TLS/ACM |
| Portainer inacessível | `docker ps`, `docker port portainer` | subir container; conferir `9443` |
| MySQL recusa conexão | `systemctl status mysql`; `ss -ltnp` | subir serviço; usar `sudo mysql` |
| Disco cheio | `df -h /`, `docker system df`, logs PM2 | limpar imagens/logs; aumentar disco |
| PM2 não sobe no boot | `systemctl is-enabled`; `pm2 save` | `systemctl enable`; refazer dump |
| DNS não resolve no Windows | `nslookup`; NRPT | recriar regra NRPT ou corrigir DNS interno |

---

## 16. Cadastro de uma nova aplicação

1. **Provisionar**: `sudo criar-app <slug>` (cria `app-<slug>`, banco
   `app_<slug>`, `app.env` e unidade PM2).
2. **Clonar** o repositório em `/home/app-<slug>/app` como o usuário dedicado.
3. **Configurar** as variáveis em `/home/app-<slug>/.config/app.env` (modo 600).
4. **Instalar e buildar** com `npm ci` e `npm run build`.
5. **Iniciar** no PM2 com `pm2 start`, `pm2 save` e `systemctl start
   pm2-app-<slug>`.
6. **Publicar** com um container nginx na rede `proxy` (ou um server block em
   um gateway existente) servindo o build e encaminhando `/api` para a porta
   interna. **Sempre use nomes de containers nas rotas.**
7. **Liberar firewall** apenas para `172.18.0.0/16`, se a API estiver no host.
8. **Criar a rota** no túnel: hostname → `http://<container>:<porta>`.
9. **Testar** health interno, health público, login (se houver) e PWA.
10. **Documentar** a aplicação, as pastas e as credenciais (arquivo separado no
    servidor).

Convenções:

| Item | Padrão |
|---|---|
| Usuário Linux | `app-<slug>` |
| Banco/usuário MySQL | `app_<slug>` |
| Container principal | `<slug>` ou `<slug>-web` |
| Gateway nginx | `<slug>-home` ou reutilizar o gateway da aplicação |
| Variáveis | `/home/app-<slug>/.config/app.env` |
| Logs | `~app-<slug>/.pm2/logs/` |

---

## 17. Segurança

### Situação atual

- UFW ativo, entrada padrão negada; SSH e API restrita liberados.
- SSH com **autenticação por senha habilitada** e porta 22 aberta.
- Login de `root` por senha desabilitado; apenas chave (`prohibit-password`).
- Cookies de sessão `HttpOnly`, `Secure` e `SameSite=Lax`.
- Rate limit de login: 20 tentativas por minuto por IP real (via `trust proxy`).
- Senha forte para as contas demo; não é a senha padrão do código.
- Portainer publica `9443` na LAN e contorna o UFW.
- Painel `/gestao` acessível pela internet.
- Sem Fail2ban, sem WAF dedicado, sem monitoramento externo.

### Recomendações prioritárias

1. Criar chave SSH para o `administrador`, testar e depois definir
   `PasswordAuthentication no` e recarregar o SSH.
2. Trocar a senha de teste do `administrador`.
3. Proteger o Portainer com Cloudflare Access/VPN ou restringir a LAN.
4. Proteger `/gestao` com Cloudflare Access, regra de WAF ou lista de IPs.
5. Habilitar Total TLS/ACM para o `www.digital`.
6. Agendar backup externo e testar a restauração.
7. Configurar rotação de logs do PM2 e do Docker.
8. Adicionar monitoramento de uptime para o site e o `/api/health`.

---

## 18. Histórico

| Data | Mudança |
|---|---|
| 13/11/2026 | Servidor preparado: Docker, Node, PM2, MySQL, UFW, Portainer |
| 13/11/2026 | Rede `proxy` e túnel `digital.cujubim` criados |
| 13/11/2026 | Container `digital-home` e página de construção publicados |
| 13/11/2026 | DNS local do Windows corrigido com regra NRPT |
| 13/11/2026 | PWA clonado, buildado e publicado via PM2 + nginx |
| 13/11/2026 | Deploy documentado e versionado (`f4e9f07` a `c43f46b`) |
| 13/11/2026 | Reboot validado: todos os serviços voltaram automaticamente |
| 13/11/2026 | Esta documentação criada (versão 1.0) |

Commits relevantes:

```text
3948b21 fix: remove a senha demo fixa do aviso de login
08593d0 fix(deploy): entrega o daemon do PM2 ao systemd
e299d3e fix(deploy): monta o diretorio de configuracao do nginx
69cc108 fix(deploy): serve o manifest PWA com o tipo correto
6b9ed49 fix(deploy): garante leitura do build pelo usuario do nginx
f4e9f07 feat: adiciona deploy de producao com nginx, PM2 e tunel
```

---

## 19. Pendências e próximos passos

| Prioridade | Item | Situação |
|---|---|---|
| Alta | Total TLS/ACM para `www.digital.cujubim.ro.gov.br` | pendente (Cloudflare) |
| Alta | Backup automático externo + teste de restauração | pendente |
| Alta | Endurecer SSH (chave, desabilitar senha) | pendente |
| Média | Proteger Portainer e `/gestao` com Cloudflare Access | pendente |
| Média | Rotação de logs (PM2 e Docker) | pendente |
| Média | Monitoramento de uptime | pendente |
| Baixa | Migrar solicitações, usuários e sessões do JSON para o MySQL | evolução |
| Baixa | Automatizar deploy via GitHub Actions | evolução |

---

## 20. Contatos

| Papel | Responsável | Contato |
|---|---|---|
| Infraestrutura / servidor | _preencher_ | _preencher_ |
| Aplicação / desenvolvimento | _preencher_ | _preencher_ |
| Cloudflare / DNS | _preencher_ | _preencher_ |
| Segurança da informação | _preencher_ | _preencher_ |
