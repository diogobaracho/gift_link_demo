/**
 * Application-level HTTP errors.
 *
 * Route handlers `throw` these and Express 5 forwards rejected promises to the central
 * error handler, which maps them to the API's error shape:
 *
 *   { "error": { "code": "NOT_FOUND", "message": "Gift not found" } }
 *
 * Machine-readable `code`s let clients branch on errors without parsing messages.
 */
export class HttpError extends Error {
  override readonly name = 'HttpError';

  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new HttpError(400, 'BAD_REQUEST', message, details);

export const unauthorized = (message = 'Authentication required') =>
  new HttpError(401, 'UNAUTHORIZED', message);

export const forbidden = (message = 'You are not allowed to perform this action') =>
  new HttpError(403, 'FORBIDDEN', message);

export const notFound = (message = 'Resource not found') =>
  new HttpError(404, 'NOT_FOUND', message);

export const conflict = (message: string) => new HttpError(409, 'CONFLICT', message);
