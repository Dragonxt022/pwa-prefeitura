# 02 — Requisitos e contratos

| Campo | Valor |
|---|---|
| Versão | 2.0 |
| Data | 22/10/2026 |
| Status | Implementado no piloto técnico |
| Referências | [01-projeto-inicial.md](01-projeto-inicial.md) · [03-plano-execucao.md](03-plano-execucao.md) |

Convenções: **RF** requisito funcional, **RN** regra de negócio, **RNF** requisito não funcional.
Cada requisito tem critério de aceite verificável.

## 1. Personas e permissões

O piloto tem um único perfil, não autenticado, chamado `cidadao-demo`. Não há tela de login, não há
separação por secretaria e não há operação administrativa. Qualquer usuário do dispositivo vê os
mesmos dados fictícios.

## 2. Mapa de navegação

| Rota | Tela | Objetivo |
|---|---|---|
| `/` | Home | Avisos, busca de serviços e atalhos |
| `/nova-solicitacao` | Nova solicitação | Registrar pedido e obter protocolo |
| `/nova-solicitacao?tipo=<id>` | Nova solicitação (pré-selecionada) | Atalho a partir do catálogo |
| `/acompanhar` | Acompanhar | Consultar status por protocolo |
| `/acompanhar?protocolo=<PREF-…>` | Acompanhar (consulta automática) | Link direto da confirmação |
| `/perfil` | Perfil | Dados fictícios, notificações e privacidade |
| `*` | 404 | Fallback |

## 3. Requisitos funcionais

### RF-01 — Home com avisos

Exibir avisos ordenados do mais recente para o mais antigo, com título, resumo, categoria, data e selo
de prioridade (`Urgente`, `Informativo`, `Aviso`).

**Aceite:** ao abrir `/` com o backend ativo, os 4 avisos mockados aparecem em até 2 s; a data é
formatada `dd/mm/aaaa`; cada aviso tem um único `h3`.

### RF-02 — Catálogo e busca de serviços

Listar os serviços com categoria, descrição e prazo estimado. A busca filtra por título, descrição e
categoria, sem diferenciar maiúsculas/acentuação do termo digitado.

**Aceite:** digitar "ilum" retorna "Iluminação pública"; busca sem resultado exibe mensagem com o termo;
contador "N de M" reflete o filtro.

### RF-03 — Atalho do catálogo para o formulário

Clicar em um serviço abre `/nova-solicitacao?tipo=<id>` com o tipo já selecionado e a descrição de apoio
do serviço visível.

**Aceite:** o `select` inicia com o serviço clicado; o texto de ajuda mostra prazo estimado.

### RF-04 — Registro de solicitação

Formulário com tipo (obrigatório), descrição (10–1200 caracteres), endereço (5–200) e contato opcional
(até 120). O envio deve ser bloqueado enquanto a requisição está em andamento.

**Aceite:** campos inválidos são destacados com mensagem junto ao campo e resumo no topo com foco
programático; ao corrigir um campo, o erro correspondente desaparece; o botão mostra "Enviando…" e
fica desabilitado.

### RF-05 — Protocolo e confirmação

Após o `POST` bem-sucedido, exibir o protocolo gerado, o serviço, o endereço e a data/hora, com botão
"Copiar" e link "Acompanhar agora". O protocolo também é salvo no dispositivo.

**Aceite:** protocolo no formato `PREF-AAAA-000000`; "Copiar" usa Clipboard API e confirma com "Copiado!";
o link leva a `/acompanhar?protocolo=…` com consulta automática.

### RF-06 — Acompanhamento por protocolo

Consultar `GET /api/solicitacoes/:protocolo` e exibir status, descrição do status, serviço, endereço,
datas e linha do tempo do histórico.

**Aceite:** protocolo existente mostra a linha do tempo com o evento mais recente destacado; protocolo
inexistente mostra "Protocolo não encontrado" com orientação; falha de rede mostra "Sem conexão";
consulta vazia exibe aviso e devolve o foco ao campo.

### RF-07 — Consultas recentes

Manter até 5 protocolos consultados no `localStorage` (`prefeitura:consultas`) e exibi-los como chips,
permitindo nova consulta com um toque. O último protocolo fica em `prefeitura:ultimo-protocolo`.

**Aceite:** o protocolo recém-criado aparece como chip; a lista não duplica; sobrevive a recarregar a página.

### RF-08 — Perfil fictício

Exibir nome, documento mascarado, e-mail, telefone, bairro e data de cadastro vindos da API, com selo
"Demonstração".

**Aceite:** dados iguais aos do backend; nenhum campo editável; aviso de que autenticação está fora do escopo.

### RF-09 — Preferência de notificação condicionada

Oferecer o botão de ativar notificações **somente** quando o app estiver instalado (`display-mode:
standalone`), a API `Notification` existir e a permissão não tiver sido decidida. No iOS, explicar que
é necessário adicionar à Tela de Início.

**Aceite:** no navegador comum o botão fica desabilitado com "Disponível após instalar"; em modo
standalone o clique chama `Notification.requestPermission()` (gesto do usuário); permissão negada
mostra instrução de desbloqueio.

### RF-10 — Limpeza de dados locais

Permitir apagar protocolos e preferências com confirmação, exibindo mensagem de sucesso.

**Aceite:** após limpar, os chips de consultas recentes desaparecem e o `localStorage` não contém as chaves.

### RF-11 — PWA instalável

Fornecer manifest com `id`, `name`, `short_name`, `start_url`, `scope`, `display: standalone`,
`theme_color`, `background_color`, `lang`, ícones 192/512 (any) e 512 (maskable), além de
`apple-touch-icon` 180 e metas iOS.

**Aceite:** DevTools → Application → Manifest sem erros; Service Worker `ativado e em execução`;
`dist/sw.js` presente no build.

### RF-12 — Operação offline

Servir o app e as últimas respostas `GET /api/*` a partir do cache quando não houver rede; bloquear
escritas com mensagem clara, preservando o que foi digitado.

**Aceite:** com "Offline" no DevTools, recarregar `/` ainda mostra avisos e serviços em cache; enviar
formulário offline mostra "Sem conexão" sem perder os campos; nenhuma tela branca.

## 4. Regras de negócio

| ID | Regra |
|---|---|
| RN-01 | Protocolo é gerado no servidor, formato `PREF-<ano>-<sequencial 6 dígitos>`, único no processo. |
| RN-02 | O protocolo é imutável; não é possível editar uma solicitação no piloto. |
| RN-03 | Status segue a máquina de estados da seção 5; toda mudança gera um evento no histórico. |
| RN-04 | Descrição entre 10 e 1200 caracteres; endereço entre 5 e 200; contato até 120 (opcional). |
| RN-05 | O `tipo` deve existir no catálogo do servidor; o cliente não pode inventar tipos. |
| RN-06 | O servidor é a fonte da verdade da validação; o cliente valida antes apenas para UX. |
| RN-07 | `POST /api/solicitacoes` aceita no máximo 10 envios por minuto por IP (429 acima disso). |
| RN-08 | Erros sempre no envelope `{ erro: { codigo, mensagem, campos? } }`. |
| RN-09 | Datas trafegam em ISO 8601 com fuso; a UI formata em `pt-BR`. |
| RN-10 | Consulta por protocolo é case-insensitive e ignora espaços nas pontas. |

## 5. Máquina de estados

```
recebida ──► em_analise ──► em_execucao ──► concluida
    │              │              │
    └──────────────┴──────────────┴──────► indeferida
```

| Status | Rótulo | Descrição exibida |
|---|---|---|
| `recebida` | Recebida | Solicitação registrada e aguardando triagem |
| `em_analise` | Em análise | Equipe avaliando o local e o encaminhamento |
| `em_execucao` | Em execução | Serviço programado ou em andamento |
| `concluida` | Concluída | Serviço concluído |
| `indeferida` | Indeferida | Solicitação não pôde ser atendida |

Não há transição de `concluida`/`indeferida` de volta no piloto. Reabertura = nova solicitação.

## 6. Contratos de API

Base: `http://localhost:3000/api` (em dev, o front chama `/api` e o proxy do Vite encaminha).

Envelope de sucesso: `{ "dados": ... }` — exceto listagens paginadas, que incluem `total`.

### 6.1 `GET /api/health`

```json
{ "dados": { "status": "ok", "versao": "0.1.0", "horario": "2026-10-22T13:20:41.131Z", "latenciaSimuladaMs": 200 } }
```

### 6.2 `GET /api/servicos`

```json
{ "dados": [
  { "id": "iluminacao", "titulo": "Iluminação pública",
    "descricao": "Poste apagado, lâmpada queimada…", "categoria": "Infraestrutura", "prazoDias": 5 }
] }
```

Serviços do piloto: `iluminacao`, `pavimentacao`, `limpeza`, `poda`, `fiscalizacao`, `sinalizacao`.

### 6.3 `GET /api/avisos`

```json
{ "dados": [
  { "id": "aviso-1", "titulo": "Vacinação antirrábica neste sábado",
    "resumo": "Postos móveis em três bairros…", "publicadoEm": "2026-10-20T13:00:00-03:00",
    "prioridade": "alta", "categoria": "Saúde" }
] }
```

`prioridade`: `alta` | `normal` | `baixa`.

### 6.4 `GET /api/perfil`

```json
{ "dados": {
  "id": "cidadao-demo", "nome": "Cidadão Demo", "documentoMascarado": "***.***.***-**",
  "email": "cidadao.demo@exemplo.gov.br", "telefone": "(00) 00000-0000",
  "bairro": "Centro", "desde": "2026-03-11",
  "preferencias": { "notificacoes": false, "canalPreferido": "email" }
} }
```

### 6.5 `GET /api/solicitacoes?status=&tipo=&limite=`

Apoio a depuração. `limite` padrão 50, máximo 100. `total` reflete o filtro.

```json
{ "dados": [ { "protocolo": "PREF-2026-000001", "...": "..." } ], "total": 1 }
```

### 6.6 `POST /api/solicitacoes`

```json
{ "tipo": "iluminacao", "descricao": "Poste apagado…", "endereco": "Rua X, 120 - Centro", "contato": "(11) 90000-0000" }
```

Resposta `201 Created`:

```json
{ "dados": {
  "protocolo": "PREF-2026-000004", "tipo": "iluminacao", "tipoTitulo": "Iluminação pública",
  "descricao": "…", "endereco": "…", "contato": null, "status": "recebida",
  "criadoEm": "2026-10-22T12:25:00.000Z", "atualizadoEm": "2026-10-22T12:25:00.000Z",
  "historico": [ { "status": "recebida", "em": "2026-10-22T12:25:00.000Z", "observacao": "Solicitação registrada pelo aplicativo." } ]
} }
```

### 6.7 `GET /api/solicitacoes/:protocolo`

Retorna o objeto completo da solicitação. `404` quando não existe.

### 6.8 `GET /api/solicitacoes/:protocolo/status`

```json
{ "dados": { "protocolo": "PREF-2026-000001", "status": "em_analise",
  "statusDescricao": "Em análise", "atualizadoEm": "2026-10-14T08:20:00-03:00" } }
```

### 6.9 Códigos de erro

| HTTP | `codigo` | Quando |
|---|---|---|
| 400 | `json_invalido` | Corpo não é JSON válido |
| 404 | `nao_encontrado` | Protocolo/rota inexistente |
| 413 | `corpo_muito_grande` | Corpo acima de 16 KB |
| 422 | `validacao` | Campos inválidos; `campos` traz mensagem por campo |
| 429 | `limite_excedido` | Mais de 10 POSTs por minuto por IP |
| 500 | `erro_interno` | Falha inesperada |

Exemplo 422:

```json
{ "erro": { "codigo": "validacao", "mensagem": "Revise os campos destacados.",
  "campos": { "descricao": "Descreva o problema com pelo menos 10 caracteres." } } }
```

## 7. Requisitos não funcionais

| ID | Requisito | Meta / critério |
|---|---|---|
| RNF-01 | Offline das telas visitadas | 100% após primeira visita; SW precacheia 15 assets |
| RNF-02 | Cache de API | `NetworkFirst`, timeout 3 s, 50 entradas, 24 h |
| RNF-03 | Atualização do app | `autoUpdate` (novo SW assume no próximo carregamento) |
| RNF-04 | Performance | JS ≤ 320 KB bruto (atual: 289 KB / 91 KB gzip) |
| RNF-05 | Acessibilidade | WCAG 2.1 A; foco visível; contraste ≥ 4.5:1; alvos ≥ 44 px |
| RNF-06 | Responsividade | 320 px a 1440 px, safe-area do iOS |
| RNF-07 | Compatibilidade | Chrome/Edge últimas 2 versões; Safari iOS 16.4+; Chrome Android |
| RNF-08 | Idioma | `pt-BR`, com acentuação correta em toda a UI e nas mensagens de erro |
| RNF-09 | Privacidade | Nenhum dado real; contato opcional; limpeza local disponível |
| RNF-10 | Segurança básica | `x-powered-by` desabilitado, corpo limitado a 16 KB, CORS restrito a dev |
| RNF-11 | Qualidade de código | `oxlint` sem warnings; build sem erros |

## 8. Rastreabilidade

| Requisito | Tela / componente | Verificação |
|---|---|---|
| RF-01, RF-02 | `pages/Home.jsx` | Manual + Playwright |
| RF-03, RF-04, RF-05 | `pages/NovaSolicitacao.jsx` | Manual + Playwright |
| RF-06, RF-07 | `pages/Acompanhar.jsx` | Manual + Playwright |
| RF-08..RF-10 | `pages/Perfil.jsx` | Manual |
| RF-11, RF-12 | `vite.config.js`, `components/Layout.jsx` | DevTools + Playwright offline |
| RN-01..RN-10 | `backend/src/**` | Contratos conferidos por HTTP |

## 9. Pendências conhecidas (fora deste ciclo)

- Idempotência do POST (evitar duplicidade em duplo toque/retry do Service Worker).
- Validação de formato de contato (telefone/e-mail) no servidor.
- Paginação real e filtros na listagem (hoje é apoio de debug).
- Testes automatizados unitários/E2E em CI.
- Auditoria de acessibilidade com leitor de tela (VoiceOver/TalkBack).
