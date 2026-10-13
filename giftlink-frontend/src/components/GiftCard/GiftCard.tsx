/**
 * Card used by the gift list (course MainPage Tasks 4-6).
 */
import { Card } from 'react-bootstrap';
import { Link } from 'react-router';

import { formatDate } from '../../lib/format';
import type { Gift } from '../../types';

import GiftImage from './GiftImage';

export default function GiftCard({ gift }: { gift: Gift }) {
  const conditionClass = gift.condition === 'New' ? 'condition-new' : 'condition-used';

  return (
    <Card as="article" className="product-card h-100" aria-labelledby={`gift-${gift.id}-title`}>
      <GiftImage gift={gift} />
      <Card.Body className="d-flex flex-column">
        <Card.Title as="h2" className="h5" id={`gift-${gift.id}-title`}>
          {gift.name}
        </Card.Title>
        <p className={`mb-1 fw-semibold ${conditionClass}`}>{gift.condition}</p>
        <p className="text-muted small mb-3">Added {formatDate(gift.date_added)}</p>
        <Link
          to={`/app/product/${gift.id}`}
          className="btn btn-primary mt-auto"
          aria-label={`View details of ${gift.name}`}
        >
          View Details
        </Link>
      </Card.Body>
    </Card>
  );
}
