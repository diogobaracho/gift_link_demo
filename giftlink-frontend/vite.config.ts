/**
 * Vite config for the dev server, production build and Vitest.
 *
 * In development `/api` is proxied to the backend, so the browser only talks to one
 * origin, exactly as in production where nginx does the same proxying. That way there
 * is no CORS setup to get wrong and no environment-specific API URLs in the bundle.
 */
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const apiTarget = process.env.VITE_PROXY_TARGET ?? 'http://localhost:3060';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: { '/api': { target: apiTarget, changeOrigin: true } },
  },
  preview: { port: 4173 },
  build: { sourcemap: true },
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
    // Shared session storage must not leak between test files.
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/test/**', 'src/**/*.test.{ts,tsx}', 'src/vite-env.d.ts'],
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      thresholds: { lines: 80, functions: 80, branches: 75, statements: 80 },
    },
  },
});
