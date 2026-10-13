import { describe, expect, it } from 'vitest';

import { POSITIVE_THRESHOLD, analyzeSentiment, classify } from '../src/analyzer.js';

describe('classify (course thresholds)', () => {
  it.each([
    [-0.01, 'negative'],
    [0, 'neutral'],
    [POSITIVE_THRESHOLD, 'neutral'],
    [0.34, 'positive'],
    [3, 'positive'],
  ] as const)('%d → %s', (score, label) => {
    expect(classify(score)).toBe(label);
  });
});

describe('analyzeSentiment', () => {
  it('labels clearly positive text', () => {
    const result = analyzeSentiment('I love this lamp, it is amazing and beautiful!');
    expect(result.sentiment).toBe('positive');
    expect(result.sentimentScore).toBeGreaterThan(POSITIVE_THRESHOLD);
  });

  it('labels clearly negative text', () => {
    const result = analyzeSentiment('This is terrible, broken and awful.');
    expect(result.sentiment).toBe('negative');
    expect(result.sentimentScore).toBeLessThan(0);
  });

  it('labels factual text as neutral', () => {
    expect(analyzeSentiment('The table is in the kitchen.')).toEqual({
      sentimentScore: 0,
      sentiment: 'neutral',
    });
  });

  it('handles punctuation that the course split(" ") missed', () => {
    expect(analyzeSentiment('great!').sentiment).toBe('positive');
  });

  it('returns neutral for input without word tokens', () => {
    expect(analyzeSentiment('!!! ...')).toEqual({ sentimentScore: 0, sentiment: 'neutral' });
  });

  it('rounds scores to three decimals', () => {
    const { sentimentScore } = analyzeSentiment('good good bad okay fine');
    expect(sentimentScore).toBe(Math.round(sentimentScore * 1000) / 1000);
  });
});
