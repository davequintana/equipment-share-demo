import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./apps/fastify-api/src/test-setup.ts'],
    include: ['apps/fastify-api/src/**/*.{test,spec}.{ts,js}'],
  },
});
