/**
 * Runs only on staged files so the pre-commit hook stays fast.
 * Full-project checks (typecheck, tests) run in `make check` and CI.
 */
export default {
  '*.{ts,tsx,js,mjs,cjs}': ['eslint --max-warnings=0 --fix', 'prettier --write'],
  '*.{json,md,yml,yaml,css,html}': ['prettier --write'],
};
