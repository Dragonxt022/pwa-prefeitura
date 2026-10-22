# ADR 0003 — Dados em memória no piloto

> **Substituída pela [ADR 0006](0006-persistencia-e-privacidade.md) em 22/10/2026.** O piloto passou a
> persistir o estado em JSON e a usar `clientId` para idempotência; este registro permanece como
> histórico da decisão inicial.

- **Status:** Substituída (histórico)
- **Data:** 22/10/2026
- **Decisores:** Dev back, PO

## Contexto

Precisávamos de uma API com dados plausíveis para validar o fluxo de UI e o comportamento offline, sem
depender de infraestrutura de banco. Havia o risco de o mock "virar produção" por inércia.

## Decisão

Manter serviços, avisos, perfil e solicitações em **arrays em memória** no processo Node, com reinício
zerando as solicitações criadas e o contador de protocolo. O código fica isolado em
`backend/src/store.js`, atrás de funções (`listarServicos`, `criarSolicitacao`, ...), para permitir
troca por repositório real sem alterar rotas.

**Limites explícitos:** sem persistência, sem transação, sem concorrência real, sem idempotência e sem
histórico de auditoria. **Proibido usar com dados pessoais reais.**

## Alternativas consideradas

| Alternativa | Por que não agora |
|---|---|
| SQLite local | Adicionaria schema/migrações sem validar nada novo no piloto |
| Postgres em Docker | Custo de setup e operação desproporcional |
| Arquivo JSON em disco | Simula persistência, mas cria expectativa falsa de durabilidade |
| Serviço externo (mockapi) | Dependência de rede e de terceiros; atrapalha o teste offline |

## Consequências

**Positivas:** subida instantânea, testes determinísticos, nenhum risco de vazar dado real, troca
localizada quando houver banco.

**Negativas:** protocolos reiniciam a cada restart; não é possível testar concorrência; a numeração
sequencial não é segura para produção (precisa de sequência transacional ou UUID + código curto).

## Quando revisar

Obrigatoriamente **antes de qualquer uso com cidadão real**. Nesse momento:

1. Definir banco e modelo de dados (solicitação, evento de status, anexo, usuário).
2. Garantir geração de protocolo única e transacional, com índice único.
3. Implementar idempotência no POST (`Idempotency-Key`).
4. Definir retenção, auditoria e base legal (LGPD).
