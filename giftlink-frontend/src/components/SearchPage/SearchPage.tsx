/**
 * Gift search (spec 005): course SearchPage Tasks 1-8.
 *
 * Applied filters live in the URL (`/app/search?name=desk&category=Office`), so a search
 * is shareable, survives reloads and works with back/forward. The form holds the
 * filters being edited; submitting writes them to the URL, which triggers the fetch.
 */
import { useCallback, useState, type FormEvent } from 'react';
import { Button, Card, Col, Form, Row } from 'react-bootstrap';
import { Link, useSearchParams } from 'react-router';

import { api } from '../../api/client';
import { useFetch } from '../../hooks/useFetch';
import { CATEGORIES, CONDITIONS, type SearchParams } from '../../types';
import ErrorAlert from '../common/ErrorAlert';
import Loading from '../common/Loading';
import GiftImage from '../GiftCard/GiftImage';

import './SearchPage.css';

/** Slider maximum; at the maximum no age filter is applied ("any age"). */
export const MAX_AGE = 10;

interface Filters {
  name: string;
  category: string;
  condition: string;
  age: number;
}

function filtersFromUrl(params: URLSearchParams): Filters {
  const age = Number(params.get('age_years'));
  return {
    name: params.get('name') ?? '',
    category: params.get('category') ?? '',
    condition: params.get('condition') ?? '',
    age: params.has('age_years') && age >= 0 && age < MAX_AGE ? age : MAX_AGE,
  };
}

function toSearchParams(filters: Filters): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.name.trim()) params.name = filters.name.trim();
  if (filters.category) params.category = filters.category;
  if (filters.condition) params.condition = filters.condition;
  if (filters.age < MAX_AGE) params.age_years = String(filters.age);
  return params;
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [form, setForm] = useState<Filters>(() => filtersFromUrl(searchParams));

  // Re-fetch whenever the applied (URL) filters change.
  const query = searchParams.toString();
  const fetchResults = useCallback(
    (signal: AbortSignal) => {
      const applied = filtersFromUrl(new URLSearchParams(query));
      const params: SearchParams = {
        name: applied.name,
        category: applied.category as SearchParams['category'],
        condition: applied.condition as SearchParams['condition'],
        age_years: applied.age < MAX_AGE ? applied.age : undefined,
      };
      return api.searchGifts(params, signal);
    },
    [query],
  );
  const { data: results, error, loading, reload } = useFetch(fetchResults);

  const update = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSearchParams(toSearchParams(form));
  };

  const handleReset = () => {
    const cleared = filtersFromUrl(new URLSearchParams());
    setForm(cleared);
    setSearchParams({});
  };

  return (
    <section className="container py-4" aria-labelledby="search-title">
      <h1 id="search-title" className="h2 mb-3">
        Find a gift
      </h1>

      <Row className="g-4">
        <Col lg={4}>
          <Form
            className="filter-section p-3"
            onSubmit={handleSubmit}
            role="search"
            aria-label="Gift filters"
          >
            <Form.Group className="mb-3" controlId="search-name">
              <Form.Label>Name</Form.Label>
              <Form.Control
                className="search-input"
                type="search"
                placeholder="e.g. desk, lamp…"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="search-category">
              <Form.Label>Category</Form.Label>
              <Form.Select
                className="dropdown-filter"
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
              >
                <option value="">All categories</option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3" controlId="search-condition">
              <Form.Label>Condition</Form.Label>
              <Form.Select
                className="dropdown-filter"
                value={form.condition}
                onChange={(e) => update('condition', e.target.value)}
              >
                <option value="">Any condition</option>
                {CONDITIONS.map((condition) => (
                  <option key={condition} value={condition}>
                    {condition}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3" controlId="search-age">
              <Form.Label>
                Maximum age:{' '}
                <output htmlFor="search-age" className="fw-semibold">
                  {form.age >= MAX_AGE ? 'any' : `${form.age} ${form.age === 1 ? 'year' : 'years'}`}
                </output>
              </Form.Label>
              <Form.Range
                className="age-range-slider"
                min={0}
                max={MAX_AGE}
                step={1}
                value={form.age}
                onChange={(e) => update('age', Number(e.target.value))}
              />
            </Form.Group>

            <div className="d-flex gap-2">
              <Button type="submit" className="search-button flex-grow-1">
                Search
              </Button>
              <Button type="button" variant="outline-secondary" onClick={handleReset}>
                Reset
              </Button>
            </div>
          </Form>
        </Col>

        <Col lg={8} aria-live="polite">
          {loading && <Loading label="Searching…" />}
          {error && <ErrorAlert message={error.message} onRetry={reload} />}
          {!loading && !error && results?.length === 0 && (
            <p className="text-center text-muted py-5">
              No gifts found, please revise your filters.
            </p>
          )}
          {!loading && !error && results && results.length > 0 && (
            <>
              <p className="text-muted">
                {results.length} {results.length === 1 ? 'result' : 'results'}
              </p>
              <ul className="list-unstyled d-grid gap-3" aria-label="Search results">
                {results.map((gift) => (
                  <li key={gift.id}>
                    <Card className="search-results-card">
                      <Row className="g-0">
                        <Col sm={4}>
                          <GiftImage gift={gift} />
                        </Col>
                        <Col sm={8}>
                          <Card.Body>
                            <Card.Title as="h2" className="h5">
                              {gift.name}
                            </Card.Title>
                            <p className="small text-muted mb-1">
                              {gift.category} · {gift.condition} · {gift.age_years} yrs
                            </p>
                            <p className="description">{gift.description}</p>
                            <Link
                              to={`/app/product/${gift.id}`}
                              aria-label={`View details of ${gift.name}`}
                            >
                              View more
                            </Link>
                          </Card.Body>
                        </Col>
                      </Row>
                    </Card>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Col>
      </Row>
    </section>
  );
}
