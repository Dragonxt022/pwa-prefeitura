# Prefeitura Digital — piloto PWA

Piloto de atendimento ao cidadão: abrir solicitação, receber protocolo, acompanhar o andamento e
consultar avisos da cidade — com funcionamento offline e instalação como app.

> ⚠️ **Ambiente de demonstração.** Todos os dados são fictícios e ficam em memória.
> Não use dados pessoais reais neste projeto.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + Vite 8 + react-router-dom 7 |
| PWA | vite-plugin-pwa 2 (Workbox, `generateSW`, `autoUpdate`) |
| Backend | Express 5 (ESM) + cors |
| Estilo | CSS próprio, mobile-first, dark mode automático |
| Qualidade | oxlint (frontend) |

## Pré-requisitos

- **Node.js 20.19+** (Vite 8 e vite-plugin-pwa 2 exigem). Recomendado: Node 22 LTS ou superior.
- npm 10+.
- Navegador Chromium para validar o Service Worker (Chrome/Edge).

```powershell
node -v   # deve ser >= 20.19
npm -v
```

## Instalação

```powershell
npm run install:all
```

Esse comando instala as dependências da raiz, do `frontend` e do `backend`.

## Execução

```powershell
# janela dividida: API (:3000) à esquerda, frontend (:5173) à direita
# (padrão: exposto na rede local para testar no celular)
.\iniciar-dev.cmd

# apenas neste computador (não expõe na rede)
.\iniciar-dev.cmd local

# equivalentes: duplo clique no arquivo ou npm run dev:split

# ambos na mesma janela, com saídas identificadas (api/web)
npm run dev

# ou em terminais separados
npm run dev:api
npm run dev:web
```

O `iniciar-dev.cmd` confere Node, instala dependências se faltarem, verifica se as portas 3000/5173
estão livres, mostra o IP da rede e abre os dois serviços em **painéis divididos do Windows Terminal**.
Sem Windows Terminal, ele cai para uma janela única com `concurrently`.

Acesse **http://localhost:5173**. O front chama `/api/...`; o proxy do Vite encaminha para
`http://localhost:3000` (configurável por `API_TARGET` no `frontend/.env`).

### Testar o PWA (obrigatório para Service Worker)

Em `npm run dev` o Service Worker **não** é gerado por padrão. Para testar cache e offline de verdade:

```powershell
npm run build
npm run preview     # http://localhost:4173
```

Abra DevTools → **Application** → *Manifest* e *Service Workers*. O status deve ser "activated and is
running" e o cache `workbox-precache-v2-*` deve existir.

Para depurar SW em desenvolvimento, altere `devOptions.enabled` para `true` em
`frontend/vite.config.js` (não use para validar comportamento final).

## Scripts

| Comando | O que faz |
|---|---|
| `npm run install:all` | Instala raiz, frontend e backend |
| `.\iniciar-dev.cmd` | API + frontend em painéis divididos, expostos na LAN |
| `.\iniciar-dev.cmd local` | Mesmo layout, escutando apenas em localhost |
| `.\scripts\liberar-firewall.ps1` | Libera TCP 5173/4173/3000 no firewall (LocalSubnet, requer admin) |
| `npm run dev:split` | Equivalente ao `iniciar-dev.cmd` |
| `npm run dev:lan` | API + Vite em uma janela, escutando na LAN |
| `npm run preview:lan` | Preview do build escutando na LAN |
| `npm run dev` | Sobe API e frontend na mesma janela com `concurrently` (`localhost`) |
| `npm run dev:api` | Só a API (`node --watch`) |
| `npm run dev:web` | Só o Vite |
| `npm run build` | Build de produção do frontend (`dist/`) |
| `npm run preview` | Serve o build em `:4173` com proxy `/api` |
| `npm run start:api` | API sem watch |
| `npm run lint` | oxlint no frontend |
| `npm --prefix frontend run icons` | Regenera os ícones PNG do PWA |

## Estrutura

```
.
├── backend/
│   ├── server.js              # bootstrap + porta + shutdown
│   └── src/
│       ├── app.js             # middlewares, CORS, rotas, erros
│       ├── errors.js          # AppError e helpers
│       ├── store.js           # dados em memória (serviços, avisos, solicitações)
│       ├── middlewares/rate-limit.js
│       └── routes/            # servicos, avisos, perfil, solicitacoes
├── frontend/
│   ├── public/icons/          # 192, 512, maskable 512, apple-touch 180, favicon 32
│   ├── scripts/generate-icons.mjs
│   ├── src/
│   │   ├── assets/            # marca oficial (colorida e branca)
│   │   ├── components/        # Layout, StatusBadge, ErrorState, Loading, Ilustracoes
│   │   ├── hooks/             # useRecurso, useOnlineStatus, usePwaInstall
│   │   ├── lib/               # api.js, format.js, consultas.js (localStorage)
│   │   └── pages/             # Home, NovaSolicitacao, Acompanhar, Perfil, 404
│   └── vite.config.js         # PWA, proxy, portas
├── doc/
│   ├── 01-projeto-inicial.md  # visão, escopo, métricas, riscos
│   ├── 02-requisitos.md       # RF/RN/RNF + contratos de API
│   ├── 03-plano-execucao.md   # fases, prazos, critérios de aceite
│   ├── 04-validacao.md        # evidências do teste local
│   ├── adr/                   # decisões de arquitetura
│   ├── evidencias/            # screenshots da validação
│   ├── imagens/logos/         # arquivos-fonte da marca oficial
│   └── historico/             # plano original preservado
└── package.json               # scripts de orquestração
```

## API

Base: `http://localhost:3000/api`

| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | Status e versão |
| GET | `/servicos` | Catálogo de serviços |
| GET | `/avisos` | Avisos da cidade |
| GET | `/perfil` | Perfil fictício |
| GET | `/solicitacoes?status=&tipo=` | Lista (apoio a debug) |
| POST | `/solicitacoes` | Cria solicitação e devolve protocolo |
| GET | `/solicitacoes/:protocolo` | Consulta com histórico |
| GET | `/solicitacoes/:protocolo/status` | Apenas o status atual |

Exemplo:

```powershell
$body = @{
  tipo = 'iluminacao'
  descricao = 'Poste apagado em frente ao numero 120 desde terca-feira'
  endereco = 'Rua das Palmeiras, 120 - Centro'
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/solicitacoes `
  -ContentType 'application/json' -Body $body
```

Protocolos já disponíveis para teste: `PREF-2026-000001` (em análise), `PREF-2026-000002` (concluída)
e `PREF-2026-000003` (em execução). **A numeração reinicia quando a API é reiniciada.**

Contrato completo, códigos de erro e validações: [doc/02-requisitos.md](doc/02-requisitos.md).

## Comportamento offline

- Assets do build entram no **precache** (Service Worker).
- `GET /api/*` usa **NetworkFirst** com timeout de 3 s, cache `api-get-v1` (50 entradas / 24 h).
- `POST` nunca é cacheado: offline, o app mostra "Sem conexão" e preserva o formulário.
- Navegações usam `index.html` como fallback; `/api/*` é excluído desse fallback.

## Testar no celular (mesma rede Wi-Fi)

Sem túnel: o `iniciar-dev.cmd` já expõe o Vite na rede local e imprime o endereço.

```powershell
.\iniciar-dev.cmd          # padrão: LAN (ex.: http://192.168.0.68:5173)
```

1. Conecte o celular na **mesma rede Wi-Fi** do PC.
2. Abra a URL impressa — ou rode `node scripts/ip-local.mjs 5173` para ver o IP.
3. Se a página não abrir, libere o firewall em um PowerShell **como Administrador**:
   `.\scripts\liberar-firewall.ps1` (TCP 5173/4173/3000, entrada, `LocalSubnet`).
   Para remover: `.\scripts\liberar-firewall.ps1 -Remover`.
4. Para esconder da rede: `.\iniciar-dev.cmd local`.

A rede pode estar classificada como **Pública** no Windows. O script cobre esse perfil, mas as regras
ficam restritas à sub-rede local — use apenas em rede confiável.

### Limitação: HTTP na LAN não ativa o Service Worker

Service Worker exige contexto seguro (HTTPS ou `localhost`). Em `http://192.168.x.x:5173`:

- telas, navegação, formulários e API funcionam normalmente;
- **não** há offline, cache do SW, prompt de instalação nem push;
- no iPhone, "Adicionar à Tela de Início" abre em modo `standalone`, porém sem offline.

Para validar o PWA completo no celular sem túnel, use **HTTPS local com `mkcert`** (certificado para o IP
e CA instalada no aparelho: Android em "CA do usuário"; iOS em perfil + confiança total) ou publique o
build em um host HTTPS. O piloto valida o PWA no desktop via `localhost`.

### iOS

- Instalação: Safari → Compartilhar → **Adicionar à Tela de Início**.
- Notificações: iOS 16.4+, somente no app instalado e com permissão pedida por gesto. O piloto **não
  envia push** — apenas registra a permissão quando aplicável.

## Variáveis de ambiente

| Variável | Onde | Padrão | Efeito |
|---|---|---|---|
| `API_TARGET` | `frontend/.env` | `http://localhost:3000` | Destino do proxy `/api` |
| `VITE_API_BASE_URL` | `frontend/.env` | `/api` | Base usada pelo cliente |
| `PORT` | backend | `3000` | Porta da API |
| `MOCK_LATENCY_MS` | backend | `200` | Latência simulada (`0` desliga) |
| `CORS_ORIGINS` | backend | 5173 e 4173 | Origens permitidas (vírgula) |

## Problemas comuns

| Sintoma | Causa | Solução |
|---|---|---|
| `EADDRINUSE` na API | Porta 3000 ocupada | `$env:PORT=3001; npm run dev:api` e ajuste `API_TARGET` |
| `/api` retorna HTML | Proxy ausente/path errado | Confirme `server.proxy` e `API_TARGET`; teste `/api/health` |
| Mudanças não aparecem no preview | SW antigo em cache | DevTools → Application → Unregister + reload; ou "Update on reload" |
| Ícones quebrados | Build antigo sem os PNGs | `npm --prefix frontend run icons && npm run build` |
| Service Worker não registra | Rodando em `dev` ou HTTP remoto | Use `build` + `preview` em HTTPS/`localhost`; em HTTP na LAN não registra (esperado) |
| Celular não abre `http://IP:5173` | Firewall, rede Pública ou Wi-Fi diferente | Rode `.\scripts\liberar-firewall.ps1` como admin, confirme a mesma rede e desative "isolamento de clientes" no roteador |
| Sem opção de instalar no celular | HTTP na LAN não é contexto seguro | Use HTTPS local (`mkcert`) ou publique o build em host HTTPS |
| Protocolos somem | Store em memória | Esperado: reiniciar a API zera (ADR 0003) |

## Documentação

- [01 — Visão e escopo](doc/01-projeto-inicial.md)
- [02 — Requisitos e contratos](doc/02-requisitos.md)
- [03 — Plano de execução](doc/03-plano-execucao.md)
- [04 — Relatório de validação](doc/04-validacao.md)
- [ADRs](doc/adr/)
