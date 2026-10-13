/**
 * /api/auth routes: register, login, current user and profile update.
 */
import { Router, type RequestHandler } from 'express';

import { getAuthUser } from '../../middleware/require-auth.js';

import { loginSchema, registerSchema, updateProfileSchema } from './auth.schema.js';
import type { AuthService } from './auth.service.js';

export function authRoutes(auth: AuthService, authenticate: RequestHandler): Router {
  const router = Router();

  /** POST /api/auth/register → 201 { token, user } */
  router.post('/register', async (req, res) => {
    const input = registerSchema.parse(req.body);
    res.status(201).json(await auth.register(input));
  });

  /** POST /api/auth/login → 200 { token, user } */
  router.post('/login', async (req, res) => {
    const input = loginSchema.parse(req.body);
    res.json(await auth.login(input));
  });

  /** GET /api/auth/me → 200 { user } */
  router.get('/me', authenticate, async (req, res) => {
    res.json({ user: await auth.getById(getAuthUser(req).id) });
  });

  /** PUT /api/auth/update { firstName?, lastName? } → 200 { user } */
  router.put('/update', authenticate, async (req, res) => {
    const changes = updateProfileSchema.parse(req.body);
    res.json({ user: await auth.updateProfile(getAuthUser(req).id, changes) });
  });

  return router;
}
