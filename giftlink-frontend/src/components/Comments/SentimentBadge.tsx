/**
 * Sentiment label from the sentiment microservice (spec 006, user story 3).
 */
import { Badge } from 'react-bootstrap';

import type { Comment } from '../../types';

const STYLE = {
  positive: { bg: 'success', icon: '😊' },
  neutral: { bg: 'secondary', icon: '😐' },
  negative: { bg: 'danger', icon: '🙁' },
} as const;

export default function SentimentBadge({ sentiment }: { sentiment: Comment['sentiment'] }) {
  if (!sentiment) return null;
  const { bg, icon } = STYLE[sentiment.label];
  return (
    <Badge bg={bg} pill title={`Sentiment score ${sentiment.score}`}>
      <span aria-hidden="true">{icon} </span>
      {sentiment.label}
      <span className="visually-hidden"> sentiment</span>
    </Badge>
  );
}
