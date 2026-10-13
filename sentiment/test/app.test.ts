import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { MAX_SENTENCE_LENGTH, createApp } from '../src/app.js';
import { createLogger } from '../src/logger.js';

const logger = createLogger('silent');
const app = createApp({ logger });

describe('POST /sentiment', () => {
  it('returns score and label for a positive sentence', async () => {
    const res = await request(app)
      .post('/sentiment')
      .send({ sentence: 'What a wonderful, lovely gift!' })
      .expect(200);

    expect(res.body).toEqual({ sentimentScore: expect.any(Number), sentiment: 'positive' });
  });

  it('returns a negative label for a negative sentence', async () => {
    const res = await request(app)
      .post('/sentiment')
      .send({ sentence: 'Horrible and ugly.' })
      .expect(200);
    expect(res.body.sentiment).toBe('negative');
  });

  it.each([{}, { sentence: '' }, { sentence: '   ' }, { sentence: 42 }])(
    'returns 400 when the sentence is missing or invalid (%o)',
    async (body) => {
      const res = await request(app).post('/sentiment').send(body).expect(400);
      expect(res.body).toEqual({ error: 'No sentence provided' });
    },
  );

  it('returns 400 for oversized input', async () => {
    await request(app)
      .post('/sentiment')
      .send({ sentence: 'a'.repeat(MAX_SENTENCE_LENGTH + 1) })
      .expect(400);
  });

  it('returns 500 with the course error message when analysis fails', async () => {
    const failing = createApp({
      logger,
      analyze: () => {
        throw new Error('boom');
      },
    });
    const res = await request(failing).post('/sentiment').send({ sentence: 'hello' }).expect(500);
    expect(res.body).toEqual({ message: 'Error performing sentiment analysis' });
  });
});

describe('GET /health', () => {
  it('reports ok', async () => {
    const res = await request(app).get('/health').expect(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
