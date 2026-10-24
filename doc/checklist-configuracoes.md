# Checklist — Configurações, i18n e erros centralizados

Atualizado em: 24/10/2026

Status geral: **concluído no escopo local**; integrações externas de SMTP e IA permanecem
bloqueadas por falta de credenciais/endpoints reais.

Legenda:

- `[x]` concluído e verificado
- `[ ]` pendente
- `[!]` bloqueado por dependência externa

## 1. Base e decisões

- [x] Configurações administrativas persistidas no JSON local (versão 3).
- [x] Seções `identidade`, `email`, `ia` e histórico de notificações.
- [x] Senha SMTP e chave de IA write-only na API; retornam somente `temSenha`/`temApiKey`.
- [x] `TRIAGEM_IA_ATIVA` usada apenas como semente da configuração; a decisão efetiva fica no JSON.
- [x] Fallback para regras locais quando o modelo externo falha.
- [x] Tradução preparada com apenas `pt-BR` ativo.
- [x] Catálogo compartilhado de erros com códigos estáveis em `shared/codigos-erro.js`.
- [x] Frontend e backend importam o mesmo catálogo de erros.

## 2. Backend

- [x] Modelo, defaults, validação, sanitização e opções das configurações.
- [x] Persistência e migração para a versão 3 do estado.
- [x] Rota pública `GET /api/configuracoes` somente com identidade sanitizada.
- [x] Rotas administrativas `GET /api/gestao/configuracoes` e `PUT /api/gestao/configuracoes/:secao`.
- [x] Validação de identidade: nome, imagens, cores, contatos, redes e rodapé.
- [x] Validação de SMTP, remetente, destinatários e eventos.
- [x] Validação de provedor, endpoint, modelo, chave, temperatura e timeout.
- [x] Teste de envio de e-mail sem exigir SMTP real.
- [x] Teste de qualidade da IA com os dados do formulário.
- [x] Log das últimas 30 notificações com código de erro.
- [x] `node --check` em todos os arquivos backend alterados.
- [x] Teste automatizado do backend de configuração: **23 verificações aprovadas**.

## 3. E-mail e notificações

- [x] Nodemailer instalado e transporte criado sob demanda.
- [x] Matriz de eventos independentes.
- [x] Eventos de nova solicitação, status, transferência, conclusão e avaliação.
- [x] Histórico de tentativas de envio.
- [x] Falha de e-mail não bloqueia a triagem nem a atualização da solicitação.
- [x] Teste de envio sem SMTP retorna `smtp_nao_configurado` na interface.
- [x] Senha SMTP foi salva em teste, permaneceu fora do payload e não voltou ao campo após reload.
- [x] Destinatários e eventos permanecem preenchidos após salvar e recarregar.
- [!] Teste com SMTP real e credenciais de produção.
- [x] Códigos `smtp_nao_configurado`, `smtp_destinatario_invalido` e `smtp_falhou`.

## 4. Inteligência artificial

- [x] Adaptadores Ollama, OpenAI, Claude, DeepSeek, modelo local/VPS e regras.
- [x] Timeout por requisição.
- [x] Validação de setor, confiança e JSON de resposta.
- [x] Teste funcional com amostra conhecida.
- [x] Fallback para regras locais na triagem automática.
- [x] Teste externo sem chave retorna `ia_sem_chave` com mensagem amigável.
- [x] Chave de IA foi salva em teste, permaneceu fora do payload e não voltou ao campo após reload.
- [x] Ao restaurar o provedor “Regras locais”, a chave de teste foi removida.
- [x] Códigos `ia_sem_chave`, `ia_url_invalida`, `ia_modelo_ausente`, `ia_timeout`, `ia_json_invalido`, entre outros.
- [!] Teste com chaves e endpoints reais de cada provedor.
- [x] Teste local do fluxo de regras aprovado (Meio Ambiente, 95% de confiança).

## 5. Identidade visual e i18n

- [x] Provider público de configurações.
- [x] Nome, logo, favicon, cores, contatos, redes e rodapé dinâmicos.
- [x] Favicon padrão mantido quando não há ícone personalizado (sem 404 no console).
- [x] Variáveis `{{nome}}`, `{{anoAtual}}`, `{{anoCriacao}}`, `{{anos}}` e `{{direitos}}`.
- [x] Arquivo `frontend/src/i18n/pt-BR.js`.
- [x] Provider próprio de i18n integrado ao `main.jsx`.
- [x] Apenas `pt-BR` habilitado.
- [x] Identidade pública validada no cabeçalho, título do documento e rodapé.
- [ ] Migrar gradualmente os textos legados das demais telas para o dicionário.
- [ ] Preparar `en`, `es`, `it` e `pt-PT` em uma entrega futura.

## 6. Erros centralizados

- [x] Criar `shared/codigos-erro.js` como fonte única de códigos, status e mensagens padrão.
- [x] Integrar o catálogo ao `AppError`, ao middleware de erro e ao rate limit.
- [x] Usar códigos nos adaptadores de IA.
- [x] Usar códigos nos testes e registros de e-mail.
- [x] Integrar códigos ao `ApiError` do frontend.
- [x] Atualizar o `ErrorState` para usar título e mensagem do catálogo.
- [x] Configurar o Vite para importar o catálogo compartilhado.
- [x] Exibir código técnico nas falhas do painel de configurações.
- [ ] Migrar os tratamentos pontuais restantes para `CODIGOS_ERRO`.
- [ ] Adicionar teste de consistência do catálogo.

## 7. Tela administrativa de configurações

- [x] Componentes compartilhados de campos, switches e listas.
- [x] Cliente da API para leitura, salvamento e testes.
- [x] Preparação e compressão de logo/ícone antes do envio.
- [x] Formulário de identidade visual.
- [x] Formulário de e-mail e notificações.
- [x] Formulário de inteligência artificial.
- [x] Página protegida `/gestao/configuracoes` com menu lateral/abas.
- [x] Link “Configurações” no cabeçalho da gestão.
- [x] Estados de carregamento, erro, sucesso e acesso negado.
- [x] Estilos responsivos e revisão de acessibilidade.
- [x] Formulários reinicializados por chave após salvar, sem efeito de sincronização.
- [x] Mensagem duplicada de destinatários vazios removida.
- [x] Cabeçalho da seção corrigido para “Remetente e destinatários”.
- [x] Ajuda do provedor de regras corrigida nos campos de modelo e chave.
- [x] Barra de salvar deixou de sobrepor conteúdo.

## 8. Validação da entrega

- [x] Salvar as três abas e recarregar a página.
- [x] Confirmar aplicação pública da identidade.
- [x] Confirmar que segredos não retornam ao navegador.
- [x] Testar IA local e falha externa sem chave.
- [x] Testar falha de e-mail sem quebrar a triagem.
- [x] Rodar build do frontend.
- [x] Rodar lint.
- [x] Rodar regressão v4 (**32 verificações**) e regressão de IA (**12 verificações**).
- [x] Validar no navegador em desktop (1440 px), tablet (768 px) e mobile (390 px).
- [x] Validar navegação por teclado entre as abas.
- [x] Atualizar README, requisitos, plano e validação.
- [x] Registrar evidências em `doc/evidencias/v5/`.
- [x] Restaurar a identidade demo após os testes.
- [x] Criar commit da entrega.

### Resultados técnicos

| Verificação | Resultado |
|---|---|
| `node --check` (backend) | Sem erros |
| `npm run build` | Sucesso; JS 451,66 kB (131,58 kB gzip), CSS 75,78 kB (13,93 kB gzip) |
| `npm run lint` | 0 erros; 9 avisos conhecidos (`set-state-in-effect` e `only-export-components`) |
| `test-config-api.mjs` | 23/23 |
| `test-v4.mjs` | 32/32 |
| `test-v4-ia.mjs` | 12/12 |
| Identidade em 390 px | `scrollWidth 375`, sem overflow horizontal |
| Abas em 768 px | Três colunas, sem overflow |
| Teclado | `ArrowDown` move foco, seleção e painel para a próxima aba |

### Evidências

- [config-identidade.png](evidencias/v5/config-identidade.png) — identidade visual em desktop.
- [config-email.png](evidencias/v5/config-email.png) — servidor SMTP, remetente e destinatários.
- [config-ia.png](evidencias/v5/config-ia.png) — provedor de regras e campos desabilitados corretamente.
- [config-mobile.png](evidencias/v5/config-mobile.png) — identidade em 390 px com abas roláveis.

## 9. Pendências externas

- [!] Lista oficial de secretarias, setores e serviços.
- [!] Credenciais SMTP reais.
- [!] Chaves e endpoints reais de IA.
- [!] Definição da identidade do cidadão para autenticação futura.
- [!] Recomendação para produção: mover segredos do JSON local para um cofre.
