import { describe, expect, it } from 'vitest';

import {
  HttpError,
  badRequest,
  conflict,
  forbidden,
  notFound,
  unauthorized,
} from '../../src/lib/http-error.js';

describe('http-error factories', () => {
  it.each([
    [badRequest('bad', { field: 'x' }), 400, 'BAD_REQUEST', 'bad'],
    [unauthorized(), 401, 'UNAUTHORIZED', 'Authentication required'],
    [forbidden(), 403, 'FORBIDDEN', 'You are not allowed to perform this action'],
    [notFound(), 404, 'NOT_FOUND', 'Resource not found'],
    [conflict('dup'), 409, 'CONFLICT', 'dup'],
  ])('builds %o', (error, status, code, message) => {
    expect(error).toBeInstanceOf(HttpError);
    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({ status, code, message });
  });

  it('keeps optional details', () => {
    expect(badRequest('bad', { field: 'x' }).details).toEqual({ field: 'x' });
  });
});
