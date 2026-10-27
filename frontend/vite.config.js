import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = process.env.API_TARGET || env.API_TARGET || 'http://localhost:3000'

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icons/favicon-32.png', 'icons/apple-touch-icon-180.png'],
        manifest: {
          id: '/',
          name: 'Prefeitura Digital - Piloto',
          short_name: 'Prefeitura',
          description:
            'Piloto de atendimento ao cidadao: abrir solicitacoes, acompanhar protocolos e consultar avisos da prefeitura.',
          lang: 'pt-BR',
          dir: 'ltr',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'portrait',
          theme_color: '#1351B4',
          background_color: '#F5F7FA',
          categories: ['government', 'productivity', 'utilities'],
          icons: [
            {
              src: '/icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icons/maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
          navigateFallback: 'index.html',
          // Navegacoes para /api nunca devem receber o index.html do SPA.
          navigateFallbackDenylist: [/^\/api\//],
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              // Apenas dados públicos e não pessoais entram no cache offline.
              // Solicitações (detalhe, status e semelhantes) dependem de segredo
              // ou revelam existência de pedidos e ficam totalmente fora do SW.
              urlPattern: ({ url, sameOrigin }) => {
                if (!sameOrigin || !url.pathname.startsWith('/api/')) return false
                if (url.pathname.startsWith('/api/gestao')) return false
                if (url.pathname.startsWith('/api/solicitacoes')) return false
                return true
              },
              handler: 'NetworkFirst',
              method: 'GET',
              options: {
                cacheName: 'api-public-v3',
                networkTimeoutSeconds: 3,
                expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
                cacheableResponse: { statuses: [200] },
              },
            },
          ],
        },
        // O Service Worker nao e gerado em dev por padrao.
        // Para depurar em dev, troque para true (ver doc/03-plano-execucao.md).
        devOptions: { enabled: false },
      }),
    ],
    server: {
      port: 5173,
      strictPort: true,
      // O catálogo de erros é compartilhado entre backend e frontend.
      fs: {
        allow: [
          fileURLToPath(new URL('.', import.meta.url)),
          fileURLToPath(new URL('..', import.meta.url)),
        ],
      },
      proxy: {
        '/api': { target: apiTarget, changeOrigin: true },
      },
    },
    preview: {
      port: 4173,
      strictPort: true,
      proxy: {
        '/api': { target: apiTarget, changeOrigin: true },
      },
    },
  }
})
