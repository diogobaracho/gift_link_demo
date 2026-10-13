import { createServer, type Server, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';

import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { createLogger } from '../../src/lib/logger.js';
import {
  createHttpSentimentClient,
  disabledSentimentClient,
} from '../../src/lib/sentiment-client.js';

/** A tiny real HTTP server whose behaviour each test controls. */
let respond: (body: string, res: ServerResponse) => void;
let server: Server;
let baseUrl: string;

beforeAll(async () => {
  server = createServer((req, res) => {
    let body = '';
    req.on('data', (chunk: Buffer) => (body += chunk.toString()));
    req.on('end', () => respond(body, res));
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));
afterEach(() => vi.restoreAllMocks());

const logger = createLogger({ level: 'silent' });
const client = () => createHttpSentimentClient({ baseUrl, timeoutMs: 200, logger });

describe('createHttpSentimentClient', () => {
  it('posts the sentence and maps the response', async () => {
    let received = '';
    respond = (body, res) => {
      received = body;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ sentimentScore: 0.8, sentiment: 'positive' }));
    };

    await expect(client().analyze('Love it')).resolves.toEqual({ label: 'positive', score: 0.8 });
    expect(JSON.parse(received)).toEqual({ sentence: 'Love it' });
  });

  it('fails open on a non-2xx response', async () => {
    const warn = vi.spyOn(logger, 'warn');
    respond = (_body, res) => {
      res.statusCode = 500;
      res.end('{}');
    };

    await expect(client().analyze('x')).resolves.toBeNull();
    expect(warn).toHaveBeenCalledWith({ status: 500 }, 'Sentiment service returned an error');
  });

  it('fails open on an unexpected payload', async () => {
    respond = (_body, res) => res.end(JSON.stringify({ sentiment: 'ecstatic' }));
    await expect(client().analyze('x')).resolves.toBeNull();
  });

  it('fails open when the service is slower than the timeout', async () => {
    respond = (_body, res) => {
      setTimeout(() => res.end(JSON.stringify({ sentimentScore: 1, sentiment: 'positive' })), 500);
    };
    await expect(client().analyze('x')).resolves.toBeNull();
  });

  it('fails open when the service is unreachable', async () => {
    const offline = createHttpSentimentClient({
      baseUrl: 'http://127.0.0.1:1',
      timeoutMs: 200,
      logger,
    });
    await expect(offline.analyze('x')).resolves.toBeNull();
  });
});

describe('disabledSentimentClient', () => {
  it('always resolves to null', async () => {
    await expect(disabledSentimentClient.analyze('anything')).resolves.toBeNull();
  });
});
