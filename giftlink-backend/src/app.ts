/**
 * Express application factory.
 *
 * `createApp` receives all of its collaborators (config, db, logger) instead of
 * importing singletons. That gives:
 *  - tests that run the real HTTP stack against an in-memory MongoDB and stub services;
 *  - no side effects on import (nothing connects or listens until `server.ts` says so).
 */
import { randomUUID } from 'node:crypto';

import cors from 'cors';
import express, { type Express } from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import type { Db } from 'mongodb';
import { pinoHttp } from 'pino-http';
import swaggerUi from 'swagger-ui-express';

import type { AppConfig } from './config/env.js';
import { getCollections } from './db/collections.js';
import { pingDatabase } from './db/mongo.js';
import { openApiDocument } from './docs/openapi.js';
import type { Logger } from './lib/logger.js';
import {
  createHttpSentimentClient,
  disabledSentimentClient,
  type SentimentClient,
} from './lib/sentiment-client.js';
import { errorHandler, notFoundHandler, type ErrorBody } from './middleware/error-handler.js';
import { requireAuth } from './middleware/require-auth.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { AuthService } from './modules/auth/auth.service.js';
import { commentRoutes } from './modules/comments/comment.routes.js';
import { CommentService } from './modules/comments/comment.service.js';
import { giftRoutes } from './modules/gifts/gift.routes.js';
import { GiftService } from './modules/gifts/gift.service.js';
import { searchRoutes } from './modules/search/search.routes.js';

export interface AppDependencies {
  config: AppConfig;
  db: Db;
  logger: Logger;
  /** Defaults to the HTTP client when SENTIMENT_URL is set, otherwise a no-op. */
  sentiment?: SentimentClient;
}

export function createApp(deps: AppDependencies): Express {
  const { config, db, logger } = deps;
  const sentiment =
    deps.sentiment ??
    (config.sentiment.url
      ? createHttpSentimentClient({
          baseUrl: config.sentiment.url,
          timeoutMs: config.sentiment.timeoutMs,
          logger,
        })
      : disabledSentimentClient);
  const app = express();

  // Behind nginx / a cloud load balancer: trust the first proxy hop so `req.ip`
  // (used by rate limiting) is the real client address.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  // --- Cross-cutting middleware ---------------------------------------------------------
  app.use(
    pinoHttp({
      logger,
      // Propagate an incoming request id (from nginx) or create one, and echo it back.
      genReqId: (req, res) => {
        const id = (req.headers['x-request-id'] as string | undefined) ?? randomUUID();
        res.setHeader('x-request-id', id);
        return id;
      },
      // Health probes run every few seconds; keep them out of the logs.
      autoLogging: { ignore: (req) => req.url === '/health' || req.url === '/ready' },
    }),
  );
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigins, credentials: false }));
  app.use(express.json({ limit: '100kb' }));

  // --- Operational endpoints --------------------------------------------------------------
  /** Liveness: the process is up and serving HTTP. */
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  /** Readiness: dependencies are reachable, so traffic can be routed here. */
  app.get('/ready', async (_req, res) => {
    const mongo = await pingDatabase(db);
    res.status(mongo ? 200 : 503).json({ status: mongo ? 'ready' : 'unavailable', mongo });
  });

  // --- API documentation -------------------------------------------------------------------
  app.get('/api/openapi.json', (_req, res) => {
    res.json(openApiDocument);
  });
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument, { customSiteTitle: 'GiftLink API docs' }),
  );

  // --- API --------------------------------------------------------------------------------
  const collections = getCollections(db);
  const giftService = new GiftService(collections);
  const authService = new AuthService(collections.users, config.jwt);
  const commentService = new CommentService(collections, giftService, sentiment);
  const authenticate = requireAuth(config.jwt.secret);

  // Slow down credential stuffing / brute force on login and registration.
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: config.authRateLimitMax,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) => {
      const body: ErrorBody = {
        error: { code: 'TOO_MANY_REQUESTS', message: 'Too many attempts, try again later' },
      };
      res.status(429).json(body);
    },
  });

  app.use('/api/auth', authLimiter, authRoutes(authService, authenticate));
  app.use('/api/gifts/:id/comments', commentRoutes(commentService, authenticate));
  app.use('/api/gifts', giftRoutes(giftService, authenticate));
  app.use('/api/search', searchRoutes(giftService));

  // --- Fallbacks (must be registered last) ---------------------------------------------
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
