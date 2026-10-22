# Prefeitura Digital — piloto PWA

Piloto de atendimento ao cidadão: abrir solicitação, receber protocolo, acompanhar o andamento,
avaliar o atendimento e consultar avisos da cidade — com funcionamento offline e instalação como app.

> ⚠️ **Ambiente de demonstração.** Os dados são fictícios e ficam no arquivo local
> `backend/data/estado.json`. Não use dados pessoais reais neste projeto.

## O que já está no piloto

- Catálogo com **9 serviços**: iluminação, pavimentação, limpeza, poda, fiscalização, sinalização,
  ouvidoria, zeladoria urbana e meio ambiente.
- Busca de serviços sem diferenciar maiúsculas ou acentos, na Home e em `/servicos`, com filtro por
  categoria e destaque dos 6 serviços principais.
- Nova solicitação com descrição, endereço, contato opcional, **CEP assistido** (ViaCEP),
  **localização geográfica**, **foto** e busca de serviço.
- **Rascunho automático** e **fila offline** com reenvio automático ao voltar a conexão. O `clientId`
  evita criar o mesmo pedido duas vezes em caso de retry.
- Detecção de pedidos parecidos por serviço, endereço e proximidade, sem expor o endereço existente.
- Acompanhamento por protocolo com status, prazo/SLA, histórico, foto, mapa e **Meus pedidos** salvos
  no aparelho.
- Avaliação de 1 a 5 estrelas após a conclusão, com comentário opcional.
- Notificações locais no app quando um status muda (sem push em segundo plano neste ciclo).
- Painel de gestão em `/gestao`, protegido por token, com fila, filtros, estatísticas, prioridade,
  mudança de status e histórico.
- Acessibilidade: atalho “Pular para o conteúdo”, foco visível, navegação por teclado, textos
  alternativos e controles de **fonte ampliada** e **alto contraste** no Perfil.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + Vite 8 + react-router-dom 7 |
| PWA | vite-plugin-pwa 2 (Workbox, `generateSW`, `autoUpdate`) |
| Backend | Express 5 (ESM) + cors + persistência JSON |
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

### Painel de gestão

Abra **http://localhost:5173/gestao** e informe o token. No piloto o token padrão é
`prefeitura-demo`; em produção defina `ADMIN_TOKEN` no backend. O token fica em `sessionStorage` e é
enviado no cabeçalho `x-admin-token`.

### Testar o PWA (obrigatório para Service Worker)

Em `npm run dev` o Service Worker **não** é gerado por padrão. Para testar cache e offline de verdade:

```powershell
npm run build
npm run preview     # http://localhost:4173
```

Abra DevTools → **Application** → *Manifest* e *Service Workers*. O status deve ser "activated and is
running" e os caches `workbox-precache-v2-*` e `api-public-v2` devem existir.

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
│   ├── data/                  # estado.json (runtime, ignorado pelo Git)
│   ├── server.js              # bootstrap + porta + shutdown
│   └── src/
│       ├── app.js             # middlewares, CORS, rotas, erros
│       ├── errors.js          # AppError e helpers
│       ├── store.js           # catálogo, avisos, pedidos e persistência JSON
│       ├── middlewares/rate-limit.js
│       └── routes/            # servicos, avisos, perfil, solicitacoes e gestao
├── frontend/
│   ├── public/icons/          # 192, 512, maskable 512, apple-touch 180, favicon 32
│   ├── scripts/generate-icons.mjs
│   ├── src/
│   │   ├── assets/            # marca oficial (colorida e branca)
│   │   ├── components/        # Layout, Avaliação, StatusBadge, ErrorState, Loading
│   │   ├── hooks/             # useRecurso, useOnlineStatus, usePwaInstall, fila e atualizações
│   │   ├── lib/               # api, format, consultas, fila, rascunho, imagem, prazos, acessibilidade
│   │   └── pages/             # Home, Servicos, NovaSolicitacao, Acompanhar, Perfil, Gestao, 404
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

Rotas públicas:

| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | Status e versão |
| GET | `/servicos` | Catálogo com os 9 serviços |
| GET | `/avisos` | Avisos da cidade |
| GET | `/perfil` | Perfil fictício |
| GET | `/solicitacoes/semelhantes?tipo=&endereco=&latitude=&longitude=` | Pedidos parecidos (sem endereço/contato) |
| POST | `/solicitacoes` | Cria solicitação e devolve protocolo |
| GET | `/solicitacoes/:protocolo` | Consulta com histórico, sem contato/clientId |
| GET | `/solicitacoes/:protocolo/status` | Status atual e SLA |
| POST | `/solicitacoes/:protocolo/avaliacao` | Avaliação após conclusão |

Rotas de gestão (todas exigem `x-admin-token`):

| Método | Rota | Descrição |
|---|---|---|
| GET | `/gestao/sessao` | Valida o token |
| GET | `/gestao/solicitacoes?status=&tipo=&busca=&limite=` | Fila com total e estatísticas |
| GET | `/gestao/solicitacoes/:protocolo` | Detalhe completo para atendimento |
| PATCH | `/gestao/solicitacoes/:protocolo/status` | Status, prioridade e observação |

Exemplo de criação (o `clientId` é opcional; a UI o gera para idempotência):

```powershell
$body = @{
  tipo = 'iluminacao'
  descricao = 'Poste apagado em frente ao numero 120 desde terca-feira'
  endereco = 'Rua das Palmeiras, 120 - Centro'
  clientId = [guid]::NewGuid().ToString()
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/solicitacoes `
  -ContentType 'application/json' -Body $body
```

Os dados de exemplo são carregados no primeiro start. A sequência é persistida junto com os pedidos;
reiniciar a API não apaga os protocolos. Para começar do zero, pare a API e remova
`backend/data/estado.json` (ou o arquivo definido em `DATA_FILE`).

Contrato completo, limites, códigos de erro e regras: [doc/02-requisitos.md](doc/02-requisitos.md).

## Comportamento offline

- Assets do build entram no **precache** (Service Worker).
- Apenas **GETs públicos e não pessoais** entram no cache `api-public-v2` (serviços, avisos, perfil
  e status). Detalhe do pedido, foto, localização e rotas de gestão ficam **fora** do cache do SW.
- Rascunhos são salvos no aparelho e restaurados ao reabrir o formulário.
- Se o envio falhar sem conexão, o pedido entra na fila local e é reenviado automaticamente quando a
  conexão volta. A tela de confirmação troca de “Pedido salvo” para “Pronto!” com o protocolo.
- `POST` nunca é cacheado. Navegações usam `index.html` como fallback; `/api/*` é excluído desse fallback.
- A limpeza de dados do Perfil remove protocolos, rascunhos, fila e notificações locais.

## Privacidade

- Não há listagem pública de todas as solicitações. A listagem completa é exclusiva da gestão.
- Respostas públicas de um pedido omitem `contato` e `clientId`.
- A detecção de duplicidade informa protocolo, serviço, status e, quando disponível, distância — sem
  devolver o endereço do pedido existente.
- No piloto, o protocolo funciona como chave de acesso do cidadão. Não use dados reais.
- O Service Worker não guarda respostas de gestão nem detalhes com foto/contato.
- O token de gestão padrão é apenas para demonstração; defina `ADMIN_TOKEN` em produção.

## Acessibilidade

- Atalho “Pular para o conteúdo” em todas as páginas, incluindo `/gestao`.
- Foco visível, ordem de tabulação revisada, labels associados e mensagens com `role="alert"`/`aria-live`.
- Alvos de toque com pelo menos 44 px e layout responsivo de 320 px a 1440 px.
- Perfil oferece fonte ampliada (raiz em 18 px) e alto contraste, persistidos em `localStorage`.
- O formulário aceita foto, geolocalização opcional e validação junto ao campo.

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
  envia push em segundo plano** — os avisos aparecem quando o app está aberto e a permissão é concedida.

## Variáveis de ambiente

| Variável | Onde | Padrão | Efeito |
|---|---|---|---|
| `API_TARGET` | `frontend/.env` | `http://localhost:3000` | Destino do proxy `/api` |
| `VITE_API_BASE_URL` | `frontend/.env` | `/api` | Base usada pelo cliente |
| `PORT` | backend | `3000` | Porta da API |
| `MOCK_LATENCY_MS` | backend | `200` | Latência simulada (`0` desliga) |
| `CORS_ORIGINS` | backend | 5173 e 4173 | Origens permitidas (vírgula) |
| `DATA_FILE` | backend | `backend/data/estado.json` | Arquivo JSON de persistência |
| `ADMIN_TOKEN` | backend | `prefeitura-demo` | Token do painel de gestão |

## Problemas comuns

| Sintoma | Causa | Solução |
|---|---|---|
| `EADDRINUSE` na API | Porta 3000 ocupada | `$env:PORT=3001; npm run dev:api` e ajuste `API_TARGET` |
| `/api` retorna HTML | Proxy ausente/path errado | Confirme `server.proxy` e `API_TARGET`; teste `/api/health` |
| Gestão responde 401 | Token inválido ou `ADMIN_TOKEN` diferente | Use o mesmo token configurado no backend; o painel não apaga a sessão em falha de rede |
| Mudanças não aparecem no preview | SW antigo em cache | DevTools → Application → Unregister + reload; ou "Update on reload" |
| Fila offline não envia | API fora do ar ou token/rota bloqueada | Confirme `/api/health`, volte online e abra o app; a fila tenta a cada 30 s |
| Ícones quebrados | Build antigo sem os PNGs | `npm --prefix frontend run icons && npm run build` |
| Service Worker não registra | Rodando em `dev` ou HTTP remoto | Use `build` + `preview` em HTTPS/`localhost`; em HTTP na LAN não registra (esperado) |
| Celular não abre `http://IP:5173` | Firewall, rede Pública ou Wi-Fi diferente | Rode `.\scripts\liberar-firewall.ps1` como admin, confirme a mesma rede e desative "isolamento de clientes" no roteador |
| Sem opção de instalar no celular | HTTP na LAN não é contexto seguro | Use HTTPS local (`mkcert`) ou publique o build em host HTTPS |
| Dados de teste indesejados | Estado persistido em disco | Pare a API e remova `backend/data/estado.json` (ou `DATA_FILE`) |

## Documentação

- [01 — Visão e escopo](doc/01-projeto-inicial.md)
- [02 — Requisitos e contratos](doc/02-requisitos.md)
- [03 — Plano de execução](doc/03-plano-execucao.md)
- [04 — Relatório de validação](doc/04-validacao.md)
- [ADRs](doc/adr/)
