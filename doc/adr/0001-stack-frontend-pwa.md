# ADR 0001 — React + Vite + vite-plugin-pwa no frontend

- **Status:** Aceito
- **Data:** 22/10/2026
- **Decisores:** Dev front, PO

## Contexto

O piloto precisa de uma interface rápida no celular, instalável como app e capaz de funcionar com
conexão instável. A equipe já conhece React e o prazo é curto. O plano original citava Node 18 e
`vite-plugin-pwa` 1.x, versões que não são mais compatíveis com o Vite atual.

## Decisão

- **React 19** + **Vite 8** (`@vitejs/plugin-react`).
- **vite-plugin-pwa 2** com estratégia `generateSW` (Workbox) e `registerType: 'autoUpdate'`.
- Roteamento com **react-router-dom 7** (BrowserRouter + rotas aninhadas).
- **Node ≥ 20.19** (exigência do Vite 8); ambiente recomendado: Node 22 LTS ou superior.
- Versões fixadas em `package.json` com `^` e registradas em `doc/04-validacao.md`.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Next.js | SSR/roteamento de servidor não são necessários; aumenta complexidade do offline |
| Vue/Svelte | Equipe tem mais familiaridade com React; não haveria ganho no prazo |
| PWA manual (sem plugin) | Exigiria escrever manifest, Workbox e injeção de precache à mão |
| `injectManifest` | Controle fino do SW não é necessário no piloto; `generateSW` cobre o caso |

## Consequências

**Positivas:** build rápido, HMR, PWA com uma configuração só, ecossistema maduro, bundle dentro do
orçamento (≈91 KB gzip).

**Negativas:** Vite 8/React 19 são versões recentes — exige Node atualizado em todas as máquinas e CI.
`autoUpdate` pode recarregar o app no momento da troca de versão (ver ADR 0004). O bundle único pode
crescer com novas telas e precisará de code splitting.

## Quando revisar

- Se o app passar de ~400 KB gzip.
- Se for necessário SSR/SEO real (ex.: portal público indexável).
- Se o time migrar para outro framework.
