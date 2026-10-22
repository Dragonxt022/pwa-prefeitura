# ADR 0006 — Persistência JSON, idempotência e cache público

- **Status:** Aceito
- **Data:** 22/10/2026
- **Decisores:** Dev back, Dev front, PO
- **Substitui:** [ADR 0003](0003-dados-em-memoria.md) e parte da [ADR 0004](0004-cache-offline.md)

## Contexto

O piloto cresceu de uma demonstração de UI para um fluxo com protocolos, fila offline, painel de gestão,
SLA e avaliação. Dois pontos do desenho inicial passaram a atrapalhar:

1. **Dados em memória**: reiniciar a API apagava protocolos e a sequência, o que impedia demonstrar o
   ciclo completo e fazia a fila offline perder a referência de idempotência.
2. **Cache amplo de `/api/*`**: a primeira versão cacheava qualquer GET, inclusive listagem pública e
   detalhe de pedido. Isso conflitava com a remoção da listagem pública e com a decisão de não guardar
   contato/foto/localização no Service Worker.

## Decisão

### Persistência do piloto

- Persistir solicitações, sequência, histórico e avaliações em `backend/data/estado.json`.
- Permitir outro caminho por `DATA_FILE`; o arquivo fica fora do Git.
- Carregar o JSON no boot e usar `Math.max(sequenciaSalva, calcularSequencia())` para não reaproveitar
  protocolos.
- Manter `store.js` como fronteira de repositório para permitir troca por SQLite/Postgres sem alterar as
  rotas.

Isso **não** é um banco de dados: não há transação, concorrência real nem migração. O arquivo serve para
demonstração e testes locais; dados pessoais reais continuam proibidos.

### Idempotência do envio

- O cliente gera um `clientId` (UUID) antes de enviar e o reutiliza enquanto o pedido estiver na fila.
- O servidor procura o `clientId` antes de criar; se existir, devolve `200` com `criada: false` e o
  mesmo protocolo.
- Um retry de rede, portanto, não duplica o pedido.

### Privacidade no cache e nas respostas

- Remover `GET /api/solicitacoes` (listagem pública); a fila completa é exclusiva de `/api/gestao`.
- Sanitizar respostas públicas, omitindo `contato` e `clientId`.
- Não devolver o endereço na consulta de pedidos semelhantes.
- Cachear no Service Worker somente GETs públicos não pessoais: serviços, avisos, perfil fictício e
  `/api/solicitacoes/:protocolo/status`.
- Excluir `/api/gestao` e o detalhe `/api/solicitacoes/:protocolo` do cache.
- Usar `api-public-v2` e apagar `api-get-v1` no boot, para que instalações antigas não continuem com o
  cache amplo.

## Alternativas consideradas

| Alternativa | Por que não agora |
|---|---|
| Continuar em memória | Perdia protocolos e não validava a fila offline de ponta a ponta |
| SQLite | Melhor para produção, mas exige schema, migração e operação que o piloto não precisa |
| Cachear todo GET | Vazava detalhe/contato para o disco do navegador e mantinha listagem pública |
| Não cachear API | Prejudicaria o requisito de catálogo/avisos offline |
| Background Sync do Workbox | Ainda exigiria idempotência; a fila em `localStorage` foi suficiente para o piloto |

## Consequências

**Positivas:** protocolos sobrevivem a restart, retry não duplica, a gestão tem uma visão completa e o
cache offline fica restrito a dados públicos. A fronteira de `store.js` continua preparada para um banco
real.

**Negativas:** o JSON pode corromper ou perder escritas concorrentes; não há autenticação de cidadão; o
`clientId` ainda não é uma `Idempotency-Key` HTTP padronizada; o cache de status continua no aparelho e
deve ser reavaliado quando houver dados reais.

## Quando revisar

- Antes de qualquer uso com dados reais (LGPD, autenticação, retenção).
- Ao trocar o JSON por banco transacional.
- Se o volume de pedidos exigir paginação, auditoria ou conciliação.
- Se push em segundo plano e notificações reais forem implementados.
