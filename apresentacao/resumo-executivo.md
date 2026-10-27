# Prefeitura Digital — Resumo executivo

**Documento de apoio à apresentação institucional**  
**Público:** Gabinete do Prefeito, Secretarias e Câmara Municipal  
**Data:** outubro de 2026  
**Natureza:** piloto funcional com dados fictícios. Não é ambiente de produção.

> **Em uma frase:** a Prefeitura Digital já existe como piloto funcional. O próximo passo não é começar de novo: é provar, medir e decidir com evidências, em 90 dias, com duas secretarias e dados reais controlados.

---

## 1. A decisão que se pede

Não se solicita, neste momento, um contrato de longo prazo nem a implantação em toda a administração. Solicita-se autorização para:

1. **Realizar um piloto assistido de 90 dias**, com duas secretarias, dados reais controlados e metas acordadas com a governança.
2. **Criar um grupo de governança**, com Gabinete, TI, Jurídico/LGPD, Comunicação e secretarias, reunido a cada quinze dias.
3. **Autorizar o detalhamento do plano de produção**, incluindo infraestrutura, integrações, treinamento e sustentação, com orçamento apresentado após essa definição.

As metas do piloto são objetivas: **70% de adoção, 85% dos pedidos no prazo, 90% de satisfação e zero incidente crítico**. Ao final, a governança decide, com dados, se avança, ajusta ou encerra.

---

## 2. O problema

A demanda do cidadão chega por telefone, e-mail, WhatsApp e balcão. Cada canal produz um registro diferente. Nenhum deles garante, por si só, protocolo, prazo, responsável e histórico.

O resultado é conhecido:

- o cidadão não sabe se o pedido existe, quem é o responsável ou quando será atendido;
- a equipe recebe a mesma demanda por vários caminhos e não consegue agrupar, priorizar ou medir reincidência;
- a gestão não enxerga a fila inteira, os prazos e os gargalos em tempo real;
- o relatório é montado à mão, e a prestação de contas depende de esforço individual.

Não é falta de trabalho dos servidores. É falta de um lugar único onde a informação possa ser acompanhada, cobrada e comprovada.

---

## 3. A solução

A Prefeitura Digital organiza todo o caminho da solicitação: **cidadão, protocolo, triagem, setor, conclusão e avaliação**. O que muda é a porta de entrada, não a regra.

| Para o cidadão | Para a gestão | Para a cidade |
|---|---|---|
| App leve, sem login obrigatório, protocolo na hora, acompanhamento 24 h e avaliação. | Fila por setor, prioridade, SLA, transferência com motivo e impressão. | Canal único, indicadores em tempo real e menos deslocamento. |
| Funciona offline, com rascunho e reenvio automático. | Escopo aplicado no servidor: cada setor vê o que é seu. | Base única para app, painel e auditoria. |

O cidadão não precisa entender de tecnologia. Precisa saber três coisas: **o pedido existe, quem é o responsável e quando será atendido**. É isso que a plataforma entrega.

A escolha por PWA reduz custo e acelera atualização: uma base de código, instalação direta, funcionamento no navegador e como aplicativo, sem depender de loja de aplicativos. A experiência é mobile-first de 320 a 1440 pixels, com offline, fonte ampliada, alto contraste, navegação por teclado, linguagem simples e nenhum login obrigatório. A meta de três minutos para receber o protocolo é uma meta de experiência do piloto, a ser validada com usuários reais na produção. Não é uma promessa de resultado.

---

## 4. O que já funciona e o que falta para produção

É fundamental separar o que está pronto do que ainda precisa ser feito. Nesta fase, o piloto **não deve operar com dados pessoais reais**.

| Dimensão | Já no piloto | Requisito para produção |
|---|---|---|
| Serviços e protocolo | 9 serviços, catálogo com busca, protocolo imutável e código com hash. | Catálogo validado pelas secretarias e numeração oficial. |
| App e painel | Home, solicitação, foto, CEP, mapa, acompanhamento; login, fila, transferência e impressão. | Publicação assistida, perfis definitivos e treinamento. |
| Offline e acessibilidade | Rascunho, fila, reenvio; fonte ampliada, contraste, teclado e foco visível. | Monitoramento, conflitos em escala e auditoria WCAG 2.1 AA. |
| Segurança e LGPD | Hash SHA-256, HttpOnly, scrypt, rate limit, CORS; minimização e separação público/interno. | HTTPS, cookie Secure, banco transacional, DPIA, DPO, base legal e retenção. |
| Infraestrutura e integrações | API única e ambiente local de demonstração. | Hospedagem, backup, operação 24×7, gov.br e sistemas de OS. |
| Sustentação | Código aberto, testes automatizados e CI. | Propriedade do código e dos dados, suporte e continuidade. |

**O que o piloto prova:** o fluxo completo funciona, com dados fictícios, e pode ser demonstrado de ponta a ponta.  
**O que o piloto não prova:** operação com dados reais, escala, integrações e conformidade definitiva. Essa é exatamente a etapa seguinte.

---

## 5. Impacto esperado

Os números abaixo são **estimativas de planejamento**, não promessas de resultado. O cenário de referência é um município de 100 mil habitantes, com 1.800 solicitações por mês, adoção de 25% no mês 1 e 70% no mês 12, 15 minutos economizados por solicitação migrada e custo-hora de R$ 42.

| Premissa | Valor |
|---|---|
| População e demanda | 100 mil habitantes; 1.800 solicitações/mês (21.600/ano) |
| Adoção | 25% no mês 1 → 70% no mês 12 |
| Tempo e custo | 15 min por pedido; R$ 42/hora carregado |
| Deslocamentos | 30% dos pedidos geram deslocamento; 75% evitáveis |
| Prazo | 62% dos pedidos no prazo; meta de 85% |

### 5.1 Capacidade operacional liberada

| Cenário | Premissas | Horas/ano | Valor/ano |
|---|---|---|---|
| Conservador | 1.200 pedidos/mês, 55% de adoção, 12 min | 1.584 h | R$ 67 mil |
| **Base** | **1.800 pedidos/mês, 70% de adoção, 15 min** | **3.780 h** | **R$ 159 mil** |
| Otimista | 2.400 pedidos/mês, 80% de adoção, 18 min | 6.912 h | R$ 332 mil |

O cenário otimista usa custo-hora de R$ 48; os demais usam R$ 42. Os valores representam **capacidade operacional liberada**, não corte de despesa nem demissão.

No cenário base, o primeiro ano acumula **11.376 pedidos digitais**, **2.844 horas liberadas** e **315 horas por mês no mês 12**. Em regime, são **3.780 horas por ano**, o equivalente a **2,1 servidores** — capacidade para realocar a equipe em vistoria, fiscalização, atendimento prioritário e decisão. **Nenhum posto de trabalho precisa ser eliminado.**

### 5.2 Benefício para a população

| Indicador | Primeiro ano | Em regime (ano) |
|---|---|---|
| Atendimentos adicionais no prazo | +2.754 | +4.968 |
| Deslocamentos presenciais evitados | 2.560 | 3.402 |
| Horas devolvidas ao cidadão | 5.119 h | 6.804 h |
| Economia estimada para as famílias | R$ 40,9 mil | R$ 54,4 mil |

A leitura é simples: menos ida ao prédio público, mais pedidos concluídos no prazo e mais tempo para a família. O benefício não fica no painel; ele aparece na rua.

### 5.3 Como os números são calculados

Pedidos digitais = demanda mensal × adoção. Horas liberadas = pedidos digitais × minutos economizados ÷ 60. Equivalente em servidores = horas anuais ÷ 1.760. Atendimentos adicionais no prazo = demanda × (meta − linha de base). Deslocamentos evitados = pedidos digitais × 30% × 75%. Benefício ao cidadão = deslocamentos × 2 h × R$ 16.

As premissas podem e devem ser recalibradas com os dados reais do município, antes de qualquer compromisso de meta.

---

## 6. Segurança, privacidade e auditoria

A confiança não se promete: projeta-se. O piloto já aplica controles em camadas:

- **Canal e identidade:** CORS restrito, limite de corpo, validação de entrada e erros sem vazamento de stack; sessão em cookie HttpOnly; código gerado no aparelho e nunca enviado na URL.
- **Autorização e dado:** papéis de admin, triagem e setor com escopo aplicado no servidor; hash SHA-256 do código; senhas com scrypt e sal; respostas públicas sanitizadas.
- **Operação e auditoria:** rate limit por IP; cada mudança de status, transferência ou avaliação registra data, hora, responsável e observação.
- **Produção:** HTTPS, cookie Secure, banco transacional, backup testado, auditoria centralizada, DPIA, DPO, base legal, retenção definida e direitos do titular.

A auditoria não protege apenas o gestor. Protege o servidor que fez o trabalho certo e o cidadão que precisa de resposta.

---

## 7. Governança e riscos

Um projeto público não falha apenas por tecnologia. Falha por falta de dono, de integração, de treinamento ou de clareza sobre dados.

| Risco | Decisão necessária | Dono | Critério de saída |
|---|---|---|---|
| Dados reais e LGPD | Definir base legal, DPIA, DPO, retenção e direitos do titular. | Gabinete, Jurídico e TI | DPIA aprovada e base legal definida. |
| Exclusão digital | Manter canais presenciais e telefônicos; treinar a rede de atendimento. | Secretarias e Comunicação | Canais alternativos mapeados e equipe treinada. |
| Integração com legados | Mapear OS, protocolo e cadastro; começar por duas integrações críticas. | TI | Duas integrações críticas em produção assistida. |
| Adoção interna | Nomear gestores de fila por setor e acordar metas por secretaria. | Secretarias | Gestores nomeados e metas por secretaria. |
| Sustentação e propriedade | Definir hospedagem, suporte, código e dados; evitar dependência de fornecedor. | TI e Compras | Hospedagem, suporte e código documentados. |

A governança opera com **reuniões quinzenais**, **relatório mensal** de adoção, SLA, satisfação, retrabalho e desvios, **escalonamento em 48 horas** para impedimentos críticos e **go/no-go em 90 dias**. Não é uma reunião a mais: é o mecanismo que mantém o projeto com dono, ritmo e prestação de contas.

---

## 8. Do piloto à operação, em três etapas

| Etapa | Horizonte | Escopo | Critério de saída |
|---|---|---|---|
| Piloto funcional | **Concluído** | 9 serviços, app, painel, offline, acessibilidade, segurança, testes e CI. | Fluxo demonstrável com testes verdes e trilha de auditoria. |
| Produção assistida | **0 a 90 dias** | 2 secretarias, dados reais controlados, HTTPS, banco transacional, LGPD, gov.br e integração com OS. | 90 dias com metas medidas, auditoria aprovada e go/no-go formal. |
| Expansão | **90 a 365 dias** | Toda a administração, push, BI, integração com 156, WhatsApp e IA de triagem supervisionada. | Ganho comprovado, operação estável e escala aprovada pela governança. |

Nenhuma etapa avança sem critérios de aceite, auditoria e aprovação da governança. O roadmap é indicativo e os prazos serão confirmados com as áreas.

---

## 9. Próximos 90 dias

Nas **semanas 1–2**, governança, DPIA e infraestrutura. Nas **semanas 3–4**, integração, treinamento e comunicação. Nas **semanas 5–8**, operação assistida com duas secretarias. Nas **semanas 9–12**, medição, auditoria e relatório go/no-go.

**Indicadores de sucesso:** 70% de adoção, 85% dos pedidos no prazo, 90% de satisfação e zero incidente crítico.

---

## 10. O que não se está pedindo

- Não é um contrato de longo prazo, nem a substituição do atendimento presencial, do 156 ou do WhatsApp.
- Não há economia garantida, eliminação de postos de trabalho ou uso de dados reais antes das condições de LGPD e infraestrutura.
- O que se pede é **autorização para provar, medir e decidir com dados**. A decisão de hoje é sobre o próximo passo, não sobre o tamanho final do projeto.

**Sobre custos:** o piloto usa stack aberta, sem dependência paga. O custo de produção será detalhado após a definição de infraestrutura, integrações, treinamento e suporte. Não é responsável apresentar um número fechado antes dessas definições. O próximo passo tem escopo controlado: 90 dias, duas secretarias e governança formal.

---

## 11. Referências

Documentos do projeto: `doc/01-projeto-inicial.md`, `doc/02-requisitos.md`, `doc/03-plano-execucao.md` e `doc/04-validacao.md`. Também fundamentam este resumo a Lei nº 13.709/2018 (LGPD), a WCAG 2.1 (W3C) e as boas práticas de governo digital e acessibilidade do gov.br.

**Nota final:** este resumo é um documento de apoio. Os valores são estimativas de planejamento e devem ser recalibrados com a Secretaria de Administração, o protocolo e a TI antes de qualquer compromisso público.
