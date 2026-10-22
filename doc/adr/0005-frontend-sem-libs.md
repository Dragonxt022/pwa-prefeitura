# ADR 0005 — Frontend sem biblioteca de estado ou cliente HTTP

- **Status:** Aceito
- **Data:** 22/10/2026
- **Decisores:** Dev front

## Contexto

O app tem quatro telas, um único perfil e chamadas simples de leitura/escrita. O instinto comum seria
adicionar Redux/Zustand, TanStack Query e Axios. Cada dependência aumenta bundle, superfície de
aprendizado e tempo de revisão — e nenhuma resolve um problema que o piloto realmente tenha.

## Decisão

- **Estado**: `useState`/`useEffect` locais + um hook genérico `useRecurso` para carregamento
  (dados, carregando, erro, recarregar) com descarte de resposta após desmontagem.
- **HTTP**: `fetch` encapsulado em `src/lib/api.js`, com `AbortController` (timeout de 8 s), classe
  `ApiError` (`status`, `codigo`, `campos`, `offline`) e tratamento de fallback de rede.
- **Persistência local**: `localStorage` isolado em `src/lib/consultas.js`, com try/catch para modo privado.
- **Estilo**: CSS próprio com variáveis, mobile-first e `prefers-color-scheme`; sem framework de UI.
- **Validação**: duplicada de propósito (cliente para UX, servidor como fonte da verdade).

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| TanStack Query | Cache/retry/refetch não são necessários com 4 telas; o SW já faz cache de rede |
| Zustand/Redux | Não há estado global compartilhado além de dados de API |
| Axios | `fetch` cobre o caso; uma dependência a menos |
| Tailwind/MUI | Introduziria build e padronização que o piloto não precisa revisar |
| Formik/RHF | Dois formulários simples não justificam a dependência |

## Consequências

**Positivas:** bundle menor, menos dependências para atualizar, código legível para quem entra depois,
comportamento previsível no offline.

**Negativas:** cada nova tela repete o padrão de carregamento; não há cache em memória entre navegações
(cada visita refaz o GET, mitigado pelo SW); validação cliente/servidor pode divergir — mitigado por
constantes espelhadas e testes de contrato manuais.

## Quando revisar

- Se surgir estado global real (carrinho, multi-perfil, rascunho compartilhado).
- Se o número de endpoints crescer e o cache em memória passar a importar.
- Se a validação divergir em produção — nesse momento adotar schema compartilhado (ex.: Zod).
