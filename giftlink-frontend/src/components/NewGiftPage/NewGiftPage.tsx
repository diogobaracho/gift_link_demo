/**
 * "Give an item away" form (spec 004, user story 3).
 */
import { useState, type FormEvent } from 'react';
import { Alert, Button, Card, Col, Form, Row } from 'react-bootstrap';
import { useNavigate } from 'react-router';

import { ApiError, api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { apiFieldErrors, compact, validateRequired, type FieldErrors } from '../../lib/validation';
import { CATEGORIES, CONDITIONS, type Category, type Condition, type NewGift } from '../../types';
import TextField from '../common/TextField';

const FIELDS = [
  'name',
  'category',
  'condition',
  'zipcode',
  'age_years',
  'description',
  'image',
] as const;
type Field = (typeof FIELDS)[number];
type Values = Record<Field, string>;

const IMAGE_PATTERN = /^(\/images\/[\w.-]+|https?:\/\/\S+)$/;

export function validateGift(values: Values): FieldErrors<Field> {
  const age = Number(values.age_years);
  return compact({
    name: validateRequired(values.name, 'Name', 80),
    category: values.category ? undefined : 'Choose a category',
    condition: values.condition ? undefined : 'Choose a condition',
    zipcode: /^\d{5}$/.test(values.zipcode.trim()) ? undefined : 'Enter a 5-digit zip code',
    age_years:
      values.age_years.trim() !== '' && Number.isFinite(age) && age >= 0 && age <= 100
        ? undefined
        : 'Enter an age between 0 and 100 years',
    description: validateRequired(values.description, 'Description', 2000),
    image:
      values.image.trim() === '' || IMAGE_PATTERN.test(values.image.trim())
        ? undefined
        : 'Use /images/<file> or an http(s) URL',
  });
}

export default function NewGiftPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState<Values>({
    name: '',
    category: '',
    condition: '',
    zipcode: '',
    age_years: '',
    description: '',
    image: '',
  });
  const [errors, setErrors] = useState<FieldErrors<Field>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!token) return null; // guarded by ProtectedRoute

  const set =
    (name: Field) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setValues({ ...values, [name]: e.target.value });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const found = validateGift(values);
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) return;

    const gift: NewGift = {
      name: values.name.trim(),
      category: values.category as Category,
      condition: values.condition as Condition,
      zipcode: values.zipcode.trim(),
      age_years: Number(values.age_years),
      description: values.description.trim(),
      ...(values.image.trim() && { image: values.image.trim() }),
    };

    setSubmitting(true);
    try {
      const created = await api.createGift(gift, token);
      void navigate(`/app/product/${created.id}`, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        void navigate('/app/login', { replace: true, state: { from: '/app/new' } });
        return;
      }
      if (err instanceof ApiError) setErrors(apiFieldErrors(err.details, FIELDS));
      setFormError(err instanceof ApiError ? err.message : 'Could not post your gift.');
      setSubmitting(false);
    }
  };

  return (
    <section className="container py-4" style={{ maxWidth: 760 }}>
      <Card className="product-card">
        <Card.Body className="p-4">
          <h1 className="h3 mb-1">Give an item away</h1>
          <p className="text-muted">Someone nearby will love it. It only takes a minute.</p>
          {formError && <Alert variant="danger">{formError}</Alert>}

          <Form noValidate onSubmit={(e) => void handleSubmit(e)}>
            <TextField
              id="gift-name"
              label="Name"
              value={values.name}
              onChange={set('name')}
              error={errors.name}
            />

            <Row className="g-3 mb-3">
              <Col sm={6}>
                <Form.Group controlId="gift-category">
                  <Form.Label>Category</Form.Label>
                  <Form.Select
                    value={values.category}
                    onChange={set('category')}
                    isInvalid={Boolean(errors.category)}
                    aria-invalid={errors.category ? true : undefined}
                  >
                    <option value="">Choose…</option>
                    {CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{errors.category}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group controlId="gift-condition">
                  <Form.Label>Condition</Form.Label>
                  <Form.Select
                    value={values.condition}
                    onChange={set('condition')}
                    isInvalid={Boolean(errors.condition)}
                    aria-invalid={errors.condition ? true : undefined}
                  >
                    <option value="">Choose…</option>
                    {CONDITIONS.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{errors.condition}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3 mb-3">
              <Col sm={6}>
                <TextField
                  id="gift-zipcode"
                  label="Zip code"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  groupClassName=""
                  value={values.zipcode}
                  onChange={set('zipcode')}
                  error={errors.zipcode}
                />
              </Col>
              <Col sm={6}>
                <TextField
                  id="gift-age"
                  label="Age (years)"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  groupClassName=""
                  value={values.age_years}
                  onChange={set('age_years')}
                  error={errors.age_years}
                />
              </Col>
            </Row>

            <TextField
              id="gift-description"
              label="Description"
              as="textarea"
              rows={4}
              maxLength={2000}
              value={values.description}
              onChange={set('description')}
              error={errors.description}
            />
            <TextField
              id="gift-image"
              label="Image URL (optional)"
              help="e.g. /images/lamp.jpeg or https://…"
              value={values.image}
              onChange={set('image')}
              error={errors.image}
            />

            <Button type="submit" disabled={submitting}>
              {submitting ? 'Posting…' : 'Post gift'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </section>
  );
}
