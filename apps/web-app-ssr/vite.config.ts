/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/web-app-ssr',
  publicDir: 'public',

  server: {
    port: 4300,
    host: 'localhost',
    hmr: {
      port: 4301,
    },
  },

  preview: {
    port: 4302,
    host: 'localhost',
  },

  plugins: [react()],

  build: {
    outDir: '../../dist/apps/web-app-ssr',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },

  test: {
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
  },
}));
