import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Cheap bcrypt rounds in tests (production default is 10).
    env: { BCRYPT_COST: '4' },
    include: ['test/**/*.test.ts'],
    // One in-memory MongoDB for the whole run; every test file uses its own database.
    globalSetup: ['test/global-setup.ts'],
    // Downloading/starting mongod on a cold cache can take a while.
    hookTimeout: 60_000,
    testTimeout: 15_000,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts', 'scripts/**/*.ts'],
      exclude: ['src/server.ts', 'scripts/seed.ts', 'src/types/**'],
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      thresholds: { lines: 85, functions: 85, branches: 80, statements: 85 },
    },
  },
});
