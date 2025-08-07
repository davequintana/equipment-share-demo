import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./apps/fastify-api/src/test-setup.ts'],
    include: ['apps/fastify-api/src/**/*.{test,spec}.{ts,js}'],
    coverage: {
      reportsDirectory: './coverage',
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['apps/fastify-api/src/**/*.ts'],
      exclude: ['apps/fastify-api/src/**/*.{test,spec}.ts', 'apps/fastify-api/src/test-setup.ts'],
      all: true,
      skipFull: false,
    },
  },
});
