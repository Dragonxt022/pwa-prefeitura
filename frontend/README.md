# Frontend — Prefeitura Digital

Aplicação React + Vite + PWA. A documentação principal (setup, scripts, API e testes) está no
[README da raiz](../README.md).

```powershell
npm install
npm run dev        # http://localhost:5173
npm run build
npm run preview    # http://localhost:4173 (Service Worker ativo)
```

## Estrutura

```text
src/
├── assets/         # marca oficial
├── componentes/    # componentes reutilizáveis, componentes/gestao/ e componentes/nova-solicitacao/
├── contexto/       # configurações compartilhadas
├── estilos/        # global.css e tokens
├── hooks/          # recursos, conexão, PWA, hooks da gestão e da nova solicitação
├── i18n/           # infraestrutura de idioma (pt-BR padrão)
├── paginas/        # telas e composição das rotas
├── servicos/       # cliente HTTP, API, integrações, consultas, fila e rascunho
└── utils/          # funções puras e helpers
```

A página `paginas/Gestao.jsx` é somente composição. A lógica está separada em
`useGestaoSessao`, `useGestaoFila`, `useGestaoTransferencia`, `useGestaoImpressao` e
`useGestaoUsuarios`; a interface da gestão fica em `componentes/gestao/`. A página
`paginas/NovaSolicitacao.jsx` também é composição: `useNovaSolicitacao` concentra formulário,
rascunho, envio e fila, enquanto CEP, foto, localização e semelhantes têm hooks próprios em
`hooks/` e a interface fica em `componentes/nova-solicitacao/`. Não há `fetch`
disperso em componentes ou páginas: a API própria passa por `servicos/api.js` e integrações
externas, como o ViaCEP, por `servicos/cep.js`.

## Verificações

```powershell
npm run lint
npm run build
```

O Service Worker só é gerado no build de produção. Para validar cache e offline, use
`npm run preview` e abra `http://localhost:4173`.

Configuração do PWA, proxy e portas em `vite.config.js`.
