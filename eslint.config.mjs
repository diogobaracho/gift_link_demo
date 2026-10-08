// @ts-check
/**
 * Root ESLint flat config shared by every workspace.
 *
 * Layers (later entries override earlier ones):
 *  1. ESLint + typescript-eslint recommended rules with type information.
 *  2. Node globals for the backend/sentiment services and tooling.
 *  3. React hooks + accessibility rules for the frontend.
 *  4. Vitest / Playwright rules for test files.
 *  5. eslint-config-prettier last, so formatting is owned by Prettier only.
 */
import js from '@eslint/js';
import vitest from '@vitest/eslint-plugin';
import prettier from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores([
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/coverage/**',
    '**/playwright-report/**',
    '**/test-results/**',
    'giftlink-frontend/public/**',
    '.specify/**',
    '.claude/**',
  ]),

  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
      eqeqeq: ['error', 'always'],
      'no-console': 'warn',
    },
  },

  // Plain JS config files are not part of any tsconfig: lint them without type info.
  {
    files: ['**/*.{js,mjs,cjs}'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
  },

  // Node services and tooling.
  {
    files: ['giftlink-backend/**/*.ts', 'sentiment/**/*.ts', 'e2e/**/*.ts', '*.config.ts'],
    languageOptions: { globals: globals.node },
  },

  // React frontend.
  {
    files: ['giftlink-frontend/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended, jsxA11y.flatConfigs.recommended],
    languageOptions: { globals: globals.browser },
  },

  // Unit / integration tests.
  {
    files: ['**/*.test.{ts,tsx}', '**/test/**/*.{ts,tsx}'],
    extends: [vitest.configs.recommended],
    rules: {
      // Test doubles and supertest bodies are intentionally loosely typed.
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      // `expect(window.scrollTo).toHaveBeenCalled()` references spied methods unbound.
      '@typescript-eslint/unbound-method': 'off',
      // supertest's `request(app).get(...).expect(200)` (and helpers wrapping it) assert too.
      'vitest/expect-expect': ['error', { assertFunctionNames: ['expect', '**.expect'] }],
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },

  prettier,
);
