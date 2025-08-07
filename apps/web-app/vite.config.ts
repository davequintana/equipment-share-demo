/// <reference types='vitest' />
import { resolve } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';

export default defineConfig(({ mode }) => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/web-app',
  publicDir: 'public',

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
    // Let NX handle outDir via outputPath, but ensure paths are correct
    outDir: process.env.NX_TASK_TARGET_PROJECT ? '../../dist/apps/web-app' : 'dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    copyPublicDir: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      input: {
        client: resolve(__dirname, 'src/client/main.tsx'),
        server: resolve(__dirname, 'src/server/entry.tsx'),
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
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.{test,spec}.{ts,tsx}', 'src/test-setup.ts'],
    },
  },
}));
