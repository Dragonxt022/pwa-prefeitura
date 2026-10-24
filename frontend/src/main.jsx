import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { ConfiguracoesProvider } from './contexto/Configuracoes.jsx'
import { I18nProvider } from './i18n/index.jsx'
import { aplicarPreferenciasAcessibilidade } from './utils/acessibilidade.js'
import './estilos/global.css'

aplicarPreferenciasAcessibilidade()

// Versões anteriores do Service Worker guardavam respostas com foto e contato.
if (typeof caches !== 'undefined') {
  caches.delete('api-get-v1').catch(() => {})
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <I18nProvider>
      <ConfiguracoesProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ConfiguracoesProvider>
    </I18nProvider>
  </StrictMode>,
)
