import { defineConfig } from '@playwright/test'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const portaApi = 3100
const portaWeb = 5273
const arquivoDados = join(
  tmpdir(),
  `prefeitura-e2e-${process.pid}-${Date.now()}.json`,
)

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${portaWeb}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'npm --prefix backend run start',
      url: `http://127.0.0.1:${portaApi}/api/health`,
      timeout: 120_000,
      reuseExistingServer: false,
      env: {
        ...process.env,
        PORT: String(portaApi),
        DATA_FILE: arquivoDados,
        MOCK_LATENCY_MS: '0',
        NODE_ENV: 'test',
        CORS_ORIGINS: `http://127.0.0.1:${portaWeb},http://localhost:${portaWeb}`,
      },
    },
    {
      command:
        'npm --prefix frontend run build && ' +
        `npm --prefix frontend run preview -- --host 127.0.0.1 --port ${portaWeb} --strictPort`,
      url: `http://127.0.0.1:${portaWeb}`,
      timeout: 180_000,
      reuseExistingServer: false,
      env: {
        ...process.env,
        API_TARGET: `http://127.0.0.1:${portaApi}`,
      },
    },
  ],
})
