/// <reference types='vitest' />
import { resolve } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';

// GitHub Pages specific configuration for static deployment
export default defineConfig(({ mode }) => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/web-app-pages',
  publicDir: 'public',
  base: '/equipment-share-demo/', // Update this to match your GitHub repository name

  define: {
    // Environment variables for GitHub Pages
    'process.env.VITE_APP_ENV': JSON.stringify('github-pages'),
    'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'https://api.your-domain.com'),
  },

  plugins: [react(), vanillaExtractPlugin()],

  build: {
    outDir: '../../dist/apps/web-app-pages',
    emptyOutDir: true,
    reportCompressedSize: true,
    copyPublicDir: true,
    sourcemap: false, // Disable sourcemaps for smaller bundle size

    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.pages.html'), // Single entry point for GitHub Pages
      },
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
      },
    },

    // Optimize for static hosting
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      },
    },
  },

  // No SSR for GitHub Pages
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
}));
