/**
 * Client for the sentiment microservice: a port/adapter boundary (ADR-0010).
 *
 * Sentiment is a nice-to-have, so the client **fails open**: on timeout, network error,
 * non-2xx status or an unexpected payload it logs a warning and returns `null`. The
 * comment is still saved; it just has no sentiment badge. A slow optional dependency
 * must never take down a core feature.
 */
import { z } from 'zod';

import type { SentimentLabel } from '../db/collections.js';

import type { Logger } from './logger.js';

export interface CommentSentiment {
  label: SentimentLabel;
  score: number;
}

/** What the comments module depends on. Tests inject a stub instead of HTTP. */
export interface SentimentClient {
  analyze(text: string): Promise<CommentSentiment | null>;
}

/** Response contract of `POST /sentiment` (validated: never trust a network peer). */
const responseSchema = z.object({
  sentimentScore: z.number(),
  sentiment: z.enum(['positive', 'neutral', 'negative']),
});

export interface HttpSentimentClientOptions {
  baseUrl: string;
  timeoutMs: number;
  logger: Logger;
}

export function createHttpSentimentClient({
  baseUrl,
  timeoutMs,
  logger,
}: HttpSentimentClientOptions): SentimentClient {
  const endpoint = new URL('/sentiment', baseUrl).toString();

  return {
    async analyze(text) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sentence: text }),
          // Abort if the service is slow; the user should not wait on an optional feature.
          signal: AbortSignal.timeout(timeoutMs),
        });
        if (!res.ok) {
          logger.warn({ status: res.status }, 'Sentiment service returned an error');
          return null;
        }
        const body = responseSchema.parse(await res.json());
        return { label: body.sentiment, score: body.sentimentScore };
      } catch (err) {
        logger.warn({ err: (err as Error).message }, 'Sentiment service unavailable');
        return null;
      }
    },
  };
}

/** Used when SENTIMENT_URL is not configured. */
export const disabledSentimentClient: SentimentClient = {
  analyze: () => Promise.resolve(null),
};
