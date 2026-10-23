import { defineConfig, devices } from '@playwright/test';

/* Testes de tela da Missão 2: rodam contra o `npm run dev` (reaproveita o servidor da porta 3000 se já estiver de pé). */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: { baseURL: 'http://localhost:3000', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: { command: 'npm run dev', url: 'http://localhost:3000', reuseExistingServer: true, timeout: 120_000 },
});
