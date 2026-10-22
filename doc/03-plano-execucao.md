# 03 — Plano de execução

| Campo | Valor |
|---|---|
| Versão | 2.0 |
| Data | 22/10/2026 |
| Status | Fases 0–4 concluídas em ambiente local; Fase 5 em andamento (LAN); Fase 6 pendente |
| Referências | [01](01-projeto-inicial.md) · [02](02-requisitos.md) · [04](04-validacao.md) |

## 0. Como usar este plano

- **Status**: `[x]` concluído com evidência · `[~]` parcial · `[ ]` pendente.
- **Responsável** indica o papel, não a pessoa (preencher com nomes na primeira reunião de execução).
- **Critério de aceite** é verificável por terceiro. "Funcionou na minha máquina" não é critério.
- **Definition of Done (DoD)** de qualquer tarefa: código no repositório, `npm run lint` limpo,
  `npm run build` sem erro, comportamento descrito validado e documentação atualizada.

## 1. Fase 0 — Documentação e estrutura (22/10)

| ID | Tarefa | Responsável | Prazo | Critério de aceite | Status |
|---|---|---|---|---|---|
| F0-1 | Separar visão, requisitos e plano em documentos próprios | PO | 22/10 | 01, 02 e 03 existem e não se contradizem | [x] |
| F0-2 | Registrar decisões de arquitetura em ADRs | Dev front | 22/10 | ADRs com contexto, decisão e consequências | [x] |
| F0-3 | Preservar o plano original para histórico | PO | 22/10 | Arquivo em `doc/historico/` | [x] |
| F0-4 | `git init` + `.gitignore` + primeiro commit | Dev | 22/10 | Repositório limpo, sem `node_modules`/`dist` | [x] |
| F0-5 | README com setup, scripts e troubleshooting | Dev | 22/10 | Um novo dev sobe o projeto só com o README | [x] |

## 2. Fase 1 — Estrutura e PWA (22/10)

| ID | Tarefa | Responsável | Prazo | Critério de aceite | Status |
|---|---|---|---|---|---|
| F1-1 | Criar React + Vite (Node 20.19+) | Dev front | 22/10 | `npm run dev` em `:5173` | [x] |
| F1-2 | Instalar `vite-plugin-pwa` 2.x e configurar `VitePWA` | Dev front | 22/10 | `dist/sw.js` gerado no build | [x] |
| F1-3 | Manifest completo (`id`, `start_url`, `scope`, `display`, cores, ícones any/maskable) | Dev front | 22/10 | DevTools → Manifest sem erros | [x] |
| F1-4 | Ícones 192/512, maskable 512 e apple-touch-icon 180 | Dev front | 22/10 | Arquivos em `public/icons`, script reprodutível | [x] |
| F1-5 | Metas iOS e `viewport-fit=cover` | Dev front | 22/10 | Sem warning de meta depreciada | [x] |
| F1-6 | Testar build + preview e confirmar SW registrado | Dev front | 22/10 | SW "ativado e em execução" em `:4173` | [x] |

> **Correção do plano original:** Node 18 não é suportado pelo Vite 8 (exige `^20.19 || >=22.12`) e o
> `vite-plugin-pwa` está na 2.x. Também foi adicionada a meta `mobile-web-app-capable`, que substitui a
> variante `apple-*` depreciada no Chrome.

## 3. Fase 2 — Backend simulado (23/10, antecipada para 22/10)

| ID | Tarefa | Responsável | Prazo | Critério de aceite | Status |
|---|---|---|---|---|---|
| F2-1 | Express 5 em ESM (`type: module`) | Dev back | 23/10 | `npm run dev` em `:3000` | [x] |
| F2-2 | CORS restrito a `localhost:5173` e `:4173` | Dev back | 23/10 | Front funciona via proxy e direto | [x] |
| F2-3 | Rotas de serviços, avisos, perfil e solicitações | Dev back | 23/10 | Contratos da seção 6 de 02 atendidos | [x] |
| F2-4 | Validação de entrada + envelope de erro | Dev back | 23/10 | 422 com `campos` por campo inválido | [x] |
| F2-5 | Limite de taxa no POST (10/min/IP) | Dev back | 23/10 | 11ª requisição retorna 429 | [x] |
| F2-6 | Latência simulada configurável (`MOCK_LATENCY_MS`) | Dev back | 23/10 | `?` estados de carregamento visíveis | [x] |

> **Correção do plano original:** `npm install express` hoje instala a **5.x**, com mudanças de
> comportamento em relação à 4.x (rotas curinga, `req.query`, tratamento de erro assíncrono). O projeto
> fixa `^5.3.0` e usa ESM explicitamente.

## 4. Fase 3 — Telas (26–28/10, antecipada para 22/10)

| ID | Tarefa | Responsável | Prazo | Critério de aceite | Status |
|---|---|---|---|---|---|
| F3-1 | Home com avisos, busca e catálogo | Dev front | 26/10 | RF-01 a RF-03 | [x] |
| F3-2 | Nova solicitação com validação e confirmação | Dev front | 27/10 | RF-04 e RF-05 | [x] |
| F3-3 | Acompanhamento com linha do tempo e recentes | Dev front | 27/10 | RF-06 e RF-07 | [x] |
| F3-4 | Perfil com notificações condicionadas e limpeza | Dev front | 28/10 | RF-08 a RF-10 | [x] |
| F3-5 | Layout responsivo + navegação inferior + offline banner | Dev front | 28/10 | 320 px–1440 px sem overflow | [x] |
| F3-6 | Revisão de copy e acentuação em UI e API | UX | 28/10 | Nenhum texto sem acento | [x] |

## 5. Fase 4 — Teste offline (29/10)

| ID | Tarefa | Responsável | Prazo | Critério de aceite | Status |
|---|---|---|---|---|---|
| F4-1 | Precache de assets e `navigateFallback` do SPA | Dev front | 29/10 | 15 entradas no precache | [x] |
| F4-2 | Cache de `GET /api/*` com `NetworkFirst` (3 s) | Dev front | 29/10 | Home carrega offline com dados | [x] |
| F4-3 | Bloqueio de escrita offline com mensagem clara | Dev front | 29/10 | Formulário preserva dados e avisa | [x] |
| F4-4 | Roteiro de teste manual offline documentado | QA | 30/10 | Passos reproduzíveis em 04 | [x] |
| F4-5 | Teste offline em Android real | QA | 30/10 | Mesmo resultado do desktop | [ ] |

> **Ajuste de cache:** o plano original dizia apenas "o Workbox cacheia assets estáticos". Isso não cobre
> a API: sem estratégia explícita, a Home abriria offline mas sem avisos. Foi adicionada runtime caching
> `NetworkFirst` com timeout e limite de entradas (ADR 0004). `navigateFallbackDenylist` impede que
> navegações para `/api` recebam o `index.html`.

## 6. Fase 5 — Dispositivos físicos (30/10)

Abordagem adotada: **exposição na rede local (LAN), sem túnel**. O celular acessa o Vite pelo IP do PC
na mesma rede Wi-Fi; o proxy do Vite encaminha `/api` para a API local.

| ID | Tarefa | Responsável | Prazo | Critério de aceite | Status |
|---|---|---|---|---|---|
| F5-1 | Expor dev na LAN (`iniciar-dev.cmd`) e liberar firewall | Dev | 30/10 | Celular abre `http://IP:5173` na mesma Wi-Fi | [x] |
| F5-2 | Validar fluxo completo no celular (HTTP/LAN) | QA | 30/10 | Home, formulário, protocolo e acompanhamento sem erro de layout | [ ] |
| F5-3 | Instalar na Tela de Início (iOS) e validar `standalone` | QA | 30/10 | Abre sem barra do Safari | [ ] |
| F5-4 | Documentar limitação de PWA em HTTP na LAN e push no iOS | PO | 30/10 | Texto no README + tela de Perfil | [x] |
| F5-5 | (Opcional) HTTPS local com `mkcert` para validar SW no aparelho | Dev | 31/10 | SW ativo e offline funcionando no celular | [ ] |

**Por que não há offline no teste via LAN:** Service Worker exige contexto seguro (HTTPS ou
`localhost`). Em `http://192.168.x.x:5173` o fluxo de telas e API funciona, mas cache, instalação via
prompt e push não. O `mkcert` resolve isso localmente, porém exige instalar a CA no aparelho
(Android: CA do usuário; iOS: perfil + confiança total) — por isso ficou como tarefa opcional (F5-5).
Alternativa: publicar o build em um host HTTPS e apontar a API para um endereço acessível.

**Firewall:** `.\scripts\liberar-firewall.ps1` (PowerShell como Administrador) cria regras de entrada
para TCP 5173/4173/3000 limitadas a `LocalSubnet`, cobrindo os perfis Private e Public. Remova com
`-Remover`. A rede "RH 2" está classificada como **Pública**: as regras valem para ela, mas não abrem
as portas para a internet.

**iOS — requisitos reais de push (para a fase futura):** iOS 16.4+, app **instalado** na Tela de Início,
permissão solicitada **em resposta a um gesto**, e backend com Web Push/VAPID. O piloto não envia push;
apenas registra a permissão quando possível.

## 7. Fase 6 — Validação com usuários (03–06/11)

| ID | Tarefa | Responsável | Prazo | Critério de aceite | Status |
|---|---|---|---|---|---|
| F6-1 | Roteiro de teste moderado (5 tarefas) | UX | 03/11 | Roteiro revisado por 2 pessoas | [ ] |
| F6-2 | Recrutar 10–15 participantes (mix iOS/Android) | PO | 04/11 | Agenda confirmada | [ ] |
| F6-3 | Executar sessões e registrar métricas de 01 §6 | UX | 05–06/11 | Planilha com conclusão, tempo e erros | [ ] |
| F6-4 | Auditoria de acessibilidade (manual + axe) | QA | 06/11 | 0 problemas críticos WCAG A | [ ] |
| F6-5 | Relatório final com decisão go/no-go | PO | 06/11 | Documento assinado pelas áreas | [ ] |

## 8. Comandos de execução

```powershell
# primeira vez
npm run install:all

# desenvolvimento (API :3000 + Vite :5173)
#   tela dividida no Windows Terminal, exposto na LAN:
.\iniciar-dev.cmd
#   apenas neste computador:
.\iniciar-dev.cmd local
#   ou na mesma janela (localhost):
npm run dev

# validar antes de testar PWA
npm run lint
npm run build
npm run preview      # http://localhost:4173

# testar no celular (mesma Wi-Fi)
node scripts/ip-local.mjs 5173
.\scripts\liberar-firewall.ps1   # PowerShell como Administrador

# apenas um dos lados
npm run dev:api
npm run dev:web
```

Variáveis úteis (definir no terminal antes de subir):

| Variável | Onde | Efeito |
|---|---|---|
| `API_TARGET` | frontend (`.env`) | Destino do proxy `/api` (padrão `http://localhost:3000`) |
| `PORT` | backend | Porta da API (padrão 3000) |
| `MOCK_LATENCY_MS` | backend | Latência simulada em ms (padrão 200; `0` desliga) |
| `CORS_ORIGINS` | backend | Lista separada por vírgula de origens permitidas |
| `DATA_FILE` | backend | Caminho do JSON de persistência (padrão `backend/data/estado.json`) |
| `ADMIN_TOKEN` | backend | Token do painel de gestão (padrão de demonstração `prefeitura-demo`) |

## 9. Riscos operacionais do plano

| Risco | Sinal | Ação |
|---|---|---|
| Service Worker antigo servindo build velho | Tela sem mudanças após deploy | DevTools → Application → Unregister + "Update on reload"; cache versionado |
| Porta ocupada | `EADDRINUSE` | `PORT=3001` no backend e `API_TARGET` correspondente |
| Proxy não aplicado no preview | `/api` retorna HTML | Confirmar que `preview` herda `server.proxy`; testar `curl /api/health` |
| HTTP na LAN impede SW | Offline/instalação não validados no aparelho | Usar HTTPS local com `mkcert` (F5-5) |
| Dados sumindo | Reinício do backend | Não deve ocorrer: o estado é persistido em `DATA_FILE`; para resetar, pare a API e remova o arquivo |

## 10. Critérios de saída do piloto

1. Fases 0–5 com todos os itens `[x]` e evidência anexada.
2. Fase 6 concluída com relatório e decisão go/no-go.
3. Nenhuma issue aberta de severidade alta/crítica.
4. Backlog de produção priorizado (persistência, autenticação, push, LGPD).
