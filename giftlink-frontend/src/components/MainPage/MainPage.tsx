/**
 * Gift catalogue (spec 004, user story 1): course MainPage Tasks 1-6 plus pagination.
 *
 * The current page lives in the URL (`/app?page=2`), so it survives reloads, can be
 * shared, and works with the browser's back button.
 */
import { useCallback } from 'react';
import { Col, Pagination, Row } from 'react-bootstrap';
import { useSearchParams } from 'react-router';

import { api } from '../../api/client';
import { useFetch } from '../../hooks/useFetch';
import ErrorAlert from '../common/ErrorAlert';
import Loading from '../common/Loading';
import GiftCard from '../GiftCard/GiftCard';

export const PAGE_SIZE = 12;

export default function MainPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(Number(searchParams.get('page')) || 1, 1);

  const fetchPage = useCallback(
    (signal: AbortSignal) => api.listGifts(page, PAGE_SIZE, signal),
    [page],
  );
  const { data, error, loading, reload } = useFetch(fetchPage);

  const goTo = (target: number) => {
    setSearchParams(target === 1 ? {} : { page: String(target) });
    window.scrollTo({ top: 0 });
  };

  return (
    <section className="container py-4" aria-labelledby="gifts-title">
      <div className="d-flex align-items-baseline justify-content-between mb-3">
        <h1 id="gifts-title" className="h2 mb-0">
          Available gifts
        </h1>
        {data && <span className="text-muted">{data.total} items</span>}
      </div>

      {loading && <Loading label="Loading gifts…" />}
      {error && <ErrorAlert message={error.message} onRetry={reload} />}

      {!loading && !error && data && (
        <>
          {data.items.length === 0 ? (
            <p className="text-center text-muted py-5">No gifts here yet. Check back soon!</p>
          ) : (
            <Row xs={1} sm={2} lg={3} className="g-4">
              {data.items.map((gift) => (
                <Col key={gift.id}>
                  <GiftCard gift={gift} />
                </Col>
              ))}
            </Row>
          )}

          {data.totalPages > 1 && (
            <nav aria-label="Gift pages" className="d-flex justify-content-center mt-4">
              <Pagination>
                <Pagination.Prev disabled={page <= 1} onClick={() => goTo(page - 1)}>
                  Previous
                </Pagination.Prev>
                {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((n) => (
                  <Pagination.Item key={n} active={n === page} onClick={() => goTo(n)}>
                    {n}
                  </Pagination.Item>
                ))}
                <Pagination.Next disabled={page >= data.totalPages} onClick={() => goTo(page + 1)}>
                  Next
                </Pagination.Next>
              </Pagination>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
