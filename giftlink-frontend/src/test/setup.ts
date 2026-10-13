/**
 * Global test setup: jest-dom matchers, MSW lifecycle and per-test isolation.
 */
import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

import { server } from './server';

// jsdom does not implement scrolling.
Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true });

// Any request without a handler fails the test, so no real network call slips through.
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
  sessionStorage.clear();
});
afterAll(() => server.close());
