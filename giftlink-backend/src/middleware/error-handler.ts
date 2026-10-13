/**
 * Central error handling: the only place that turns exceptions into HTTP responses.
 *
 * Express 5 forwards both sync throws and rejected promises from handlers here, so
 * route code can simply `throw notFound('Gift not found')` with no try/catch.
 */
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';

import { HttpError } from '../lib/http-error.js';

/** Response body shape for every error returned by the API. */
export interface ErrorBody {
  error: { code: string; message: string; details?: unknown };
}

/** 404 for any route that no router matched. Registered after all routes. */
export const notFoundHandler: RequestHandler = (req, res) => {
  const body: ErrorBody = {
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` },
  };
  res.status(404).json(body);
};

/** True for body-parser's "malformed JSON" error. */
function isJsonSyntaxError(err: unknown): boolean {
  return (
    err instanceof SyntaxError &&
    (err as SyntaxError & { type?: string }).type === 'entity.parse.failed'
  );
}

export const errorHandler: ErrorRequestHandler = (err: unknown, req, res, _next) => {
  let status = 500;
  let body: ErrorBody = {
    error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' },
  };

  if (err instanceof HttpError) {
    status = err.status;
    body = { error: { code: err.code, message: err.message, details: err.details } };
  } else if (err instanceof ZodError) {
    status = 400;
    body = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: err.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
    };
  } else if (isJsonSyntaxError(err)) {
    status = 400;
    body = { error: { code: 'INVALID_JSON', message: 'Request body is not valid JSON' } };
  }

  // Expected client errors are noise at `error` level; unexpected ones need a stack trace.
  if (status >= 500) {
    req.log.error({ err }, 'Unhandled error');
  } else {
    req.log.debug({ err: (err as Error).message, status }, 'Request failed');
  }

  res.status(status).json(body);
};
