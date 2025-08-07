import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['**/*.test.ts'],
    exclude: ['node_modules/**'],
    testTimeout: 120000, // 2 minutes for database tests
    typecheck: {
      enabled: false // Disable typecheck to avoid TSConfig issues
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.spec.ts']
    }
  },
  esbuild: {
    target: 'node18'
  }
});
