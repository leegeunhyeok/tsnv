import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.e2e.ts'],
    globalSetup: ['./vitest.e2e.global-setup.ts'],
    hookTimeout: 60_000,
    testTimeout: 60_000,
  },
});
