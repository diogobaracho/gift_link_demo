/**
 * Mock Service Worker server for component tests. It intercepts `fetch` at the network
 * level, so components run their real data-fetching code against realistic HTTP
 * responses. Tests override handlers with `server.use(...)` for each scenario.
 */
import { setupServer } from 'msw/node';

export const server = setupServer();
