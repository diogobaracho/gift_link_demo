/**
 * Lexicon-based sentiment analysis with `natural` (completes course Tasks 1 and 5).
 *
 * AFINN-165 assigns each known word a score from -5 to +5. `SentimentAnalyzer` stems the
 * tokens (Porter), sums their scores and divides by the token count, so the result is
 * the average sentiment per word. It is fast, deterministic and needs no model download.
 * The trade-off is that it misses sarcasm and context ("not bad").
 */
import natural from 'natural';

export type SentimentLabel = 'positive' | 'neutral' | 'negative';

export interface SentimentResult {
  sentimentScore: number;
  sentiment: SentimentLabel;
}

/** Scores above this are positive (course rule: 0 to 0.33 is neutral). */
export const POSITIVE_THRESHOLD = 0.33;

const analyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
// The course split on spaces, which leaves punctuation glued to words ("great!" is not
// in the lexicon). A word tokenizer fixes that.
const tokenizer = new natural.WordTokenizer();

/** Maps a numeric score to a label using the course's thresholds. */
export function classify(score: number): SentimentLabel {
  if (score < 0) return 'negative';
  if (score <= POSITIVE_THRESHOLD) return 'neutral';
  return 'positive';
}

export function analyzeSentiment(sentence: string): SentimentResult {
  const tokens = tokenizer.tokenize(sentence.toLowerCase());
  // getSentiment returns NaN for an empty token list (0 / 0); treat it as neutral.
  const raw = tokens.length > 0 ? analyzer.getSentiment(tokens) : 0;
  const sentimentScore = Number.isFinite(raw) ? Math.round(raw * 1000) / 1000 : 0;
  return { sentimentScore, sentiment: classify(sentimentScore) };
}
