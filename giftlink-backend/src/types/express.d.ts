/**
 * Declaration merging: adds the authenticated user to Express's Request type.
 * Set by `requireAuth`; read in handlers through `getAuthUser(req)`.
 */
import type { AuthUser } from '../middleware/require-auth.js';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
