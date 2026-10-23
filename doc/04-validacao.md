# 04 — Relatório de validação local

| Campo | Valor |
|---|---|
| Data da execução | 23/10/2026 |
| Ambiente | Windows, Node **24.12.0**, npm **11.6.2**, Chrome (Playwright) |
| Versões | Vite **8.3.5**, vite-plugin-pwa **2.0.0**, React **19.3.1**, react-router-dom **7.18.4**, Express **5.3.0** |
| Escopo | API com persistência, catálogo, formulário, fila offline, acompanhamento, avaliação, gestão com login/setores/transferência/impressão, triagem automática e PWA |
| Resultado | **Aprovado nos critérios locais**; instalação em aparelho físico, push em segundo plano e auditoria formal de acessibilidade ficam pendentes |

## 1. Qualidade de código

| Verificação | Comando | Resultado |
|---|---|---|
| Lint | `npm run lint` | **0 erros, 3 warnings** (`react(set-state-in-effect)`) |
| Build | `npm run build` | Sucesso em 0,79 s |

Saída do build:

```
dist/registerSW.js                              0.13 kB
dist/manifest.webmanifest                       0.67 kB
dist/index.html                                 1.25 kB │ gzip:   0.57 kB
dist/assets/logo-icone-branco-*.png             9.09 kB
dist/assets/logo-icone-colorido-*.png          41.88 kB
dist/assets/index-*.css                        58.44 kB │ gzip:  11.18 kB
dist/assets/index-*.js                        388.43 kB │ gzip: 115.46 kB

PWA v2.0.0  mode generateSW
precache  17 entries (555.41 KiB)
files generated: dist/sw.js, dist/workbox-*.js
```

Os warnings são informativos e ficam em `frontend/src/hooks/useAtualizacoes.js:85`,
`frontend/src/components/Layout.jsx:38` e `frontend/src/pages/NovaSolicitacao.jsx:161`. Eles apontam
chamadas de `setState` dentro de efeitos de sincronização com APIs externas; não impedem o build nem
geram erro em execução. O bundle JS cresceu em relação ao ciclo anterior por causa das novas telas
(catálogo, gestão, avaliação, acessibilidade e fila offline).

Correções feitas durante esta rodada:

- leitura da `sequencia` persistida no JSON, evitando depender apenas do maior protocolo existente;
- a mensagem “Rascunho restaurado” permanece visível até o usuário editar o formulário;
- removido `autoFocus` do login da gestão para o atalho “Pular para o conteúdo” ser o primeiro foco;
- cache antigo `api-get-v1` é apagado no boot e o cache novo é `api-public-v2`;
- listagem pública de solicitações removida; respostas públicas não devolvem `contato` nem `clientId`;
- busca sem acentos normalizada na Home, catálogo e gestão;
- datas civis (`AAAA-MM-DD`) formatadas sem deslocamento de fuso.
- mensagens de erro do backend passaram a incluir `mensagem` (antes o campo era omitido e o frontend
  mostrava apenas “operação (401)”);
- histórico público de transferência mostra o setor de destino sem expor o motivo interno;
- a área de impressão permanece no DOM após `window.print()`, permitindo revisar a prévia e reimprimir.

## 2. PWA e Service Worker

Verificado em `http://localhost:4173` com o build de produção:

| Item | Resultado |
|---|---|
| `dist/sw.js` e `dist/workbox-*.js` | Gerados |
| Registro do Service Worker | Ativo, escopo `/` |
| Cache de assets | `workbox-precache-v2-http://localhost:4173/` |
| Cache de API pública | `api-public-v2` |
| Cache antigo `api-get-v1` | Ausente após o boot e a limpeza automática |
| Manifest e ícones | 192, 512, maskable 512, apple-touch 180 e favicon 32 acessíveis |
| Rotas de gestão no cache | Nenhuma; URLs observadas: `/api/avisos`, `/api/servicos` e `/status` |

O teste abriu a Home, depois `/gestao`, autenticou e abriu um detalhe. As chaves do `api-public-v2`
continuaram apenas com avisos, serviços e endpoints `/status`; não apareceram `/api/gestao`,
`/api/solicitacoes/<protocolo>` (detalhe) nem imagens/fotos do pedido. Escritas (`POST`) nunca são
cacheadas.

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
| GET | `/api/solicitacoes/PREF-2026-000001` | 200 | 200 |
| GET | `/api/solicitacoes/PREF-2026-999999` | 404 | 404 |
| GET | `/api/solicitacoes/semelhantes?tipo=iluminacao&endereco=…` | 200, até 3, sem endereço | 200, 2 |
| POST | `/api/solicitacoes` válido | 201 + protocolo | 201 + protocolo |
| POST | `/api/solicitacoes` com descrição curta | 422 com `campos` | 422 |
| POST | mesma requisição com `clientId` repetido | 200 `criada: false` | 200, mesmo protocolo |
| GET | `/api/gestao/solicitacoes` sem sessão | 401 | 401 |
| GET | `/api/gestao/solicitacoes` com sessão | 200 + total + estatísticas | 200, total 8 |
| PATCH | `/api/gestao/solicitacoes/:protocolo/status` | 200 + histórico | 200 (validado via painel) |
| POST | `/api/solicitacoes/:protocolo/avaliacao` | 201; segunda tentativa 409 | 201; avaliação única |
| POST | 10 POSTs no mesmo minuto por IP | 429 no excedente | Validado em ciclo anterior; não repetido para preservar o estado |

Detalhe público de `PREF-2026-000001` retornou os campos públicos esperados, incluindo `setor`,
`setorNome` e `transferida`, sem `contato`, `clientId`, `triagem` ou `transferencias`. Semelhantes
retornaram apenas
`protocolo, tipo, tipoTitulo, status, criadoEm, atualizadoEm, distanciaMetros`.

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
| Acompanhamento de `PREF-2026-000002` mostra histórico, SLA e avaliação | OK |
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
| Autenticação de titularidade | No piloto o protocolo é a chave de acesso | Pós-piloto |
| Lista oficial de secretarias/setores | Mapa demonstrativo em `store.js`; aguarda confirmação do município | Próximo ciclo |
| Modelo local/LLM para a mini IA | Contrato e fallback por regras prontos; modelo real não integrado | Pós-piloto |
| Testes automatizados em CI | A validação atual é manual + Playwright | 6 |

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

## 10. Conclusão

O piloto atende aos critérios locais das fases implementadas: build e lint sem erros, API com contratos e
erros consistentes, persistência em JSON, nove serviços, fila offline com idempotência, painel de gestão
com login e escopo por setor, transferência/reclassificação, impressão, triagem automática ativável, SLA,
avaliação, notificações locais, atalhos de acessibilidade e PWA com cache público controlado. A
recomendação é usar esta versão para demonstração e avançar para a validação em dispositivos reais e para
as pendências de produção listadas acima.
