/**
 * Registration (spec 003, user story 1).
 */
import { useState, type FormEvent } from 'react';
import { Alert, Button, Card, Col, Form, Row } from 'react-bootstrap';
import { Link, Navigate, useNavigate } from 'react-router';

import { ApiError, api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  apiFieldErrors,
  compact,
  validateEmail,
  validatePassword,
  validateRequired,
  type FieldErrors,
} from '../../lib/validation';
import TextField from '../common/TextField';
import '../LoginPage/AuthPages.css';

const FIELDS = ['firstName', 'lastName', 'email', 'password'] as const;
type Field = (typeof FIELDS)[number];

export default function RegisterPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState<Record<Field, string>>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<FieldErrors<Field>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated && !submitting) return <Navigate to="/app" replace />;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const found = compact({
      firstName: validateRequired(values.firstName, 'First name'),
      lastName: validateRequired(values.lastName, 'Last name'),
      email: validateEmail(values.email),
      password: validatePassword(values.password, { checkStrength: true }),
    });
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      login(await api.register(values));
      void navigate('/app', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(apiFieldErrors(err.details, FIELDS));
        setFormError(err.message);
      } else {
        setFormError('Registration failed. Please try again.');
      }
      setSubmitting(false);
    }
  };

  const field = (name: Field) => ({
    value: values[name],
    error: errors[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setValues({ ...values, [name]: e.target.value }),
  });

  return (
    <Card className="auth-card">
      <Card.Body className="p-4">
        <h1 className="h3 text-center mb-4">Register</h1>
        {formError && <Alert variant="danger">{formError}</Alert>}
        <Form noValidate onSubmit={(e) => void handleSubmit(e)}>
          <Row className="g-3 mb-3">
            <Col sm={6}>
              <TextField
                id="register-first-name"
                label="First name"
                autoComplete="given-name"
                groupClassName=""
                {...field('firstName')}
              />
            </Col>
            <Col sm={6}>
              <TextField
                id="register-last-name"
                label="Last name"
                autoComplete="family-name"
                groupClassName=""
                {...field('lastName')}
              />
            </Col>
          </Row>
          <TextField
            id="register-email"
            label="Email"
            type="email"
            autoComplete="email"
            {...field('email')}
          />
          <TextField
            id="register-password"
            label="Password"
            type="password"
            autoComplete="new-password"
            help="At least 8 characters."
            groupClassName="mb-4"
            {...field('password')}
          />
          <Button type="submit" className="w-100" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Register'}
          </Button>
        </Form>
        <p className="text-center mt-3 mb-0">
          Already a member? <Link to="/app/login">Login</Link>
        </p>
      </Card.Body>
    </Card>
  );
}
