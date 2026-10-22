# ADR 0002 — Backend Express 5 em ESM, consumido por proxy

- **Status:** Aceito
- **Data:** 22/10/2026
- **Decisores:** Dev back, Dev front

## Contexto

O piloto precisa de uma API com contratos próximos do real, mas sem banco nem integração. O front roda
em `:5173` (dev) e `:4173` (preview); a API em `:3000`. O plano original citava apenas `express` sem
versão e não mencionava o impacto do Express 5 nem do ESM.

## Decisão

- **Express 5.3** com `"type": "module"` e `node --watch` no desenvolvimento (sem nodemon).
- **CORS** restrito a `localhost/127.0.0.1` nas portas 5173 e 4173, configurável por `CORS_ORIGINS`.
- Front consome **sempre `/api/...`**; o proxy do Vite encaminha para `API_TARGET` (padrão `:3000`).
  O `preview` herda `server.proxy`, então o build também funciona sem CORS.
- Erros padronizados em `{ erro: { codigo, mensagem, campos? } }`, com handlers para JSON inválido,
  corpo grande e 404 de API.
- `x-powered-by` desabilitado e corpo limitado a 16 KB.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| MSW (Mock Service Worker) no browser | Não exercita rede real, cache HTTP, CORS nem latência |
| `json-server` | Contrato e validação ficariam fora do nosso controle |
| Express 4 | Já não é a versão instalada por padrão; 5 tem tratamento nativo de erro assíncrono |
| Fastify | Ótimo, mas a equipe já domina Express e o ganho não compensa no piloto |
| Chamar a API direto por URL absoluta | Exigiria CORS em todo ambiente e duplicaria configuração |

## Consequências

**Positivas:** contrato realista, troca futura por API verdadeira sem mudar o front (mesmas rotas e
envelopes), validação centralizada, funciona em dev e preview.

**Negativas:** exige dois processos no desenvolvimento (resolvido com `concurrently`); Express 5 tem
diferenças de rota em relação à 4.x; o proxy precisa ser lembrado ao publicar em outro host.

## Quando revisar

- Ao integrar a API real (avaliar autenticação, rate limit distribuído e observabilidade).
- Se o deploy separar front e API em domínios diferentes (ajustar `VITE_API_BASE_URL` e CORS).
