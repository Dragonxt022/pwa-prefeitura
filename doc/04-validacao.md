# 04 — Relatório de validação local

| Campo | Valor |
|---|---|
| Data da execução | 22/10/2026 |
| Ambiente | Windows, Node **24.12.0**, npm **11.6.2**, Chrome (Playwright) |
| Versões | Vite **8.3.5**, vite-plugin-pwa **2.0.0**, React **19.3.1**, react-router-dom **7.18.4**, Express **5.3.0** |
| Escopo | Fases 1–4 do plano (build, PWA, API, telas, offline em desktop) e revisão visual |
| Resultado | **Aprovado** para os critérios abaixo; instalação/standalone em dispositivo físico pendente (Fase 5) |

## 1. Qualidade de código

| Verificação | Comando | Resultado |
|---|---|---|
| Lint | `npm run lint` | 0 erros, 0 warnings (oxlint) |
| Build | `npm run build` | Sucesso (≈ 0,70 s) |

Saída do build:

```
dist/registerSW.js                0.13 kB
dist/manifest.webmanifest         0.67 kB
dist/index.html                   1.25 kB │ gzip: 0.58 kB
dist/assets/index-*.css          26.70 kB │ gzip: 6.15 kB
dist/assets/index-*.js          312.50 kB │ gzip: 97.43 kB

PWA v2.0.0  mode generateSW
precache  17 entries (450.26 KiB)
files generated: dist/sw.js, dist/workbox-*.js
```

O bundle cresceu cerca de 7 kB (gzip) em relação à versão anterior por causa do conjunto de ícones
Lucide e das ilustrações SVG inline, que continuam funcionando offline. Os logos oficiais também são
servidos como assets locais e entram no precache.

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
| Cache criado | `workbox-precache-v2-http://localhost:4173/` e `api-get-v1` |
| `link[rel=manifest]` | `/manifest.webmanifest` |
| Ícones | 192, 512, maskable 512, apple-touch-icon 180 e favicon 32 acessíveis (marca oficial) |
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
| Home carrega 4 avisos e 6 serviços em cartões com ícones | OK |
| Busca da Home filtra serviços por título, descrição e categoria | OK |
| Botão "Nova solicitação" navega sem recarregar | OK |
| Serviço `/nova-solicitacao?tipo=pavimentacao` pré-seleciona o tipo | OK |
| Envio vazio mostra erros por campo e resumo com foco | OK |
| Erros desaparecem ao corrigir cada campo | OK (após correção) |
| POST válido retorna `PREF-2026-000004` e tela de confirmação | OK |
| Botão "Acompanhar" consulta automaticamente e mostra histórico | OK |
| Protocolo inexistente mostra "Protocolo não encontrado" | OK |
| `PREF-2026-000004` aparece em "Consultas recentes" | OK |
| Perfil exibe dados mascarados e orienta a instalação para ativar notificações | OK |
| 404 de rota (`/rota-que-nao-existe`) | OK |

## 5. Offline (desktop)

Procedimento: carregar `/`, colocar o contexto do navegador em offline e recarregar.

| Verificação | Resultado |
|---|---|
| App abre offline (HTML/JS/CSS do precache) | OK |
| Faixa "Sem conexão — usando dados salvos." aparece | OK |
| Avisos e serviços continuam visíveis (cache `api-get-v1`) | OK |
| Formulário de nova solicitação carrega offline | OK |
| Envio offline mostra "Sem conexão" e preserva os campos digitados | OK |
| Nenhuma tela branca ou erro de JS | OK |

## 6. Rede local (LAN)

Exposição via `.\iniciar-dev.cmd` (Vite com `--host`) para teste no celular, sem túnel.

| Verificação | Resultado |
|---|---|
| Vite escutando em todas as interfaces (`::`) na porta 5173 | OK |
| `http://192.168.0.68:5173` a partir do PC | 200 |
| `http://192.168.0.68:5173/api/health` via proxy | `ok` |
| Regras de firewall TCP 5173/4173/3000 (`LocalSubnet`, Private+Public) | criadas em 22/10 |
| Acesso a partir do celular | OK — fluxo de telas e API validado pelo usuário via `http://192.168.0.68:5173` |

> Em `http://` na LAN o Service Worker não registra (contexto não seguro). O teste cobre telas e API;
> offline e instalação exigem HTTPS local (`mkcert`) — F5-5.

## 7. Evidências visuais

As capturas refletem o redesign minimalista aplicado em 22/10/2026 (marca oficial, ícones Lucide e
ilustrações SVG inline).

| Arquivo | Descrição |
|---|---|
| [home-desktop.png](evidencias/home-desktop.png) | Home minimalista em 1280 px |
| [home-mobile-carregada.png](evidencias/home-mobile-carregada.png) | Home em 390×844 (página completa) |
| [home-dark.png](evidencias/home-dark.png) | Home no tema escuro |
| [nova-solicitacao.png](evidencias/nova-solicitacao.png) | Seleção de serviço por cartões de ícone |
| [confirmacao.png](evidencias/confirmacao.png) | Confirmação com protocolo e botão de cópia |
| [acompanhar.png](evidencias/acompanhar.png) | Protocolo com status, dados e histórico |
| [acompanhar-nao-encontrado.png](evidencias/acompanhar-nao-encontrado.png) | Protocolo inexistente em 390×844 |
| [perfil.png](evidencias/perfil.png) | Perfil, notificações e privacidade |
| [404.png](evidencias/404.png) | Rota inexistente |
| [home-offline.png](evidencias/home-offline.png) | Home recarregada offline com cache |
| [form-offline.png](evidencias/form-offline.png) | Tentativa de envio offline |

## 8. Pendências de validação

| Item | Motivo | Fase |
|---|---|---|
| iPhone físico (Safari, instalação, `standalone`) | Exige HTTPS local (`mkcert`) para SW/offline; acesso HTTP na LAN já habilitado | 5 |
| Android físico (instalação/standalone) | Fluxo via LAN validado pelo usuário; falta validar instalação, SW e offline em HTTPS local | 5 |
| Lighthouse (PWA/Performance/A11y) | Não executado neste ciclo | 6 |
| axe / leitor de tela (VoiceOver, TalkBack) | Auditoria manual pendente | 6 |
| Teste com usuários | Depende de recrutamento | 6 |
| Carga e concorrência | Store em memória | Pós-piloto |

## 9. Conclusão

O piloto técnico atende aos critérios das Fases 1–4: build limpo, PWA instalável com Service Worker
ativo, API com contratos e erros consistentes, quatro telas funcionais — agora com interface
minimalista orientada a ícones e ilustrações — e comportamento offline verificado em desktop. A
recomendação é avançar para a Fase 5 (dispositivos reais) antes de qualquer decisão de integração com
a API definitiva.
