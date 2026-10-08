/**
 * Enforces Conventional Commits (https://www.conventionalcommits.org).
 * Allowed scopes mirror the workspaces plus cross-cutting areas.
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      1,
      'always',
      ['backend', 'frontend', 'sentiment', 'e2e', 'docker', 'ci', 'docs', 'specs', 'deps', 'adr'],
    ],
    'body-max-line-length': [0],
  },
};
