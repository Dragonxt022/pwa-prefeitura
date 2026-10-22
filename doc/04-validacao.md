# 04 — Relatório de validação local

| Campo | Valor |
|---|---|
| Data da execução | 22/10/2026 |
| Ambiente | Windows, Node **24.12.0**, npm **11.6.2**, Chrome (Playwright) |
| Versões | Vite **8.3.5**, vite-plugin-pwa **2.0.0**, React **19.3.1**, react-router-dom **7.18.4**, Express **5.3.0** |
| Escopo | Fases 1–4 do plano (build, PWA, API, telas, offline em desktop) |
| Resultado | **Aprovado** para os critérios abaixo; Fase 5 (iPhone físico) pendente |

## 1. Qualidade de código

| Verificação | Comando | Resultado |
|---|---|---|
| Lint | `npm run lint` | 0 erros, 0 warnings (oxlint) |
| Build | `npm run build` | Sucesso em 188–265 ms |

Saída do build:

```
dist/registerSW.js                0.13 kB
dist/manifest.webmanifest         0.67 kB
dist/index.html                   1.23 kB │ gzip: 0.57 kB
dist/assets/index-*.css          15.88 kB │ gzip: 4.15 kB
dist/assets/index-*.js          289.19 kB │ gzip: 90.63 kB

PWA v2.0.0  mode generateSW
precache  15 entries (314.59 KiB)
files generated: dist/sw.js, dist/workbox-*.js
```

Dois bugs encontrados e corrigidos durante a validação:

1. Ícones gerados com alpha invertido (cálculo errado do canto arredondado) — corrigido no gerador.
2. Alerta "Revise os campos destacados" permanecia visível depois de o usuário corrigir os campos
   (chaves `undefined` no objeto de erros) — corrigido em `NovaSolicitacao.jsx`.

## 2. PWA e Service Worker

Verificado no Chrome via Playwright em `http://localhost:4173`:

| Item | Resultado |
|---|---|
| `dist/sw.js` e `dist/workbox-*.js` | Gerados |
| `navigator.serviceWorker.getRegistration()` | Registrado, escopo `/` |
| Estado do SW | `active` (ativado e em execução) |
| Cache criado | `workbox-precache-v2-http://localhost:4173/` |
| `link[rel=manifest]` | `/manifest.webmanifest` |
| Ícones | 192, 512, maskable 512 e apple-touch-icon 180 acessíveis |
| Console | 0 erros de JS; 1 warning de meta depreciada, corrigido com `mobile-web-app-capable` |

## 3. Contratos da API

Executado contra `http://localhost:3000`:

| Método | Rota | Resultado esperado | Obtido |
|---|---|---|---|
| GET | `/api/health` | 200 | 200 |
| GET | `/api/servicos` | 200 (6 itens) | 200 |
| GET | `/api/avisos` | 200 (4 itens) | 200 |
| GET | `/api/perfil` | 200 | 200 |
| GET | `/api/solicitacoes/PREF-2026-000001` | 200 | 200 |
| GET | `/api/solicitacoes/PREF-2026-999999` | 404 | 404 |
| POST | `/api/solicitacoes` (válido) | 201 + protocolo | 201 `PREF-2026-000004` |
| POST | `/api/solicitacoes` (descrição curta) | 422 | 422 |
| POST | `/api/solicitacoes` (JSON quebrado) | 400 | 400 |
| GET | `/api/rota-inexistente` | 404 | 404 |
| POST | 9 envios adicionais | 201 | 201 |
| POST | 10º e 11º envios no mesmo minuto | 429 | 429 |

Erro 422 conferido no corpo: `{"erro":{"codigo":"validacao","mensagem":"Revise os campos destacados.","campos":{...}}}`.

## 4. Fluxos de interface

Roteiro executado com Playwright (build de produção servido por `vite preview`):

| Passo | Resultado |
|---|---|
| Home carrega avisos e 6 serviços do backend | OK |
| Atalho "Abrir solicitação" navega sem recarregar | OK |
| Serviço `/nova-solicitacao?tipo=pavimentacao` pré-seleciona o tipo | OK |
| Envio vazio mostra erros por campo e resumo com foco | OK |
| Erros desaparecem ao corrigir cada campo | OK (após correção) |
| POST válido retorna `PREF-2026-000004` e tela de confirmação | OK |
| "Acompanhar agora" consulta automaticamente e mostra histórico | OK |
| Protocolo inexistente mostra "Protocolo não encontrado" | OK |
| `PREF-2026-000004` aparece em "Consultas recentes" | OK |
| Perfil exibe dados mascarados e botão de notificação desabilitado fora do modo instalado | OK |
| 404 de rota (`/rota-que-nao-existe`) | OK |

## 5. Offline (desktop)

Procedimento: carregar `/`, colocar o contexto do navegador em offline e recarregar.

| Verificação | Resultado |
|---|---|
| App abre offline (HTML/JS/CSS do precache) | OK |
| Faixa "Você está offline" aparece | OK |
| Avisos e serviços continuam visíveis (cache `api-get-v1`) | OK |
| Formulário de nova solicitação carrega offline | OK |
| Envio offline mostra "Sem conexão" e preserva os campos digitados | OK |
| Nenhuma tela branca ou erro de JS | OK |

## 6. Evidências visuais

| Arquivo | Descrição |
|---|---|
| [home-desktop.png](evidencias/home-desktop.png) | Home em 1280 px |
| [home-mobile-carregada.png](evidencias/home-mobile-carregada.png) | Home em 390×844 |
| [home-offline.png](evidencias/home-offline.png) | Home recarregada offline com cache |
| [form-offline.png](evidencias/form-offline.png) | Tentativa de envio offline |
| [acompanhar-nao-encontrado.png](evidencias/acompanhar-nao-encontrado.png) | Protocolo inexistente |

## 7. Pendências de validação

| Item | Motivo | Fase |
|---|---|---|
| iPhone físico (Safari, instalação, `standalone`) | Exige túnel HTTPS | 5 |
| Android físico | Ambiente disponível apenas em desktop | 5 |
| Lighthouse (PWA/Performance/A11y) | Não executado neste ciclo | 6 |
| axe / leitor de tela (VoiceOver, TalkBack) | Auditoria manual pendente | 6 |
| Teste com usuários | Depende de recrutamento | 6 |
| Carga e concorrência | Store em memória | Pós-piloto |

## 8. Conclusão

O piloto técnico atende aos critérios das Fases 1–4: build limpo, PWA instalável com Service Worker
ativo, API com contratos e erros consistentes, quatro telas funcionais e comportamento offline
verificado em desktop. A recomendação é avançar para a Fase 5 (dispositivos reais) antes de qualquer
decisão de integração com a API definitiva.
