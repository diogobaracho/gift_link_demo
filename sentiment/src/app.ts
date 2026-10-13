/**
 * Sentiment microservice HTTP layer (completes course Tasks 2-7).
 *
 * Contract (kept identical to the course so existing clients keep working):
 *   POST /sentiment { "sentence": "..." }
 *     200 → { "sentimentScore": 0.75, "sentiment": "positive" }
 *     400 → { "error": "No sentence provided" }
 *     500 → { "message": "Error performing sentiment analysis" }
 *   GET /health → { "status": "ok" }
 */
import express, { type Express } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';

import { analyzeSentiment, type SentimentResult } from './analyzer.js';
import type { Logger } from './logger.js';

/** Longest accepted sentence; keeps CPU per request bounded. */
export const MAX_SENTENCE_LENGTH = 2000;

export interface SentimentAppDependencies {
  logger: Logger;
  /** Injectable for tests (e.g. to simulate an analyzer failure). */
  analyze?: (sentence: string) => SentimentResult;
}

export function createApp({
  logger,
  analyze = analyzeSentiment,
}: SentimentAppDependencies): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(express.json({ limit: '16kb' }));
  // pino-http replaces the deprecated express-pino-logger used by the skeleton.
  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/health' } }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/sentiment', (req, res) => {
    const sentence: unknown = (req.body as { sentence?: unknown } | undefined)?.sentence;

    if (typeof sentence !== 'string' || sentence.trim() === '') {
      req.log.warn('No sentence provided');
      res.status(400).json({ error: 'No sentence provided' });
      return;
    }
    if (sentence.length > MAX_SENTENCE_LENGTH) {
      res.status(400).json({ error: `Sentence exceeds ${MAX_SENTENCE_LENGTH} characters` });
      return;
    }

    try {
      const result = analyze(sentence);
      req.log.info(result, 'Sentiment analysis result');
      res.status(200).json(result);
    } catch (error) {
      req.log.error({ err: error }, 'Error performing sentiment analysis');
      res.status(500).json({ message: 'Error performing sentiment analysis' });
    }
  });

  return app;
}
