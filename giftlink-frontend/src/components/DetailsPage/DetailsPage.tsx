/**
 * Gift details (spec 004, user story 2): course DetailsPage Tasks 2-7, plus real
 * comments and owner deletion.
 *
 * Unlike the course, details are public. Only commenting and deleting need an account.
 */
import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card } from 'react-bootstrap';
import { useLocation, useNavigate, useParams } from 'react-router';

import { ApiError, api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { formatAge, formatDate } from '../../lib/format';
import ErrorAlert from '../common/ErrorAlert';
import Loading from '../common/Loading';
import CommentsSection from '../Comments/CommentsSection';
import GiftImage from '../GiftCard/GiftImage';

import './DetailsPage.css';

export default function DetailsPage() {
  const { productId = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useAuth();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchGift = useCallback(
    (signal: AbortSignal) => api.getGift(productId, signal),
    [productId],
  );
  const { data: gift, error, loading, reload } = useFetch(fetchGift);

  // Task 3: start at the top when opening a gift from a scrolled list.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [productId]);

  // Task 4: go back. A direct visit has no history entry, so fall back to the list.
  const handleBack = () => {
    if (location.key === 'default') void navigate('/app');
    else void navigate(-1);
  };

  const handleDelete = async () => {
    if (!gift || !token) return;
    if (!window.confirm(`Delete "${gift.name}"? This cannot be undone.`)) return;
    try {
      await api.deleteGift(gift.id, token);
      void navigate('/app', { replace: true });
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Could not delete this gift.');
    }
  };

  if (loading) return <Loading label="Loading gift…" />;
  if (error?.status === 404) {
    return (
      <section className="container py-5 text-center">
        <h1 className="h3">Gift not found</h1>
        <p className="text-muted">It may have been claimed or removed.</p>
        <Button onClick={() => void navigate('/app')}>Back to gifts</Button>
      </section>
    );
  }
  if (error || !gift) {
    return (
      <section className="container py-4">
        <ErrorAlert message={error?.message ?? 'Gift not found'} onRetry={reload} />
      </section>
    );
  }

  const isOwner = user?.id === gift.posted_by;

  return (
    <section className="container py-4">
      <div className="d-flex justify-content-between mb-3">
        <Button variant="secondary" onClick={handleBack}>
          ← Back
        </Button>
        {isOwner && (
          <Button variant="outline-danger" onClick={() => void handleDelete()}>
            Delete gift
          </Button>
        )}
      </div>
      {deleteError && <Alert variant="danger">{deleteError}</Alert>}

      <Card as="article" className="product-details-card" aria-labelledby="gift-title">
        <Card.Header>
          <h1 id="gift-title" className="details-title">
            {gift.name}
          </h1>
        </Card.Header>
        <Card.Body>
          <GiftImage gift={gift} size="large" />
          <dl className="row details-list mb-0">
            <dt className="col-sm-3">Category</dt>
            <dd className="col-sm-9">{gift.category}</dd>
            <dt className="col-sm-3">Condition</dt>
            <dd className="col-sm-9">{gift.condition}</dd>
            <dt className="col-sm-3">Date added</dt>
            <dd className="col-sm-9">{formatDate(gift.date_added)}</dd>
            <dt className="col-sm-3">Age</dt>
            <dd className="col-sm-9">{formatAge(gift.age_years)}</dd>
            <dt className="col-sm-3">Zip code</dt>
            <dd className="col-sm-9">{gift.zipcode}</dd>
            <dt className="col-sm-3">Description</dt>
            <dd className="col-sm-9">{gift.description}</dd>
          </dl>
        </Card.Body>
      </Card>

      <CommentsSection giftId={gift.id} />
    </section>
  );
}
