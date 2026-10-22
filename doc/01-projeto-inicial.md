# 01 — Projeto inicial (visão e escopo do piloto)

| Campo | Valor |
|---|---|
| Projeto | Prefeitura Digital — piloto de atendimento ao cidadão |
| Versão | 2.0 |
| Data | 22/10/2026 |
| Status | Escopo aprovado para piloto técnico |
| Responsável | Produto (PO) |
| Documentos relacionados | [02-requisitos.md](02-requisitos.md) · [03-plano-execucao.md](03-plano-execucao.md) · [04-validacao.md](04-validacao.md) · [ADRs](adr/) |
| Histórico | Plano original preservado em [historico/plano-inicial-2026-10-22.md](historico/plano-inicial-2026-10-22.md) |

> Este documento substitui o roteiro inicial (que era um passo a passo técnico). O passo a passo virou
> [README](../README.md) e [03-plano-execucao.md](03-plano-execucao.md); requisitos e contratos estão em
> [02-requisitos.md](02-requisitos.md).
>
> **Atualização de 22/10/2026:** o escopo foi ampliado no piloto v3. Itens que aparecem como “fora do
> escopo” abaixo (painel de gestão, foto, localização, SLA e catálogo maior) foram implementados como
> demonstração; consulte [02-requisitos.md](02-requisitos.md) e [04-validacao.md](04-validacao.md) para o
> estado atual. A lista original permanece para registrar o recorte inicial.

## 1. Contexto e problema

O cidadão que precisa de um serviço municipal (iluminação, pavimentação, limpeza, poda, fiscalização)
hoje depende de telefone, e-mail ou atendimento presencial. Isso gera três problemas recorrentes:

1. **Sem confirmação**: o cidadão não recebe um número de protocolo nem sabe em que etapa o pedido está.
2. **Retrabalho interno**: relatos chegam incompletos (sem ponto de referência), exigindo contato de volta.
3. **Baixa adesão digital**: portais web tradicionais são lentos no celular, exigem login e não funcionam
   quando a conexão é instável — exatamente a realidade de boa parte dos bairros periféricos.

## 2. Objetivo do piloto

Validar, com dados simulados e um público restrito, se um **PWA instalável, offline-first e acessível**
reduz o esforço do cidadão para abrir e acompanhar uma solicitação, sem aumentar o retrabalho da equipe.

**Objetivo mensurável:** em um teste moderado com 10 a 15 participantes, pelo menos **70%** concluem o
fluxo "abrir solicitação → copiar protocolo → consultar status" sem ajuda, em **menos de 3 minutos**,
e pelo menos **80%** classificam a tarefa como "fácil" ou "muito fácil".

## 3. Público-alvo e cenários

| Persona | Cenário principal | Necessidade crítica |
|---|---|---|
| Cidadão com smartphone Android intermediário | Abre solicitação na rua, conexão 3G instável | Formulário curto, tolerância a falha de rede |
| Cidadão iPhone | Instala o app pela Tela de Início | Funcionar como app, sem depender de push no piloto |
| Cidadão com baixa familiaridade digital | Precisa acompanhar o protocolo depois | Linguagem simples, protocolo fácil de guardar |
| Servidor de atendimento (fora do piloto) | Receberia a demanda | Dados completos e rastreáveis (backlog) |

## 4. Escopo

### Dentro do escopo (piloto)

- Home com avisos da cidade e catálogo de serviços.
- Nova solicitação com tipo, descrição, endereço e contato opcional.
- Geração de protocolo legível (`PREF-AAAA-000000`) e tela de confirmação com cópia.
- Acompanhamento por protocolo, com status e linha do tempo do histórico.
- Perfil fictício, preferência de notificação e limpeza de dados locais.
- PWA instalável: manifest completo, ícones (inclusive maskable) e apple-touch-icon.
- Funcionamento offline das telas já visitadas e dos últimos dados de API em cache.
- API mockada em memória, com validação, erros padronizados e limite de taxa.
- Acessibilidade de base: navegação por teclado, foco visível, rótulos, contraste, áreas de toque ≥ 44px.

### Fora do escopo (explicitamente)

- Autenticação real (gov.br) e autorização por perfil.
- Persistência em banco de dados, integração com sistemas da prefeitura e abertura de OS interna.
- Envio real de push (não há backend de notificações/VAPID neste piloto).
- Painel administrativo para servidores.
- Anexos/fotos, geolocalização, mapa e geocodificação de endereço.
- Multi-tenant (várias secretarias), relatórios e SLA formal.
- Publicação em produção, domínio oficial e processo de LGPD completo (DPIA, encarregado, retenção).

## 5. Hipóteses a validar

| # | Hipótese | Como validar |
|---|---|---|
| H1 | O cidadão entende a diferença entre os 6 tipos de serviço sem treinamento | Teste moderado + observação |
| H2 | Guardar o protocolo em formato legível (não apenas UUID) aumenta a taxa de consulta posterior | Comparar consultas pós-teste |
| H3 | O modo offline evita abandono em conexão instável | Teste com rede limitada (DevTools: throttling/offline) |
| H4 | Instalar o PWA no iOS é obstáculo real para notificações | Entrevista pós-teste com usuários iPhone |

## 6. Métricas de sucesso

| Métrica | Meta | Instrumentação |
|---|---|---|
| Conclusão do fluxo sem ajuda | ≥ 70% | Observação no teste moderado |
| Tempo médio até obter protocolo | ≤ 3 min | Cronômetro no teste |
| Falha de envio por erro de validação | ≤ 15% das tentativas | Log de eventos (fase 2) |
| Telas carregando offline | 100% das telas visitadas | Checklist de validação |
| Problemas críticos de acessibilidade (WCAG A) | 0 | Auditoria manual + axe |

> No piloto técnico atual medimos apenas as duas últimas (ver [04-validacao.md](04-validacao.md)).
> As métricas de usuário dependem da Fase 6 do plano.

## 7. Premissas e restrições

- **Premissa**: o piloto roda em ambiente controlado, com dados fictícios e sem cidadão real.
- **Premissa**: a API definitiva seguirá o mesmo contrato de campos e códigos de erro descritos em 02.
- **Restrição**: Node 20.19+ (Vite 8 e vite-plugin-pwa 2 exigem; recomendado Node 22 LTS ou superior).
- **Restrição**: Service Worker só funciona em HTTPS ou `localhost`. Em `http://IP-da-rede` (LAN) o SW
  não registra: o teste no celular cobre telas e API, mas offline/instalação exigem HTTPS local
  (`mkcert`) — ver plano, Fase 5.
- **Restrição**: push no iOS exige iOS 16.4+, app instalado na Tela de Início e permissão pedida por gesto.
- **Restrição orçamentária**: nenhuma dependência paga; tudo roda local.

## 8. Riscos

| Risco | Prob. | Impacto | Mitigação | Dono |
|---|---|---|---|---|
| Mocks virarem "produto" sem persistência | Média | Alto | ADR 0003 + critério de saída exige plano de dados real | PO |
| Teste apenas em desktop mascarar falhas mobile | Alta | Alto | Fase 5 obrigatória em iOS e Android reais | QA |
| Cache do Service Worker servir dado desatualizado | Média | Médio | `NetworkFirst` com timeout de 3s + versão de cache | Dev front |
| Vazamento de dado pessoal em ambiente de demo | Baixa | Alto | Dados fictícios, aviso na UI, proibição de dado real | PO |
| Inacessibilidade excluir parte do público | Média | Alto | Checklist de acessibilidade na Definition of Done | UX |
| Complexidade do iOS (instalação/push) frustrar o piloto | Alta | Médio | Escopo de push adiado; texto explicativo na tela de Perfil | PO |
| Dependência de versões muito novas (Vite 8 / React 19) | Baixa | Médio | Versões fixadas no `package.json`; ADR 0001 | Dev front |

## 9. Critérios de encerramento do piloto

O piloto é considerado concluído quando:

1. Os 4 fluxos principais funcionam em desktop e em pelo menos um iOS e um Android reais.
2. O teste offline reproduzível está documentado com evidências.
3. Não há issues abertas de severidade alta ou crítica.
4. O relatório de validação aponta decisão explícita: **go** (integrar API real) ou **no-go** (revisar escopo).
5. Os dados fictícios e o ambiente local são descartados ou migrados com plano de LGPD aprovado.

## 10. Governança e LGPD (resumo)

- Nenhum dado pessoal real é coletado neste piloto; a UI avisa isso em todas as telas (rodapé).
- O contato é **opcional** e usado apenas para retorno sobre a solicitação (minimização).
- O dispositivo guarda somente os últimos protocolos e a preferência de notificação, apagáveis em Perfil.
- Antes de qualquer uso real: definir base legal, prazo de retenção, encarregado (DPO), DPIA e contrato
  com a área de TI. Esse trabalho **não** está coberto por este documento.
