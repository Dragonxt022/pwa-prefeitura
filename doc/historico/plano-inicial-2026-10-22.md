Vamos montar um plano de execução local para o projeto piloto, usando **React + Vite + vite-plugin-pwa** no frontend e **Express** no backend, com todas as telas contendo simulações de dados para você validar o fluxo antes de integrar com APIs reais.

### 🛠️ Passo a passo: montando o ambiente local

**1. Pré-requisitos (Windows)**
- Instale o **Node.js** (versão 18 ou superior). O Vite e o vite-plugin-pwa exigem Node 16+, mas usar uma versão LTS atual evita problemas .
- Abra o PowerShell ou o Prompt de Comando.

**2. Crie a pasta do projeto e o frontend**
```powershell
mkdir prefeitura-piloto
cd prefeitura-piloto
npm create vite@latest frontend -- --template react
cd frontend
npm install
```
Isso cria a estrutura React com Vite. O servidor de desenvolvimento roda em `http://localhost:5173` .

**3. Instale o vite-plugin-pwa**
```powershell
npm i vite-plugin-pwa -D
```
A versão atual (1.x) já traz suporte offline via Workbox integrado .

**4. Crie o backend Express (pasta separada)**
Em outro terminal, dentro de `prefeitura-piloto`:
```powershell
mkdir backend
cd backend
npm init -y
npm install express cors
```
Crie um `server.js` básico com rotas simuladas (ex.: `/api/solicitacoes` retornando um array fixo). O Express serve para você simular a API que depois será consumida pelo frontend .

**5. Configure o proxy no Vite (para o frontend chamar o backend local)**
No `vite.config.js` do frontend, adicione:
```js
server: {
  proxy: {
    '/api': 'http://localhost:3000'
  }
}
```
Assim, durante o desenvolvimento, chamadas para `/api/...` são redirecionadas ao Express sem problemas de CORS.

### 📋 Checklist de afazeres até o piloto concluído

**Fase 1 — Estrutura e PWA**
- [ ] Criar projeto React com Vite (`npm create vite`)
- [ ] Instalar `vite-plugin-pwa` e configurar `VitePWA()` no `vite.config.js` 
- [ ] Definir `manifest` no plugin: nome do app, ícones (mínimo 192x192 e 512x512), `theme_color`, `display: 'standalone'`
- [ ] Rodar `npm run build` e depois `npm run preview` para testar o PWA localmente (o modo `dev` **não** ativa o Service Worker) 
- [ ] Verificar no Chrome DevTools (Application → Service Workers) se o SW está registrado

**Fase 2 — Backend simulado**
- [ ] Criar `server.js` com Express e `cors` liberado para `localhost:5173`
- [ ] Criar rotas GET/POST simuladas com dados fixos em memória (ex.: lista de notícias, protocolos de solicitação)
- [ ] Testar as rotas com o navegador ou Postman (`http://localhost:3000/api/...`)

**Fase 3 — Telas frontend (com simulações)**
- [ ] **Tela Home**: listagem de serviços e avisos (dados vindos do backend simulado)
- [ ] **Tela Nova Solicitação**: formulário com campos (tipo de problema, descrição, endereço) que envia POST para o backend simulado
- [ ] **Tela Acompanhar Solicitação**: campo para digitar protocolo e exibir status (simule respostas fixas no backend)
- [ ] **Tela Perfil/Configurações**: informações do usuário e opção de "Ativar notificações" (só exibir botão se o app estiver instalado no iOS, conforme discutimos)
- [ ] Conectar cada tela às rotas do Express via `fetch('/api/...')`

**Fase 4 — Teste offline local**
- [ ] Rodar `npm run build` e `npm run preview`
- [ ] Acessar pelo Chrome em `http://localhost:4173`
- [ ] Abrir DevTools → Application → Service Workers, marcar "Offline"
- [ ] Recarregar a página e verificar se as telas ainda carregam (o Workbox deve ter cacheado os assets estáticos)
- [ ] Testar se as chamadas ao backend falham graciosamente (exibir mensagem "Sem conexão" em vez de quebrar a tela)

**Fase 5 — Ajuste fino para iOS (quando for testar no dispositivo)**
- [ ] O Service Worker exige HTTPS ou localhost. Para testar no iPhone físico, você precisará de um túnel HTTPS (ex.: `ngrok`) apontando para o `preview` local 
- [ ] No iOS, as notificações push só funcionam após "Adicionar à Tela Inicial" e abrir pelo ícone. Deixe isso documentado no fluxo da tela de configurações

### 💡 Observação importante sobre o teste local

O `vite-plugin-pwa` **não gera o Service Worker em modo de desenvolvimento** (`npm run dev`). Para testar o comportamento offline real, você precisa rodar `npm run build` e depois `npm run preview` . O `preview` serve os arquivos da pasta `dist` em `http://localhost:4173`, e aí sim o Service Worker é registrado e o cache funciona.

Se quiser, posso detalhar o código inicial do `server.js` (Express) e do `vite.config.js` para você colar direto.