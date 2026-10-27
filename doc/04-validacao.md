# 04 — Relatório de validação local

| Campo | Valor |
|---|---|
| Data da execução | 24/10/2026 |
| Ambiente | Windows, Node **24.12.0**, npm **11.6.2**, Chrome for Testing **156** (Playwright **1.64.1**) |
| Versões | Vite **8.3.5**, vite-plugin-pwa **2.0.0**, React **19.3.1**, react-router-dom **7.18.4**, Express **5.3.0** |
| Escopo | API com persistência atômica, código de acesso, catálogo, formulário, fila offline, acompanhamento, avaliação, gestão com login/setores/transferência/impressão, triagem automática, PWA, testes automatizados e CI |
| Resultado | **Aprovado nos critérios locais**: lint 0/0, build, 21 testes de backend e 1 smoke E2E; instalação em aparelho físico, push em segundo plano e auditoria formal de acessibilidade ficam pendentes |

## 1. Qualidade de código

| Verificação | Comando | Resultado |
|---|---|---|
| Lint | `npm run lint` | **0 erros, 0 warnings** |
| Testes do backend | `npm run test:backend` | **21/21 aprovados** |
| Build | `npm run build` | **Sucesso** |
| E2E | `npm run test:e2e` | **1/1 aprovado** |

Saída do build:

```
dist/registerSW.js                              0.13 kB
dist/manifest.webmanifest                       0.67 kB
dist/index.html                                 1.25 kB │ gzip:   0.58 kB
dist/assets/logo-icone-branco-*.png             9.09 kB
dist/assets/logo-icone-colorido-*.png          41.88 kB
dist/assets/index-*.css                        76.43 kB │ gzip:  14.09 kB
dist/assets/index-*.js                        465.99 kB │ gzip: 135.94 kB

PWA v2.0.0  mode generateSW
precache  17 entries (648.72 KiB)
files generated: dist/sw.js, dist/workbox-*.js
```

Os 9 warnings da linha de base foram eliminados com refatorações reais: `useRecurso` passou a alimentar
as configurações públicas, os contextos/hooks de i18n e configurações foram separados para não misturar
exportações, o cálculo de semelhantes virou valor derivado, a verificação periódica de status deixou de
chamar `setState` diretamente e a faixa de envio recente usa animação CSS. Os efeitos restantes que
sincronizam URL/sessão foram agendados fora do ciclo síncrono do efeito.

Correções e mudanças desta rodada:

- **código de acesso** de 12 caracteres gerado no navegador, enviado em `x-codigo-acesso` e persistido
  apenas como SHA-256 no backend; nunca entra na URL, em payload público, em log ou no cache do SW;
- detalhe, status, avaliação e reenvio idempotente exigem o código; erros de protocolo/código usam o
  mesmo `404 codigo_acesso_invalido`, sem oráculo de existência;
- `/semelhantes` deixou de devolver protocolo, endereço, descrição e datas, exibindo tipo/status/distância;
- fila offline e “Meus pedidos” guardam o código uma única vez para permitir o reenvio e a reabertura;
- PWA não cacheia **nenhuma** rota `/api/solicitacoes`; cache público renomeado para `api-public-v3` e
  caches antigos (`api-get-v1`, `api-public-v2`) removidos no boot;
- persistência JSON com arquivo temporário, `fsync`, renomeação atômica, `.bak`, recuperação de backup
  também para JSON válido com schema incompleto e falha explícita quando principal e backup estão inválidos;
- protocolos fictícios de demonstração recebem o código documentado `DEMA-ACES-S226`; os demais
  registros antigos sem hash permanecem inacessíveis e não são substituídos silenciosamente por sementes;
- rate limit adicional em detalhe/status/semelhantes para reduzir tentativas de adivinhação;
- `node:test`, Playwright e workflow de CI adicionados.

## 2. PWA e Service Worker

Verificado em `http://localhost:4173` com o build de produção:

| Item | Resultado |
|---|---|
| `dist/sw.js` e `dist/workbox-*.js` | Gerados |
| Registro do Service Worker | Ativo, escopo `/` |
| Cache de assets | `workbox-precache-v2-http://localhost:4173/` |
| Cache de API pública | `api-public-v3` |
| Caches antigos `api-get-v1` e `api-public-v2` | Ausentes após o boot e a limpeza automática |
| Manifest e ícones | 192, 512, maskable 512, apple-touch 180 e favicon 32 acessíveis |
| Rotas de gestão no cache | Nenhuma; URLs observadas: `/api/avisos` e `/api/servicos` |

O teste abriu a Home, depois `/gestao`, autenticou e abriu um detalhe. As chaves do `api-public-v3`
continuaram apenas com avisos e serviços; **nenhuma** URL `/api/solicitacoes` (detalhe, status ou
semelhantes) nem `/api/gestao` apareceu. O E2E também percorre os caches do contexto do navegador e
confirma zero URLs de solicitações. Escritas (`POST`) nunca são cacheadas.

### 2.1 Catálogo offline

Procedimento: carregar `/servicos` online, colocar o contexto em offline e navegar novamente.

| Verificação | Resultado |
|---|---|
| App abre offline com o HTML/JS/CSS do precache | OK |
| Título “Todos os serviços” | OK |
| Os 9 serviços aparecem | OK |
| Faixa “Sem conexão — usando dados salvos.” | OK |
| Nenhuma tela branca ou erro de JavaScript | OK |

### 2.2 Fila offline

Procedimento no build de produção, com o contexto offline:

1. preencher uma solicitação de **Sinalização de trânsito**;
2. tocar em **Salvar no aparelho**;
3. verificar a fila local;
4. voltar online e aguardar o reenvio automático.

| Verificação | Resultado |
|---|---|
| Tela “Pedido salvo” e aviso de conexão | OK |
| Fila com 1 pedido aguardando | OK |
| Reenvio automático ao voltar online | OK |
| Confirmação trocada para “Pronto!” | OK |
| Protocolo criado | `PREF-2026-000008` |
| Fila esvaziada após o envio | OK |

O `clientId` do pedido foi reenviado pela API e devolveu o mesmo protocolo com `criada: false`,
confirmando a idempotência.

### 2.3 Rascunho

| Verificação | Resultado |
|---|---|
| Salvar rascunho após 700 ms | OK |
| Recarregar o formulário | Tipo, descrição e endereço restaurados |
| Mensagem após 1,4 s da restauração | “Rascunho restaurado. Continue de onde parou.” |
| Foto processada no cliente | Pré-visualização gerada; imagem reduzida para JPEG antes do envio |

### 2.4 Revalidação após a refatoração do frontend

O build de produção foi servido em `http://127.0.0.1:4173`. A rodada inicial usou um proxy temporário
para a API em `:3001`; a rodada final, após a extração da integração ViaCEP, usou o preview padrão. A
configuração temporária foi removida ao final. Resultado:

| Verificação | Resultado |
|---|---|
| Service Worker controlando a página | `navigator.serviceWorker.controller === true` |
| Registro do Service Worker | OK |
| Cache de precache | `workbox-precache-v2-http://127.0.0.1:4173/` |
| Cache de API pública | `api-public-v3` presente; sem `/api/solicitacoes` |
| Manifest | `/manifest.webmanifest` acessível |
| Home offline | Abriu com o título “Como podemos ajudar?” |
| Catálogo offline | Abriu com o título “Todos os serviços” |
| Aviso de conexão | “Sem conexão — usando dados salvos.” nas duas rotas |
| Overflow horizontal | Ausente na Home, catálogo e painel em 390 × 844 |
| Rotas públicas | `/`, `/servicos`, `/acompanhar` e `/nova-solicitacao` carregaram com os títulos esperados |
| Formulário de solicitação | Abriu com o campo de CEP após a extração da integração para `servicos/cep.js` |

### 2.5 Divisão da página de nova solicitação

`frontend/src/paginas/NovaSolicitacao.jsx` passou de **1.023 para 76 linhas**. O estado, as validações,
o rascunho, o envio e a fila ficam em `useNovaSolicitacao`; CEP, foto, localização e pedidos semelhantes
têm hooks próprios. A apresentação foi dividida em `componentes/nova-solicitacao/`: formulário, seleção
de serviço, dados, localização, foto, semelhantes, resumo de validação, confirmação e pedido pendente.

Validação em `http://localhost:5173/nova-solicitacao` (servidor de desenvolvimento):

| Verificação | Resultado |
|---|---|
| Busca de serviço | `poda` reduziu a lista ao serviço correspondente; a seleção permaneceu funcional |
| Envio com campos vazios | Erros de serviço, descrição e endereço; resumo recebeu foco |
| CEP `01001-000` | Endereço preenchido, número existente preservado e foco movido para o endereço |
| Localização | Captura simulada anexada com precisão e remoção com mensagem de status |
| Foto válida | Imagem convertida para JPEG, prévia exibida e metadados removidos |
| Arquivo inválido | Erro de imagem exibido no resumo de validação e input limpo |
| Rascunho | Salvo após 700 ms e restaurado com a mensagem de retomada após reload |
| Envio online | Protocolo `PREF-2026-000010` criado e confirmação exibida |
| Copiar protocolo e código | Área de transferência preenchida; status e `aria-label` atualizados |
| Código de acesso na confirmação | Formato `ABCD-EFGH-JKLM`, aviso de irrecuperabilidade e cópia funcional |
| Envio offline | Tela “Pedido salvo”, item na fila e reenvio automático ao reconectar |
| Reconexão | Protocolo `PREF-2026-000011` exibido e fila esvaziada |
| Erro de API simulado | Mensagem, erro de foto, foco no resumo e valores digitados preservados |
| Mobile 390 × 844 | Sem overflow horizontal |
| Console | Apenas os erros esperados de rede offline e da resposta 400 simulada |

Os protocolos criados durante esta rodada foram removidos do estado local após a validação.

## 3. Contratos da API

Executado contra `http://localhost:3000` com dados fictícios persistidos em
`backend/data/estado.json`:

| Método | Rota | Esperado | Obtido |
|---|---|---|---|
| GET | `/api/health` | 200 `ok` | 200 `ok` |
| GET | `/api/servicos` | 200 com 9 itens | 200, 9 |
| GET | `/api/avisos` | 200 | 200 |
| GET | `/api/perfil` | 200 | 200 |
| GET | `/api/solicitacoes` | 404 (listagem pública removida) | 404 |
| GET | `/api/solicitacoes/PREF-2026-000001` sem código | 404 `codigo_acesso_invalido` | 404 genérico |
| GET | `/api/solicitacoes/PREF-2026-000001` com código demo | 200 | 200 |
| GET | `/api/solicitacoes/PREF-2026-999999` com qualquer código | 404 `codigo_acesso_invalido` | 404 genérico |
| GET | `/api/solicitacoes/semelhantes?tipo=iluminacao&endereco=…` | 200, até 3, só tipo/status/distância | 200, sem protocolo |
| POST | `/api/solicitacoes` sem código ou com código inválido | 422 com `campos.codigoAcesso` | 422 |
| POST | `/api/solicitacoes` válido | 201 + protocolo, sem hash | 201 + protocolo |
| POST | mesma requisição com `clientId` e código repetidos | 200 `criada: false` | 200, mesmo protocolo |
| POST | mesmo `clientId` com outro código | 404 `codigo_acesso_invalido` | 404 |
| GET | detalhe/status com código correto | 200 sem `codigoAcessoHash` | 200 |
| POST | avaliação com código e pedido não concluído | 422 | 422 |
| GET | `/api/gestao/solicitacoes` sem sessão | 401 | 401 |
| GET | `/api/gestao/solicitacoes` com sessão | 200 + total + estatísticas | 200, total 8 |
| PATCH | `/api/gestao/solicitacoes/:protocolo/status` | 200 + histórico | 200 (validado via painel) |
| POST | `/api/solicitacoes/:protocolo/avaliacao` | 201; segunda tentativa 409 | 201; avaliação única |
| POST | 10 POSTs no mesmo minuto por IP | 429 no excedente | Validado em ciclo anterior; não repetido para preservar o estado |

Detalhe público de `PREF-2026-000001` (código demo `DEMA-ACES-S226`) retornou os campos públicos
esperados, incluindo `setor`, `setorNome`, `transferida` e `protegida`, sem `contato`, `clientId`,
`triagem`, `transferencias` ou `codigoAcessoHash`. Semelhantes retornaram apenas
`tipo, tipoTitulo, status, distanciaMetros`.

A suíte `backend/test/api.test.js` cobre esses contratos em um `DATA_FILE` temporário, sem tocar no
estado de demonstração. Ela confirma que código ausente/incorreto, protocolo inexistente e tentativa de
reabrir o mesmo `clientId` com outro código produzem a mesma resposta genérica, e que a resposta pública
não contém o código em claro.

Estatísticas da gestão no fechamento: **total 8, abertas 7, atrasadas 1, concluídas 1,
avaliações 1, média 5,0**. A avaliação da `PREF-2026-000002` (nota 5 e comentário) está persistida.
A `PREF-2026-000005` mantém foto, localização, prioridade alta e histórico.

## 4. Fluxos de interface

Executados com Playwright no build de produção:

| Passo | Resultado |
|---|---|
| Home carrega 4 avisos, 6 destaques e contador de 9 serviços | OK |
| Busca `iluminacao` encontra “Iluminação pública” | OK |
| `/servicos` lista os 9 serviços e filtros por categoria | OK |
| Serviço pré-selecionado via `?tipo=meio_ambiente` | OK |
| Formulário aceita descrição, endereço e foto | OK |
| Rascunho restaurado após reload | OK |
| Pedido offline enfileirado e reenviado | OK |
| `PREF-2026-000008` aparece em “Meus pedidos” após a confirmação | OK |
| Código de acesso é exibido/copiado e não aparece na URL | OK |
| Acompanhamento de `PREF-2026-000002` mostra histórico, SLA e avaliação | OK |
| Consulta em contexto limpo sem código pede o preenchimento e não busca o pedido | OK |
| Código errado mostra “Protocolo ou código não confere” sem revelar existência | OK |
| Código correto reabre o pedido em outro contexto | OK |
| Gestão autenticada lista 8 pedidos, filtros e estatísticas | OK |
| Detalhe da gestão abre `PREF-2026-000008` sem erro | OK |
| Mudança de status/prioridade atualiza histórico e estatísticas | OK em ciclo anterior; estado atual reflete a alteração |
| Protocolo inexistente mostra “Protocolo não encontrado” | OK |
| Rota inexistente mostra 404 | OK |

## 5. Acessibilidade

Testes manuais e com Playwright em 390 px e 1280 px:

| Verificação | Resultado |
|---|---|
| Atalho “Pular para o conteúdo” no login da gestão | Primeiro `Tab` foca o link; `Enter` leva ao `main#gestao-conteudo` |
| Atalho também no app | Presente no `Layout` e no painel |
| Foco visível | OK em links, botões, campos e seleção de serviço |
| Fonte ampliada | `data-fonte="grande"`, raiz 18 px, sem overflow em 390 px |
| Alto contraste | `data-contraste="alto"`, superfícies/bordas e controles com estado pressionado |
| Preferências | Persistidas em `localStorage` e reaplicadas ao recarregar |
| Labels e mensagens | Campos associados; erros com `role="alert"`; status com `aria-live` |
| Alvos de toque | Botões e links principais com área de pelo menos 44 px |

A captura [perfil-acessibilidade.png](evidencias/v3/perfil-acessibilidade.png) registra fonte ampliada e
alto contraste ativos.

Ainda pendente: auditoria com leitor de tela (VoiceOver/TalkBack), `axe` e Lighthouse formais.

## 6. Rede local

| Verificação | Resultado |
|---|---|
| `http://192.168.0.68:5173` a partir do PC | 200 |
| `/api/health` via proxy na LAN | 200 `ok` |
| Firewall TCP 5173/4173/3000 (`LocalSubnet`) | Criado em 22/10 |
| Acesso pelo celular na mesma Wi-Fi | Validado pelo usuário em ciclo anterior |

> Em HTTP na LAN o Service Worker não registra (contexto não seguro). Telas, formulário e API
> funcionam; offline, instalação e prompt de instalação exigem `localhost` ou HTTPS local. O PWA
> completo foi validado no desktop em `http://localhost:4173`.

## 7. Evidências visuais

Capturas do build de produção em 22/10/2026, em `doc/evidencias/v3/`:

| Arquivo | Descrição |
|---|---|
| [home-desktop.png](evidencias/v3/home-desktop.png) | Home com avisos, 6 destaques e 9 serviços (1280 px) |
| [home-mobile.png](evidencias/v3/home-mobile.png) | Home em viewport de 390 × 844 |
| [servicos-desktop.png](evidencias/v3/servicos-desktop.png) | Catálogo completo com 9 serviços |
| [busca-sem-acento.png](evidencias/v3/busca-sem-acento.png) | Busca `iluminacao` encontrando “Iluminação pública” |
| [form-mobile.png](evidencias/v3/form-mobile.png) | Formulário mobile com serviço selecionado e rascunho |
| [form-campos-mobile.png](evidencias/v3/form-campos-mobile.png) | Descrição, CEP e campos assistidos no mobile |
| [fila-offline.png](evidencias/v3/fila-offline.png) | Pedido salvo no aparelho com 1 item na fila |
| [fila-enviada.png](evidencias/v3/fila-enviada.png) | Confirmação “Pronto!” com protocolo após reconexão |
| [offline-catalogo.png](evidencias/v3/offline-catalogo.png) | Catálogo aberto offline com faixa de aviso |
| [gestao-painel.png](evidencias/v3/gestao-painel.png) | Painel com estatísticas, filtros e fila de atendimento |
| [gestao-detalhe.png](evidencias/v3/gestao-detalhe.png) | Detalhe do protocolo e formulário de atualização |
| [acompanhar.png](evidencias/v3/acompanhar.png) | Acompanhamento com status, SLA e histórico |
| [avaliacao.png](evidencias/v3/avaliacao.png) | Avaliação registrada com nota e comentário |
| [perfil-acessibilidade.png](evidencias/v3/perfil-acessibilidade.png) | Perfil com fonte ampliada e alto contraste |

## 8. Pendências de validação

| Item | Motivo | Fase |
|---|---|---|
| iPhone físico (Safari, instalação, `standalone`) | Exige HTTPS local (`mkcert`) para SW/offline | 5 |
| Android físico (instalação/standalone) | Fluxo via LAN validado; falta instalação/SW em HTTPS | 5 |
| Push em segundo plano | Implementação fora do escopo; notificações são locais/foreground | Pós-piloto |
| Lighthouse (PWA/Performance/A11y) | Não executado neste ciclo | 6 |
| axe / leitor de tela (VoiceOver, TalkBack) | Auditoria manual pendente | 6 |
| Teste com usuários | Depende de recrutamento | 6 |
| Carga, concorrência e banco real | Persistência JSON atende apenas ao piloto | Pós-piloto |
| Autenticação de titularidade | No piloto o protocolo + código de acesso são a chave | Pós-piloto |
| Lista oficial de secretarias/setores | Mapa demonstrativo em `dominio/catalogo.js`; aguarda confirmação do município | Próximo ciclo |
| Modelo local/LLM para a mini IA | Contrato e fallback por regras prontos; modelo real não integrado | Pós-piloto |
| Cobertura E2E dos fluxos de gestão/offline | O smoke E2E cobre criação e acesso; os demais fluxos seguem com validação manual | 6 |

## 9. Evolução v4 — setores, sessão, transferência e impressão

### 9.1 Teste de integração do backend

Script Node isolado com `DATA_FILE` temporário e `MOCK_LATENCY_MS=0`. Resultado: **32 verificações
aprovadas**, incluindo:

| Verificação | Resultado |
|---|---|
| Login de triagem e cookie `HttpOnly` | OK |
| Restauração de sessão via cookie | OK |
| Triagem vê a fila completa | OK |
| Login de `obras@prefeitura.demo` e escopo server-side | OK; apenas `infraestrutura` |
| Acesso direto a protocolo de outro setor | `403 sem_permissao` |
| Transferência com reclassificação e selo `transferida` | OK |
| SLA original preservado na transferência | OK |
| Consulta pública sem `transferencias`, `triagem` ou motivo interno | OK; evento genérico de encaminhamento |
| Criação de usuário pelo admin e ausência de `senhaHash` nas respostas | OK |
| Admin não consegue remover o próprio papel; estado permanece consistente | OK |
| Logout revoga a sessão; senha incorreta retorna 401 | OK |

Verificação complementar: sem `ADMIN_TOKEN`, o token legado padrão recebe `401`; o login por sessão
continua funcionando. Com a variável definida, o modo de emergência é habilitado explicitamente.

### 9.2 Triagem automática

Com `TRIAGEM_IA_ATIVA=true`, **12 verificações aprovadas**:

| Verificação | Resultado |
|---|---|
| Flag exposta em `/gestao/sessao` | `triagemAutomatica: true` |
| Pedido de poda com árvore/fiação | Setor `meio_ambiente` atribuído automaticamente |
| Metadados internos na resposta pública | Ausentes |
| Painel de triagem vê sugestão, confiança e aplicação | OK |
| Transferência manual com a automação ligada | OK; status preservado |
| `recalcularSla: true` com troca de serviço | Novo `slaEm` e evento `recalculouSla` |

Com a flag desligada (teste anterior), o novo pedido permaneceu em `triagem`, confirmando o fallback
manual.

### 9.3 Navegador (Playwright)

| Passo | Resultado |
|---|---|
| Login da triagem e restauração após reload | OK |
| Transferência para Zeladoria com reclassificação e selo “Transferida” | OK |
| Histórico do painel com evento de transferência | OK |
| Impressão acionando `window.print` e área de impressão | OK |
| Prévia com `emulateMedia('print')` | Painel/topo ocultos; documento visível |
| Login do setor de obras | Vê somente `PREF-2026-000003` |
| Conta de setor criada e desativada pelo admin | Login bloqueado após desativação |
| Sessão “manter conectado” após recarregar `/gestao` | OK |
| Painel em 390 px | Sem overflow horizontal (`scrollWidth 375`) |
| Consulta pública de protocolo transferido | Selo, setor responsável e evento “Transferência” visíveis |

### 9.4 Evidências v4

- [painel-setor.png](evidencias/v4/painel-setor.png) — visão restrita do setor de obras.
- [painel-setor-mobile.png](evidencias/v4/painel-setor-mobile.png) — painel em 390 px.
- [usuarios.png](evidencias/v4/usuarios.png) — criação e gestão de usuários pelo admin.
- [transferencia.png](evidencias/v4/transferencia.png) — modal de transferência/reclassificação.
- [impressao.png](evidencias/v4/impressao.png) — prévia de impressão somente com o documento.

> Os testes de navegador usaram um arquivo temporário (`DATA_FILE`), sem alterar o estado de
> demonstração do repositório. A lista oficial de secretarias continua pendente; o mapa atual é
> demonstrativo.

### 9.5 Refatoração do backend em camadas

O backend foi separado em `rotas`, `controladores`, `servicos`, `repositorios`, `middlewares`,
`dominio`, `validadores`, `apresentadores` e `utils`, sem alterar os contratos HTTP. A suíte de
regressão foi repetida após a migração: **32/32** verificações de solicitações e sessão, **23/23** de
configurações, **12/12** de triagem automática e o opt-in do token legado passou.

Um smoke test adicional cobriu **38/38** verificações: saúde da API, catálogo público, configuração
pública e administrativa, proteção de segredos, criação idempotente, consulta de protocolo, avaliação,
`409 ja_avaliada`, atualização de status, transferência, escopo por setor, 404, JSON inválido e logout.

### 9.6 Refatoração do frontend em camadas

O frontend foi migrado para a estrutura plana em português: `componentes`, `paginas`, `contexto`,
`servicos`, `utils`, `estilos`, `hooks` e `i18n`. As pastas antigas `lib`, `components`, `pages`,
`context` e o arquivo `index.css` deixaram de existir. O codemod final reescreveu **89 imports** e
nenhuma referência às pastas antigas permaneceu.

A página `paginas/Gestao.jsx`, que antes concentrava toda a funcionalidade, passou a apenas compor a
tela. A lógica foi separada em:

- `useGestaoSessao`: login, logout, restauração e expiração da sessão;
- `useGestaoFila`: fila, filtros, detalhe, status, seleção e impressão;
- `useGestaoTransferencia`: modal, reclassificação e transferência;
- `useGestaoImpressao`: estado e acionamento da impressão;
- `useGestaoUsuarios`: cadastro, listagem, ativação e desativação de usuários.

A apresentação da gestão foi dividida em `componentes/gestao/`: `GestaoLogin`, `GestaoTopo`,
`GestaoResumo`, `GestaoUsuarios`, `GestaoFiltros`, `GestaoAcoes`, `GestaoLista`, `GestaoDetalhe`,
`GestaoTransferencia` e `GestaoImpressao`. Constantes e helpers puros ficaram em `utils/gestao.js`.
O CSS global foi preservado em `estilos/global.css`; não houve fragmentação artificial. A integração
externa de CEP foi movida de `NovaSolicitacao` para `servicos/cep.js`, eliminando o último `fetch`
disperso em página.

Validação após a divisão, com backend isolado em `:3001` e `DATA_FILE` temporário, frontend em `:5174`:

| Fluxo | Resultado |
|---|---|
| Login do admin e carregamento da fila com estatísticas | OK |
| Filtro por status com debounce e limpeza dos filtros | OK |
| Abertura do detalhe e foco no título do painel | OK |
| Atualização de status/prioridade e observação no histórico | OK |
| Transferência com reclassificação, setor sugerido e selo “Transferida” | OK |
| Fechamento do modal por `Escape` e por botão | OK |
| Criação e desativação de usuário de teste no arquivo temporário | OK |
| Impressão de 3 solicitações com `window.print` e área de impressão | OK |
| Logout, novo login e escopo correto do setor Meio Ambiente | OK |
| Impressão e modal de transferência abertos antes do logout | Ausentes após o novo login; detalhe e dados privilegiados limpos |
| Expiração de sessão por remoção do cookie e retorno ao login | OK |
| Carregamento de `/gestao/configuracoes` | OK |
| Painel em 390 × 844 | Sem overflow horizontal (`scrollWidth 375`) |
| Console | Apenas os `401` esperados da checagem/expiração de sessão |

O build de produção e o Service Worker foram revalidados conforme a seção 2.4. O arquivo temporário
`frontend/vite.ui-test.config.js`, o `DATA_FILE` de teste e os servidores nas portas `3001`, `4173` e
`5174` foram removidos/encerrados.

### 9.7 Evolução v5 — código de acesso, persistência e testes

#### Código de acesso

| Verificação | Resultado |
|---|---|
| Formato `ABCD-EFGH-JKLM`, 12 caracteres, alfabeto sem `I/O/0/1` | OK nos testes compartilhados |
| Geração com `crypto.getRandomValues` no navegador | OK; 20 códigos consecutivos distintos |
| Hash persistido; código em claro ausente no JSON | OK |
| Código na URL, resposta pública ou cache do SW | Ausente; E2E coleta requisições e caches |
| Detalhe/status/avaliação/reenvio sem código | `404 codigo_acesso_invalido` |
| Protocolo inexistente e código errado | Mesma resposta genérica |
| Semelhantes sem protocolo/endereço/descrição | OK |
| Seed demo `PREF-2026-000001..000003` com `DEMA-ACES-S226` | OK; demais registros antigos sem hash inacessíveis |

#### Persistência

| Verificação | Resultado |
|---|---|
| Arquivo temporário + `fsync` + `rename` atômico | OK; `.tmp` removido |
| Backup `.bak` com a versão anterior | OK |
| Recuperação do `.bak` com principal corrompido | OK, tanto para JSON inválido quanto para schema incompleto |
| Principal e backup inválidos | Inicialização falha, sem usar sementes silenciosamente |
| Campo `solicitacoes` ausente ou com tipo inválido | Inicialização falha quando não há backup válido; o backup é tentado antes |
| Backup preservado ao regravar um principal com schema inválido | OK; `.bak` anterior não é sobrescrito |
| Migração de código demo em arquivo antigo | OK; hash gravado, código em claro não |

#### Automação

```text
npm --prefix backend test
ℹ tests 21
ℹ pass 21
ℹ fail 0

npm run test:e2e
Running 1 test using 1 worker
✓ 1 e2e\acesso-protocolo.spec.js
1 passed
```

O E2E usa backend em `:3100` e o **build de produção** do frontend em `:5273`, com `DATA_FILE`
temporário e `MOCK_LATENCY_MS=0`. O fluxo percorre: criação pela UI, confirmação com protocolo +
código, abertura por “Acompanhar”, nova sessão de navegador sem código, erro com código errado,
reabertura com código correto, requisições com `x-codigo-acesso`, ativação do Service Worker e cache
`api-public-v3` sem `/api/solicitacoes`. O workflow `.github/workflows/ci.yml` executa lint, testes do
backend, build, instalação do Chromium e E2E.

## 10. Conclusão

O piloto atende aos critérios locais das fases implementadas: **lint 0/0**, build sem erros, 21 testes
de backend e 1 smoke E2E, API com contratos e erros consistentes, código de acesso sem exposição na URL
ou em cache, persistência JSON atômica com backup, nove serviços, fila offline com idempotência, painel
de gestão com login e escopo por setor, transferência/reclassificação, impressão, triagem automática
ativável, SLA, avaliação, notificações locais, atalhos de acessibilidade e PWA com cache público
controlado. O frontend também está organizado em componentes, páginas, serviços, hooks e utilitários,
com a API centralizada e a gestão decomposta em responsabilidades menores. A recomendação é usar esta
versão para demonstração e avançar para a validação em dispositivos reais e para as pendências de
produção listadas acima.
