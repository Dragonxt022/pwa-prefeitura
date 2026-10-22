import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { aplicarPreferenciasAcessibilidade } from './lib/acessibilidade.js'
import './index.css'

aplicarPreferenciasAcessibilidade()

// Versões anteriores do Service Worker guardavam respostas com foto e contato.
if (typeof caches !== 'undefined') {
  caches.delete('api-get-v1').catch(() => {})
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
