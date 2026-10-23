# 02 — Requisitos e contratos

| Campo | Valor |
|---|---|
| Versão | 4.0 |
| Data | 23/10/2026 |
| Status | Implementado no piloto técnico |
| Referências | [01-projeto-inicial.md](01-projeto-inicial.md) · [03-plano-execucao.md](03-plano-execucao.md) · [04-validacao.md](04-validacao.md) |

Convenções: **RF** requisito funcional, **RN** regra de negócio, **RNF** requisito não funcional.
Cada requisito tem critério de aceite verificável.

## 1. Personas e permissões

O piloto tem quatro perfis:

| Perfil | Acesso | Observações |
|---|---|---|
| Cidadão demo | Rotas públicas, sem login | Vê os próprios protocolos salvos no aparelho e consulta qualquer protocolo informado. |
| Administrador | `/gestao` + login | Vê todos os pedidos, setores e usuários; cria/desativa contas. |
| Triagem / Protocolo | `/gestao` + login | Vê a fila completa, altera status e encaminha/reclassifica pedidos. |
| Setor | `/gestao` + login | Vê e atualiza somente os pedidos encaminhados ao próprio setor. |

Não há autenticação de cidadão neste ciclo. O protocolo funciona como chave de acesso na consulta
pública: quem possui o número vê os dados do pedido. Em produção, essa decisão deve ser substituída por
autenticação/verificação de titularidade. A listagem completa de solicitações é exclusiva da gestão.

A sessão interna usa e-mail/senha, cookie `HttpOnly` com `SameSite=Lax` e “manter conectado” por 30
dias. Senhas usam `scrypt` com sal; o token de sessão é persistido somente como hash. O token legado
`x-admin-token` permanece aceito como acesso administrativo de emergência/compatibilidade somente quando
`ADMIN_TOKEN` é configurado explicitamente.

## 2. Mapa de navegação

| Rota | Tela | Objetivo |
|---|---|---|
| `/` | Home | Avisos, busca de serviços, 6 destaques e atalhos |
| `/servicos` | Catálogo | Todos os 9 serviços, busca e filtro por categoria |
| `/nova-solicitacao` | Nova solicitação | Registrar pedido com foto, localização, CEP, rascunho e fila |
| `/nova-solicitacao?tipo=<id>` | Nova solicitação (pré-selecionada) | Atalho a partir do catálogo |
| `/acompanhar` | Acompanhar | Consultar protocolo, Meus pedidos, SLA e avaliação |
| `/acompanhar?protocolo=<PREF-…>` | Acompanhar (consulta automática) | Link direto da confirmação/notificação |
| `/perfil` | Perfil | Dados fictícios, acessibilidade, notificações e limpeza |
| `/gestao` | Gestão | Login por e-mail/senha, fila escopada, transferência, impressão e usuários |
| `*` | 404 | Fallback |

## 3. Requisitos funcionais

### RF-01 — Home com avisos e busca

Exibir avisos ordenados do mais recente para o mais antigo, com título, resumo, categoria, data e selo
de prioridade (`Urgente`, `Informativo`, `Aviso`). Exibir 6 serviços em destaque, contador do catálogo
e busca que consulta todos os serviços.

**Aceite:** ao abrir `/` com o backend ativo, os 4 avisos aparecem; a data é formatada `dd/mm/aaaa`;
a busca encontra “Iluminação pública” ao digitar `iluminacao` (sem acento) e limpa o filtro ao apagar
o termo.

### RF-02 — Catálogo de serviços

Listar os 9 serviços com categoria, descrição, prazo estimado e selo de novidade quando aplicável. A
busca filtra por título, descrição e categoria, sem diferenciar maiúsculas ou acentuação; o filtro por
categoria é combinável com a busca.

**Aceite:** `/servicos` mostra “9 serviços encontrados” sem filtro; busca sem resultado exibe mensagem
com o termo; contador “N de M” reflete o filtro; “Ver todos” na Home abre o catálogo.

### RF-03 — Atalho do catálogo para o formulário

Clicar em um serviço abre `/nova-solicitacao?tipo=<id>` com o tipo já selecionado.

**Aceite:** o cartão do serviço fica marcado na grade, com ícone e prazo estimado visíveis.

### RF-04 — Registro de solicitação

Formulário com:

- tipo obrigatório, escolhido por busca no catálogo;
- descrição de 10 a 1200 caracteres;
- endereço de 5 a 200 caracteres;
- contato opcional de até 120 caracteres;
- CEP opcional com preenchimento assistido por ViaCEP quando online;
- localização opcional por geolocalização do navegador;
- foto opcional de qualquer formato de imagem aceito pelo navegador, reencodada no cliente em até
  1280 px e JPEG 0,72 (limite de 8 MB para o arquivo original).

O envio fica bloqueado enquanto a requisição está em andamento; erros aparecem junto ao campo e em um
resumo com foco programático.

**Aceite:** campos inválidos são destacados; ao corrigir, o erro correspondente desaparece; foto e
localização são opcionais; offline, o formulário continua preenchível e o pedido pode ser salvo na fila.

### RF-05 — Rascunho, fila offline e idempotência

Salvar automaticamente o conteúdo do formulário no `localStorage` após uma pausa de 700 ms e restaurá-lo
ao reabrir. Se o envio falhar por falta de conexão, salvar o pedido em fila (`prefeitura:fila`) com um
`clientId`; ao voltar online, reenviar automaticamente e atualizar a tela para a confirmação com
protocolo.

**Aceite:** recarregar o formulário restaura os campos e mantém o aviso “Rascunho restaurado”; offline,
o botão vira “Salvar no aparelho” e mostra “1 pedido aguardando conexão”; ao reconectar, a fila é
esvaziada, o protocolo é gerado e a confirmação muda para “Pronto!”. Reenviar o mesmo `clientId` devolve
o mesmo protocolo, sem duplicar o pedido.

### RF-06 — Detecção de pedidos parecidos

Ao informar tipo e endereço, consultar pedidos abertos semelhantes por tokens de endereço, texto contido
ou distância de até 300 m (quando há coordenadas) e exibir até 3 resultados com protocolo, status e
distância. Não devolver o endereço do pedido existente.

**Aceite:** endereço semelhante ao `PREF-2026-000001` exibe um aviso com link para o protocolo existente,
sem revelar o endereço cadastrado no pedido original.

### RF-07 — Protocolo e confirmação

Após o `POST` bem-sucedido, exibir o protocolo gerado, o serviço, o endereço, a data/hora, o prazo, botão
de copiar e link “Acompanhar”. O protocolo também é salvo no dispositivo.

**Aceite:** protocolo no formato `PREF-AAAA-000000`; o botão copia via Clipboard API e confirma com
“Copiado”; o link abre `/acompanhar?protocolo=…` com consulta automática.

### RF-08 — Acompanhamento por protocolo

Consultar `GET /api/solicitacoes/:protocolo` e exibir status, descrição do status, serviço, endereço,
datas, SLA, linha do tempo do histórico, foto e localização quando existirem.

**Aceite:** protocolo existente mostra o evento mais recente destacado; protocolo inexistente mostra
“Protocolo não encontrado”; falha de rede mostra “Sem conexão”; consulta vazia exibe aviso e devolve o
foco ao campo. A consulta normaliza maiúsculas e espaços.

### RF-09 — Meus pedidos e atualizações

Manter até 20 pedidos salvos no `localStorage` (`prefeitura:pedidos`), mostrar status, serviço, endereço,
data da última atualização e selo “Atualizado” quando o status mudar. Consultar até 5 protocolos
recentes (`prefeitura:consultas`) e o último protocolo (`prefeitura:ultimo-protocolo`).

**Aceite:** o protocolo criado aparece em “Meus pedidos”; o selo “Atualizado” aparece após uma mudança
de status; os dados sobrevivem a recarregar a página; a lista não duplica protocolos.

### RF-10 — Notificações locais

Gerar um aviso local no app quando o status de um pedido salvo mudar. Se a permissão de `Notification`
estiver concedida e o app estiver aberto, disparar também uma notificação do navegador. Não há push em
segundo plano neste ciclo.

**Aceite:** ao mudar o status na gestão e abrir o app, o contador do menu “Acompanhar” aumenta, a
notificação fica registrada em `prefeitura:notificacoes` e o pedido mostra “Atualizado”; a notificação
do navegador só é disparada quando permitida.

### RF-11 — Avaliação do atendimento

Após a conclusão, permitir avaliação de 1 a 5 estrelas com comentário opcional de até 500 caracteres.
Exibir a avaliação registrada na consulta e a média no painel de gestão.

**Aceite:** formulário só aparece para status `concluida`; envio retorna 201; segunda tentativa retorna
409 (`ja_avaliada`); média e contagem aparecem nas estatísticas da gestão.

### RF-12 — Gestão de solicitações com login e escopo por setor

Painel `/gestao` com login por e-mail/senha, restauração de sessão e perfis `admin`, `triagem` e
`setor`. A fila exibe:

- estatísticas de total, abertas, atrasadas, concluídas, avaliações e média;
- busca por protocolo, endereço, descrição ou setor (sem acentos);
- filtros por status, serviço e, para admin/triagem, por setor;
- detalhe com contato, foto, localização, histórico, avaliação e setor responsável;
- alteração de status, prioridade e observação;
- seleção de pedidos e impressão.

**Aceite:** a triagem e o admin veem todos os pedidos; um usuário de setor recebe apenas os pedidos do
próprio setor, inclusive em acesso direto por protocolo (403 nos demais); a sessão sobrevive a reload
com “manter conectado”; salvar status atualiza histórico e estatísticas; o detalhe recebe foco ao abrir.

### RF-13 — Perfil e acessibilidade

Exibir nome, documento mascarado, e-mail, telefone, bairro e data de cadastro vindos da API. Oferecer
fonte ampliada (raiz 18 px) e alto contraste, persistidos em `localStorage`; permitir solicitar permissão
de notificações quando aplicável; limpar protocolos, rascunhos, fila e notificações locais com
confirmação. As preferências de acessibilidade permanecem salvas.

**Aceite:** preferências sobrevivem a recarregar; fonte ampliada não gera overflow horizontal em 390 px;
alto contraste altera superfícies e bordas; a limpeza atualiza os contadores globais; os dados do perfil
correspondem à API e a data `2026-03-11` é exibida como `11/03/2026` (sem deslocamento de fuso).

### RF-14 — PWA instalável

Fornecer manifest com `id`, `name`, `short_name`, `start_url`, `scope`, `display: standalone`,
`theme_color`, `background_color`, `lang`, ícones 192/512 (any) e 512 (maskable), além de
`apple-touch-icon` 180, metas iOS e `mobile-web-app-capable`.

**Aceite:** DevTools → Application → Manifest sem erros; Service Worker ativo; `dist/sw.js` presente no
build; app navegável offline após a primeira visita em `localhost`/HTTPS.

### RF-15 — Operação offline

Servir o app e os GETs públicos não pessoais a partir do cache quando não houver rede. Escritas nunca
são cacheadas; rascunhos e fila preservam o conteúdo. Detalhes de pedido, foto, localização e gestão
ficam fora do cache do Service Worker.

**Aceite:** com “Offline” no DevTools, recarregar `/servicos` mostra os 9 serviços e a faixa “Sem conexão”;
enviar formulário offline não perde campos e enfileira o pedido; nenhuma tela branca; as rotas de gestão
não aparecem no cache.

### RF-16 — Transferência e reclassificação

Permitir encaminhar uma solicitação para outro setor, com motivo obrigatório e opção de reclassificar o
serviço/categoria. A transferência gera um evento auditável em `transferencias`, atualiza o setor
responsável, preserva o status principal e exibe o selo “Transferida”. O SLA original é preservado por
padrão; `recalcularSla` é uma ação explícita.

**Aceite:** após a transferência, o setor de destino vê o pedido e o setor de origem deixa de vê-lo (ou
o admin/triagem vê ambos); o histórico público mostra “Transferência” sem revelar o motivo interno; o
`PATCH` exige motivo válido e destino ativo.

### RF-17 — Impressão

Imprimir os pedidos selecionados ou o resultado do filtro atual via CSS `@media print`, com cabeçalho,
filtros aplicados, data de geração, tabela de protocolos, setor, endereço, status, prioridade, abertura
e prazo. A foto não entra na impressão.

**Aceite:** a prévia de impressão oculta o painel e mostra apenas o documento; a tabela cabe em A4
retrato; a contagem do rodapé corresponde aos itens impressos.

### RF-18 — Usuários e setores

O administrador pode listar, criar, editar e ativar/desativar usuários de setor, triagem ou admin. O
e-mail é único, a senha inicial tem ao menos 8 caracteres e o setor é obrigatório para o papel `setor`.
Usuário desativado perde acesso nas próximas requisições.

**Aceite:** criar um usuário de setor no painel permite login imediato com o escopo correto; desativar
bloqueia o login; o hash de senha e o token de sessão nunca aparecem nas respostas.

### RF-19 — Triagem automática ativável

Oferecer um classificador local por regras que sugere setor e confiança a partir do serviço, descrição
e endereço. A automação fica desligada por padrão; com `TRIAGEM_IA_ATIVA=true`, o setor sugerido é
aplicado na criação. A triagem manual e a transferência continuam funcionando em qualquer configuração.

**Aceite:** com a flag desligada, novos pedidos entram na triagem central; com a flag ligada, um pedido
de poda com descrição compatível entra em Meio Ambiente; a sugestão interna não é exposta ao cidadão; a
transferência manual continua disponível.

## 4. Regras de negócio

| ID | Regra |
|---|---|
| RN-01 | Protocolo gerado no servidor, formato `PREF-<ano>-<sequencial 6 dígitos>`, único e persistido. |
| RN-02 | O protocolo é imutável; não é possível editar os dados do pedido no piloto. |
| RN-03 | Status é um de `recebida`, `em_analise`, `em_execucao`, `concluida`, `indeferida`; toda mudança gera evento no histórico. |
| RN-04 | Descrição 10–1200; endereço 5–200; contato até 120; observação de gestão até 500; foto até 1.800.000 caracteres base64. |
| RN-05 | O `tipo` deve existir no catálogo do servidor; o cliente não pode inventar tipos. |
| RN-06 | O servidor é a fonte da verdade da validação; o cliente valida antes apenas para UX. |
| RN-07 | `POST /api/solicitacoes` aceita no máximo 10 envios por minuto por IP (429 acima disso). |
| RN-08 | Erros sempre no envelope `{ erro: { codigo, mensagem, campos? } }`. |
| RN-09 | Datas trafegam em ISO 8601 com fuso; datas civis (AAAA-MM-DD) são formatadas sem deslocamento de fuso. |
| RN-10 | Consulta por protocolo é case-insensitive e ignora espaços nas pontas. |
| RN-11 | O SLA é calculado a partir do `prazoDias` do serviço e do `criadoEm`; fica vencido apenas enquanto o pedido está aberto. |
| RN-12 | `clientId` é único por envio; repetir o mesmo `clientId` devolve o pedido existente com `criada: false`. |
| RN-13 | Pedidos parecidos consideram mesmo tipo, status aberto e semelhança de endereço/até 300 m; no máximo 3 resultados. |
| RN-14 | Respostas públicas não incluem `contato`, `clientId` nem o endereço de pedidos semelhantes. |
| RN-15 | Avaliação só é aceita para pedido `concluida`; é única e não pode ser alterada. |
| RN-16 | Rotas de gestão exigem sessão por cookie `HttpOnly`; o token legado `x-admin-token` só é aceito como administrador quando `ADMIN_TOKEN` está definido explicitamente. |
| RN-17 | Escopo é aplicado no servidor: `setor` só lê/atualiza pedidos com `setorId` igual ao seu; admin e triagem acessam todos. |
| RN-18 | Transferência exige setor ativo, motivo de 3–500 caracteres e gera evento em `transferencias`; o status principal não muda. |
| RN-19 | O SLA original é preservado em transferências; só é recalculado com `recalcularSla: true` e mudança de serviço. |
| RN-20 | Senhas de usuários internos usam `scrypt` com sal; token de sessão é persistido apenas como hash SHA-256. |
| RN-21 | Sessão “manter conectado” dura 30 dias (configurável em `SESSION_DAYS`); sem lembrar, expira em 12 h. |
| RN-22 | A triagem automática fica desligada por padrão; com `TRIAGEM_IA_ATIVA=true`, o setor sugerido é aplicado apenas se a confiança for ≥ 0,5, com fallback para a triagem central. |
| RN-23 | A impressão é gerada no cliente via `@media print`; a foto não é impressa e os dados internos de triagem não são exibidos ao cidadão. |

### Serviços e prazos

| ID | Serviço | Categoria | Prazo |
|---|---|---|---|
| `iluminacao` | Iluminação pública | Infraestrutura | 5 dias |
| `pavimentacao` | Buracos e pavimentação | Infraestrutura | 15 dias |
| `limpeza` | Coleta de lixo e limpeza | Zeladoria | 3 dias |
| `poda` | Poda de árvores | Meio ambiente | 10 dias |
| `fiscalizacao` | Fiscalização de terrenos | Fiscalização | 20 dias |
| `sinalizacao` | Sinalização de trânsito | Mobilidade | 7 dias |
| `ouvidoria` | Ouvidoria | Atendimento | 10 dias |
| `zeladoria` | Zeladoria urbana | Zeladoria | 7 dias |
| `meio_ambiente` | Meio ambiente | Meio ambiente | 10 dias |

### Setores (mapa demonstrativo)

A lista oficial ainda não foi confirmada pelo município. Enquanto isso, o piloto usa:

| Setor | Serviços encaminhados | Observação |
|---|---|---|
| Triagem e Protocolo | — | Fila central; vê todos os pedidos |
| Obras e Infraestrutura | iluminação, pavimentação | Também recebe pedidos reclassificados |
| Zeladoria e Serviços Urbanos | limpeza, zeladoria | — |
| Meio Ambiente | poda, meio ambiente | — |
| Fiscalização e Posturas | fiscalização | — |
| Mobilidade e Trânsito | sinalização | — |
| Ouvidoria | ouvidoria | — |

O mapa fica em `backend/src/store.js` e pode ser ajustado quando as secretarias oficiais forem definidas.

## 5. Máquina de estados e SLA

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

No piloto, a gestão pode escolher qualquer status válido; não há validação rígida de transição. O
histórico registra todas as mudanças. `slaEm` é calculado na criação e exibido como “Vence em N dias”,
“Vence hoje” ou “Atrasado há N dias”. Pedidos concluídos/indeferidos não contam como atrasados.

A transferência não é um status: ela muda o setor/serviço e cria um evento no histórico, mantendo o
status atual. O selo “Transferida” é derivado da existência de ao menos uma transferência. O motivo
interno da transferência aparece no painel de gestão, mas a consulta pública mostra apenas que o pedido
foi encaminhado e para qual setor.

## 6. Contratos de API

Base: `http://localhost:3000/api` (em dev, o front chama `/api` e o proxy do Vite encaminha).

Envelope de sucesso: `{ "dados": ... }`; listagens podem incluir `total` e `estatisticas`. Erros usam
`{ "erro": { "codigo", "mensagem", "campos?" } }`.

### 6.1 `GET /api/health`

```json
{ "dados": { "status": "ok", "versao": "0.1.0", "horario": "2026-10-22T13:20:41.131Z", "latenciaSimuladaMs": 200 } }
```

### 6.2 `GET /api/servicos`

```json
{ "dados": [
  { "id": "iluminacao", "titulo": "Iluminação pública",
    "descricao": "Poste apagado, lâmpada queimada…", "categoria": "Infraestrutura",
    "prazoDias": 5, "ordem": 1, "destaque": true }
] }
```

Retorna os 9 serviços ordenados por `ordem`; itens novos também podem trazer `novo: true`.

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

### 6.5 `POST /api/solicitacoes`

Corpo (foto, localização e clientId opcionais):

```json
{
  "tipo": "iluminacao",
  "descricao": "Poste apagado em frente ao número 120.",
  "endereco": "Rua das Palmeiras, 120 - Centro",
  "contato": "cidadao@example.com",
  "foto": "data:image/jpeg;base64,...",
  "localizacao": { "latitude": -23.55, "longitude": -46.63, "precisao": 25 },
  "clientId": "uuid-do-envio"
}
```

Resposta `201 Created` na primeira criação:

```json
{ "dados": {
  "protocolo": "PREF-2026-000008", "tipo": "iluminacao", "tipoTitulo": "Iluminação pública",
  "descricao": "Poste apagado em frente ao número 120.",
  "endereco": "Rua das Palmeiras, 120 - Centro", "status": "recebida",
  "criadoEm": "2026-10-22T12:25:00.000Z", "atualizadoEm": "2026-10-22T12:25:00.000Z",
  "prazoDias": 5, "slaEm": "2026-10-27T12:25:00.000Z", "prioridade": "normal",
  "foto": null, "localizacao": null, "avaliacao": null,
  "historico": [ { "status": "recebida", "em": "2026-10-22T12:25:00.000Z",
    "observacao": "Solicitação registrada pelo aplicativo." } ],
  "slaDiasRestantes": 5, "slaVencido": false
}, "criada": true }
```

Se o `clientId` já existir, responde `200` com o pedido original e `criada: false`. A resposta pública não
inclui `contato`, `clientId` nem os metadados internos de triagem; inclui `setor`, `setorNome` e
`transferida`.

### 6.6 `GET /api/solicitacoes/:protocolo`

Retorna o objeto público com histórico, foto, localização, SLA, setor responsável, selo `transferida`
e avaliação. `404` quando não existe. Respostas são sanitizadas: `contato`, `clientId`, `triagem` e
`transferencias` são removidos; o evento de transferência no histórico não revela o motivo interno.

### 6.7 `GET /api/solicitacoes/:protocolo/status`

```json
{ "dados": { "protocolo": "PREF-2026-000001", "status": "em_analise",
  "statusDescricao": "Em análise", "atualizadoEm": "2026-10-14T08:20:00-03:00",
  "setorNome": "Obras e Infraestrutura", "transferida": false,
  "slaEm": "2026-10-17T22:04:00.000Z", "slaVencido": true, "avaliacao": null } }
```

### 6.8 `GET /api/solicitacoes/semelhantes`

Parâmetros: `tipo` (obrigatório), `endereco`, `latitude`, `longitude`. Retorna até 3 pedidos abertos
semelhantes, sem endereço/contato:

```json
{ "dados": [
  { "protocolo": "PREF-2026-000001", "tipo": "iluminacao", "tipoTitulo": "Iluminação pública",
    "status": "em_analise", "criadoEm": "2026-10-12T19:04:00-03:00",
    "atualizadoEm": "2026-10-14T08:20:00-03:00", "distanciaMetros": null }
] }
```

### 6.9 `POST /api/solicitacoes/:protocolo/avaliacao`

```json
{ "nota": 5, "comentario": "Atendimento rápido e atencioso." }
```

Resposta `201` com o pedido atualizado. Pedido não concluído retorna `422`; já avaliado retorna `409`
(`ja_avaliada`).

### 6.10 `POST /api/gestao/login`

```json
{ "email": "triagem@prefeitura.demo", "senha": "prefeitura-demo", "lembrar": true }
```

Resposta `200` com `Set-Cookie: prefeitura_sessao=...; HttpOnly; SameSite=Lax` (e `Max-Age` quando
`lembrar` é verdadeiro). O corpo não contém o token:

```json
{ "dados": {
  "usuario": { "id": "usuario-triagem", "nome": "Equipe de Triagem",
    "email": "triagem@prefeitura.demo", "papel": "triagem", "setorId": "triagem",
    "setor": { "id": "triagem", "nome": "Triagem e Protocolo", "central": true } },
  "expiraEm": "2026-11-22T13:00:00.000Z", "lembrar": true, "triagemAutomatica": false
} }
```

Credenciais inválidas: `401 credenciais_invalidas`. O cabeçalho legado `x-admin-token` não é necessário
para o navegador e não cria sessão persistente.

### 6.11 `GET /api/gestao/sessao`

Valida o cookie e devolve `usuario`, `setor` e `triagemAutomatica`. Sem sessão: `401 nao_autorizado`.

### 6.12 `GET /api/gestao/setores`

Lista os setores ativos e o mapeamento demonstrativo de serviços. Requer qualquer sessão.

### 6.13 `GET /api/gestao/solicitacoes`

Filtros: `status`, `tipo`, `busca`, `setor`, `ids` (lista separada por vírgula) e `limite` (máximo 500).
Para usuários com papel `setor`, o servidor ignora `setor` e aplica o próprio escopo. Resposta:

```json
{ "dados": [ { "protocolo": "PREF-2026-000005", "setorNome": "Obras e Infraestrutura",
  "transferida": true, "transferencias": [], "...": "..." } ],
  "total": 7,
  "estatisticas": { "total": 7, "abertas": 6, "atrasadas": 1, "concluidas": 1,
    "avaliacoes": 1, "mediaAvaliacao": 5.0 },
  "triagemAutomatica": false }
```

### 6.14 `GET /api/gestao/solicitacoes/:protocolo`

Retorna o detalhe completo para a gestão, incluindo contato, clientId, foto, localização, histórico,
triagem interna, setor e transferências. Setor fora do escopo recebe `403 sem_permissao`.

### 6.15 `PATCH /api/gestao/solicitacoes/:protocolo/status`

```json
{ "status": "em_execucao", "prioridade": "alta", "observacao": "Equipe designada para vistoria." }
```

`status` é obrigatório; `prioridade` aceita `alta` | `normal` | `baixa`; `observacao` até 500 caracteres.
Resposta inclui `dados` atualizados e `estatisticas`.

### 6.16 `PATCH /api/gestao/solicitacoes/:protocolo/transferir`

```json
{
  "setorDestinoId": "zeladoria",
  "tipoDestino": "zeladoria",
  "motivo": "Demanda de zeladoria urbana, não de iluminação.",
  "recalcularSla": false
}
```

`setorDestinoId` e `motivo` (3–500) são obrigatórios. `tipoDestino` é opcional e reclassifica o serviço.
`recalcularSla` só tem efeito quando o serviço muda. A resposta devolve o pedido decorado com
`transferida`, `setorNome`, histórico e a lista de `transferencias`.

### 6.17 `GET|POST /api/gestao/usuarios` e `PATCH /api/gestao/usuarios/:id`

Somente `admin`. `POST` recebe `nome`, `email`, `senha` (mínimo 8), `papel` (`admin` | `triagem` |
`setor`) e `setorId` quando papel for `setor`. `PATCH` aceita `nome`, `email`, `senha`, `papel`,
`setorId` e `ativo`. O próprio admin não pode desativar a conta; senhas e hashes nunca são devolvidos.

### 6.18 Códigos de erro

| HTTP | `codigo` | Quando |
|---|---|---|
| 400 | `json_invalido` | Corpo não é JSON válido |
| 401 | `nao_autorizado` | Sessão ausente/expirada em rota protegida |
| 401 | `credenciais_invalidas` | E-mail ou senha inválidos, ou usuário desativado |
| 403 | `sem_permissao` | Papel insuficiente ou pedido de outro setor |
| 404 | `nao_encontrado` | Protocolo/rota/usuário inexistente |
| 409 | `ja_avaliada` | Pedido já possui avaliação |
| 413 | `corpo_muito_grande` | Corpo acima de 2 MB |
| 422 | `validacao` | Campos inválidos; `campos` traz mensagem por campo |
| 429 | `limite_excedido` | Mais de 10 POSTs públicos por minuto por IP (login tem limite próprio) |
| 500 | `erro_interno` | Falha inesperada |

Exemplo 422:

```json
{ "erro": { "codigo": "validacao", "mensagem": "Revise os campos destacados.",
  "campos": { "descricao": "Descreva o problema com pelo menos 10 caracteres." } } }
```

## 7. Requisitos não funcionais

| ID | Requisito | Meta / critério |
|---|---|---|
| RNF-01 | Offline das telas visitadas | 100% após primeira visita; SW precacheia os assets do build |
| RNF-02 | Cache de API | `NetworkFirst` para GETs públicos, timeout 3 s, 50 entradas, 24 h |
| RNF-03 | Privacidade no cache | Detalhe do pedido, foto, localização e gestão fora do cache; `api-get-v1` removido no boot |
| RNF-04 | Atualização do app | `autoUpdate` (novo SW assume no próximo carregamento) |
| RNF-05 | Performance | JS atual ≈ 388 KB bruto / 115,4 KB gzip; CSS 58,4 KB / 11,2 KB gzip; revisar antes de produção |
| RNF-06 | Acessibilidade | WCAG 2.1 A com revisão manual de AA: foco visível, contraste, atalho, labels, alvos ≥ 44 px, diálogo com foco |
| RNF-07 | Responsividade | 320 px a 1440 px, safe-area do iOS; sem overflow com fonte ampliada |
| RNF-08 | Compatibilidade | Chrome/Edge últimas 2 versões; Safari iOS 16.4+; Chrome Android |
| RNF-09 | Idioma | `pt-BR`, com acentuação correta em toda a UI e nas mensagens de erro |
| RNF-10 | Privacidade de dados | Sem dados reais; contato/clientId/triagem fora das respostas públicas; listagem apenas na gestão e escopada por setor |
| RNF-11 | Segurança básica | `x-powered-by` desabilitado, corpo limitado a 2 MB, CORS com credenciais restrito, senha `scrypt`, sessão `HttpOnly` e `SameSite=Lax` |
| RNF-12 | Persistência | JSON em `backend/data/estado.json` (ignorado pelo Git), configurável por `DATA_FILE` |
| RNF-13 | Qualidade de código | `oxlint` com 0 erros (3 warnings conhecidos de `set-state-in-effect`) e build sem erros |
| RNF-14 | Sessão | Cookie `HttpOnly`; “manter conectado” 30 dias, sessão curta 12 h; token persistido apenas como hash |
| RNF-15 | Triagem automática | Classificador local sem envio de dados a terceiros; flag desligada por padrão; fallback para triagem central |

## 8. Rastreabilidade

| Requisito | Tela / componente | Verificação |
|---|---|---|
| RF-01, RF-02, RF-03 | `pages/Home.jsx`, `pages/Servicos.jsx` | Manual + Playwright |
| RF-04, RF-05, RF-06, RF-07 | `pages/NovaSolicitacao.jsx`, `lib/rascunho.js`, `lib/fila.js` | Manual + Playwright offline |
| RF-08, RF-09, RF-10, RF-11 | `pages/Acompanhar.jsx`, `components/Avaliacao.jsx`, `hooks/useAtualizacoes.js` | Manual + Playwright |
| RF-12 | `pages/Gestao.jsx`, `routes/gestao.js` | Manual + API HTTP + Playwright |
| RF-13 | `pages/Perfil.jsx`, `lib/acessibilidade.js` | Manual + Playwright |
| RF-14, RF-15 | `vite.config.js`, `components/Layout.jsx`, Service Worker | DevTools + Playwright offline |
| RF-16, RF-18 | `pages/Gestao.jsx`, `routes/gestao.js`, `store.js` | Playwright + API HTTP |
| RF-17 | `pages/Gestao.jsx`, `index.css` | Playwright com mídia de impressão |
| RF-19 | `triagem.js`, `store.js`, `routes/solicitacoes.js` | Teste de integração com a flag ligada/desligada |
| RN-01..RN-23 | `backend/src/**` | Contratos conferidos por HTTP |

## 9. Pendências conhecidas (fora deste ciclo)

- Push em segundo plano e notificações com o app fechado.
- Autenticação/verificação de titularidade para consulta por protocolo (hoje o protocolo é a chave).
- Lista oficial de secretarias/setores e serviços atendidos; o mapa atual é demonstrativo.
- Integração de um modelo local/LLM real na mini IA; o contrato e o fallback por regras já existem.
- Banco de dados transacional, concorrência e migrações; o JSON atende apenas ao piloto.
- Validação de formato de contato (telefone/e-mail) no servidor.
- Paginação real, auditoria e exclusão/anonimização de dados.
- Testes automatizados unitários/E2E em CI.
- Auditoria de acessibilidade com leitor de tela (VoiceOver/TalkBack) e Lighthouse/axe.
