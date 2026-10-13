/**
 * OpenAPI 3.1 description of the GiftLink API, served at /api/openapi.json and rendered
 * by Swagger UI at /api/docs.
 *
 * Request/response body schemas are generated from the same zod schemas the handlers
 * use (`z.toJSONSchema`), so the docs cannot drift from the validation rules.
 * OpenAPI 3.1 uses JSON Schema 2020-12 natively, which is what zod emits.
 */
import { z } from 'zod';

import { loginSchema, registerSchema, updateProfileSchema } from '../modules/auth/auth.schema.js';
import { createCommentSchema } from '../modules/comments/comment.schema.js';
import { createGiftSchema, giftSchema } from '../modules/gifts/gift.schema.js';
import { CATEGORIES, CONDITIONS } from '../db/collections.js';

/** zod → JSON Schema without the `$schema` key (not allowed inside OpenAPI components). */
function jsonSchema(schema: z.ZodType, io: 'input' | 'output' = 'input') {
  const { $schema: _ignored, ...rest } = z.toJSONSchema(schema, { io });
  return rest;
}

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const json = (schema: object) => ({ 'application/json': { schema } });
const errorResponse = (description: string) => ({
  description,
  content: json(ref('Error')),
});

const publicUser = {
  type: 'object',
  required: ['id', 'email', 'firstName', 'lastName', 'createdAt'],
  properties: {
    id: { type: 'string' },
    email: { type: 'string', format: 'email' },
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
  },
};

export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'GiftLink API',
    version: '1.0.0',
    description:
      'Give away household items you no longer need, and find free ones you love. ' +
      'Errors always use the `Error` shape with a machine-readable `code`.',
    license: { name: 'Apache-2.0', identifier: 'Apache-2.0' },
  },
  servers: [{ url: '/', description: 'This server' }],
  tags: [
    { name: 'Gifts' },
    { name: 'Search' },
    { name: 'Comments' },
    { name: 'Auth' },
    { name: 'Operations' },
  ],
  paths: {
    '/api/gifts': {
      get: {
        tags: ['Gifts'],
        summary: 'List gifts, newest first (paginated)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
          {
            name: 'limit',
            in: 'query',
            description: 'Clamped to 1-50',
            schema: { type: 'integer', default: 12 },
          },
        ],
        responses: {
          200: { description: 'A page of gifts', content: json(ref('GiftPage')) },
          400: errorResponse('Invalid query'),
        },
      },
      post: {
        tags: ['Gifts'],
        summary: 'Give an item away',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: json(ref('CreateGift')) },
        responses: {
          201: { description: 'Created', content: json(ref('Gift')) },
          400: errorResponse('Validation error'),
          401: errorResponse('Not authenticated'),
        },
      },
    },
    '/api/gifts/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      get: {
        tags: ['Gifts'],
        summary: 'Get one gift',
        responses: {
          200: { description: 'The gift', content: json(ref('Gift')) },
          404: errorResponse('Gift not found'),
        },
      },
      delete: {
        tags: ['Gifts'],
        summary: 'Delete your gift (and its comments)',
        security: [{ bearerAuth: [] }],
        responses: {
          204: { description: 'Deleted' },
          401: errorResponse('Not authenticated'),
          403: errorResponse('Not the owner'),
          404: errorResponse('Gift not found'),
        },
      },
    },
    '/api/gifts/{id}/comments': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      get: {
        tags: ['Comments'],
        summary: 'Threaded comments of a gift, oldest first',
        responses: {
          200: {
            description: 'Top-level comments with nested replies',
            content: json({ type: 'array', items: ref('Comment') }),
          },
          404: errorResponse('Gift not found'),
        },
      },
      post: {
        tags: ['Comments'],
        summary: 'Comment on a gift or reply to a comment',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: json(ref('CreateComment')) },
        responses: {
          201: { description: 'Created', content: json(ref('Comment')) },
          400: errorResponse('Validation error or parent not on this gift'),
          401: errorResponse('Not authenticated'),
          404: errorResponse('Gift not found'),
        },
      },
    },
    '/api/search': {
      get: {
        tags: ['Search'],
        summary: 'Search gifts (all filters optional, AND semantics, max 50 results)',
        parameters: [
          {
            name: 'name',
            in: 'query',
            description: 'Partial, case-insensitive',
            schema: { type: 'string' },
          },
          { name: 'category', in: 'query', schema: { type: 'string', enum: [...CATEGORIES] } },
          { name: 'condition', in: 'query', schema: { type: 'string', enum: [...CONDITIONS] } },
          {
            name: 'age_years',
            in: 'query',
            description: 'Maximum age in years',
            schema: { type: 'number', minimum: 0 },
          },
        ],
        responses: {
          200: {
            description: 'Matching gifts',
            content: json({ type: 'array', items: ref('Gift') }),
          },
          400: errorResponse('Invalid filter'),
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Create an account',
        requestBody: { required: true, content: json(ref('Register')) },
        responses: {
          201: { description: 'Registered and logged in', content: json(ref('AuthResult')) },
          400: errorResponse('Validation error'),
          409: errorResponse('Email already registered'),
          429: errorResponse('Rate limited'),
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in',
        requestBody: { required: true, content: json(ref('Login')) },
        responses: {
          200: { description: 'Logged in', content: json(ref('AuthResult')) },
          401: errorResponse('Invalid email or password'),
          429: errorResponse('Rate limited'),
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Current user',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'The user',
            content: json({ type: 'object', properties: { user: ref('User') } }),
          },
          401: errorResponse('Not authenticated'),
        },
      },
    },
    '/api/auth/update': {
      put: {
        tags: ['Auth'],
        summary: 'Update your name',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: json(ref('UpdateProfile')) },
        responses: {
          200: {
            description: 'Updated user',
            content: json({ type: 'object', properties: { user: ref('User') } }),
          },
          400: errorResponse('Validation error'),
          401: errorResponse('Not authenticated'),
        },
      },
    },
    '/health': {
      get: {
        tags: ['Operations'],
        summary: 'Liveness probe',
        responses: { 200: { description: 'Process is up' } },
      },
    },
    '/ready': {
      get: {
        tags: ['Operations'],
        summary: 'Readiness probe (MongoDB reachable)',
        responses: { 200: { description: 'Ready' }, 503: { description: 'Not ready' } },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Gift: jsonSchema(giftSchema, 'output'),
      CreateGift: jsonSchema(createGiftSchema),
      GiftPage: {
        type: 'object',
        required: ['items', 'page', 'limit', 'total', 'totalPages'],
        properties: {
          items: { type: 'array', items: ref('Gift') },
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          totalPages: { type: 'integer' },
        },
      },
      CreateComment: jsonSchema(createCommentSchema),
      Comment: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          giftId: { type: 'string' },
          parentId: { type: ['string', 'null'] },
          authorId: { type: 'string' },
          authorName: { type: 'string' },
          text: { type: 'string' },
          sentiment: {
            oneOf: [
              { type: 'null' },
              {
                type: 'object',
                properties: {
                  label: { type: 'string', enum: ['positive', 'neutral', 'negative'] },
                  score: { type: 'number' },
                },
              },
            ],
          },
          createdAt: { type: 'string', format: 'date-time' },
          replies: { type: 'array', items: ref('Comment') },
        },
      },
      Register: jsonSchema(registerSchema),
      Login: jsonSchema(loginSchema),
      UpdateProfile: jsonSchema(updateProfileSchema),
      User: publicUser,
      AuthResult: {
        type: 'object',
        required: ['token', 'user'],
        properties: { token: { type: 'string' }, user: ref('User') },
      },
      Error: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'object',
            required: ['code', 'message'],
            properties: {
              code: { type: 'string', examples: ['VALIDATION_ERROR', 'NOT_FOUND'] },
              message: { type: 'string' },
              details: {},
            },
          },
        },
      },
    },
  },
} as const;
