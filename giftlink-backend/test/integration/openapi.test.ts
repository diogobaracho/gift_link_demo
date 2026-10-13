import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { openApiDocument } from '../../src/docs/openapi.js';
import { createTestContext, type TestContext } from '../helpers/context.js';

describe('API documentation', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestContext();
  });
  afterAll(() => ctx.close());

  it('serves the OpenAPI document as JSON', async () => {
    const res = await request(ctx.app).get('/api/openapi.json').expect(200);
    expect(res.body.openapi).toBe('3.1.0');
    expect(res.body.info.title).toBe('GiftLink API');
  });

  it('serves Swagger UI', async () => {
    const res = await request(ctx.app).get('/api/docs/').expect(200);
    expect(res.text).toContain('swagger-ui');
  });

  it('documents every public route', () => {
    expect(Object.keys(openApiDocument.paths).sort()).toEqual(
      [
        '/api/auth/login',
        '/api/auth/me',
        '/api/auth/register',
        '/api/auth/update',
        '/api/gifts',
        '/api/gifts/{id}',
        '/api/gifts/{id}/comments',
        '/api/search',
        '/health',
        '/ready',
      ].sort(),
    );
  });

  it('derives body schemas from the zod validators', () => {
    // Plain JSON view: the static JSON Schema types are too loose to index into.
    const { CreateGift, Register } = JSON.parse(JSON.stringify(openApiDocument)).components.schemas;

    expect(CreateGift).not.toHaveProperty('$schema');
    expect(CreateGift).toMatchObject({ additionalProperties: false });
    expect(CreateGift.properties.category.enum).toContain('Kitchen');
    expect(Register.properties.password).toMatchObject({ minLength: 8, maxLength: 72 });
  });

  it('resolves every $ref to a defined component', () => {
    const refs = JSON.stringify(openApiDocument).match(/#\/components\/schemas\/\w+/g) ?? [];
    const defined = Object.keys(openApiDocument.components.schemas);
    for (const ref of new Set(refs)) {
      expect(defined).toContain(ref.split('/').pop());
    }
  });
});
