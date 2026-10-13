/**
 * Bearer-token authentication middleware.
 *
 *   Authorization: Bearer <jwt>
 *
 * On success `req.user` is populated. On failure a 401 is raised and the request never
 * reaches the handler.
 */
import type { Request, RequestHandler } from 'express';

import { unauthorized } from '../lib/http-error.js';
import { verifyToken } from '../lib/jwt.js';

export interface AuthUser {
  id: string;
  email: string;
}

export function requireAuth(jwtSecret: string): RequestHandler {
  return (req, _res, next) => {
    const [scheme, token] = req.headers.authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) {
      throw unauthorized();
    }

    try {
      const claims = verifyToken(token, jwtSecret);
      req.user = { id: claims.sub, email: claims.email };
    } catch {
      // Expired, tampered or signed with another secret: same answer, no details leaked.
      throw unauthorized('Invalid or expired token');
    }
    next();
  };
}

/** Returns the authenticated user. Only valid on routes guarded by `requireAuth`. */
export function getAuthUser(req: Request): AuthUser {
  if (!req.user) throw unauthorized();
  return req.user;
}
