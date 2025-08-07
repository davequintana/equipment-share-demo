import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./apps/fastify-api/src/test-setup.ts'],
    include: ['apps/fastify-api/src/**/*.{test,spec}.{ts,js}'],
    coverage: {
      reportsDirectory: '../../coverage/apps/fastify-api',
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.{test,spec}.ts', 'src/test-setup.ts'],
    },
  },
});
