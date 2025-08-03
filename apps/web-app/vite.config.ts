/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';

export default defineConfig(({ mode }) => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/web-app',

  server: {
    port: 4201,
    host: 'localhost',
    hmr: {
      port: 4202,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3334',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  preview: {
    port: 4301,
    host: 'localhost',
  },

  plugins: [react(), vanillaExtractPlugin()],

  // SSR Configuration
  ssr: {
    noExternal: ['@vanilla-extract/css'],
    target: 'node',
  },

  build: {
    outDir: '../../dist/apps/web-app',
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      input: {
        client: 'src/client/main.tsx',
        server: 'src/server/entry.tsx',
      },
      output: {
        entryFileNames: '[name].js',
      },
    },
  },

  test: {
    passWithNoTests: true,
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    css: true,
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/apps/web-app',
      provider: 'v8',
    },
  },
}));
