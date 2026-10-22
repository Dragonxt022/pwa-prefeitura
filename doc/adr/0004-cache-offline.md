# ADR 0004 — Precache + NetworkFirst na API + autoUpdate

- **Status:** Aceito
- **Data:** 22/10/2026
- **Decisores:** Dev front, QA

## Contexto

O teste offline precisa de duas garantias diferentes: (a) abrir o app sem rede e (b) ver os últimos
dados já carregados. O plano original afirmava apenas que "o Workbox cacheia os assets estáticos" —
verdadeiro, mas insuficiente: a Home abriria offline **sem** avisos e serviços, porque chamadas `/api`
não entram no precache nem em cache de runtime por padrão.

Também era preciso decidir o que acontece quando uma nova versão é publicada com um Service Worker
antigo instalado.

## Decisão

1. **Precache** dos assets do build (`**/*.{js,css,html,svg,png,ico,woff2}`), com
   `navigateFallback: 'index.html'` e `navigateFallbackDenylist: [/^\/api\//]` para o SPA.
2. **Runtime cache** de `GET /api/*` com **NetworkFirst**, timeout de rede de **3 s**, cache
   `api-get-v1`, máximo de 50 entradas e 24 h de validade; só respostas `200` são cacheadas.
3. **`registerType: 'autoUpdate'`**: o novo SW assume o controle (`skipWaiting`/`clientsClaim`) e o app
   usa a versão nova no próximo carregamento.
4. **`cleanupOutdatedCaches: true`** para remover precaches antigos.
5. Escritas (`POST`) **nunca** são cacheadas; offline elas falham com mensagem clara.

## Alternativas consideradas

| Estratégia | Por que não |
|---|---|
| Sem cache de API | Offline mostraria telas vazias — falha o requisito RF-12 |
| `CacheFirst` na API | Status de protocolo ficaria congelado; risco alto para dado sensível a tempo |
| `StaleWhileRevalidate` | Mostra dado velho primeiro; aceitável em catálogo, ruim para status |
| Background Sync para POST | Ótimo, porém exige idempotência e serviço de sincronização — fora do piloto |
| `prompt` de atualização | Mais controle para o usuário, mas adiciona UI e complexidade; pode ficar para produção |

## Consequências

**Positivas:** app abre e navega offline; últimos dados permanecem legíveis; atualização automática sem
"usuário preso" em versão antiga; cache antigo é limpo.

**Negativas:** dados podem ter até 24 h (aceitável para avisos, revisar para status); em rede muito
lenta a API responde do cache após 3 s; `autoUpdate` pode recarregar durante o uso (mitigado pelo fato
de a troca ocorrer no próximo carregamento); cache versionado exige atenção ao mudar formato de dados.

## Quando revisar

- Se o status do protocolo passar a ter requisito de tempo real (avaliar `NetworkOnly` + push).
- Se houver POST offline desejado (implementar fila + idempotência).
- Ao adicionar dados sensíveis ao cache local (avaliar criptografia e expiração curta).
