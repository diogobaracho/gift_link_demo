/**
 * Login (spec 003, user story 2).
 */
import { useState, type FormEvent } from 'react';
import { Alert, Button, Card, Form } from 'react-bootstrap';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';

import { ApiError, api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { compact, validateEmail, validatePassword, type FieldErrors } from '../../lib/validation';
import TextField from '../common/TextField';

import './AuthPages.css';

type Field = 'email' | 'password';

/**
 * Where to go after login: back to the page that required it, or the gift list.
 * Only same-site absolute paths are accepted. `//host` (protocol-relative) and full URLs
 * are rejected to avoid an open redirect.
 */
function redirectTarget(state: unknown): string {
  const from = (state as { from?: unknown } | null)?.from;
  return typeof from === 'string' && /^\/(?!\/)/.test(from) ? from : '/app';
}

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<FieldErrors<Field>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated && !submitting) return <Navigate to="/app" replace />;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const found = compact({
      email: validateEmail(values.email),
      password: validatePassword(values.password),
    });
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      login(await api.login(values));
      void navigate(redirectTarget(location.state), { replace: true });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Login failed. Please try again.');
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
        <h1 className="h3 text-center mb-4">Login</h1>
        {formError && <Alert variant="danger">{formError}</Alert>}
        <Form noValidate onSubmit={(e) => void handleSubmit(e)}>
          <TextField
            id="login-email"
            label="Email"
            type="email"
            autoComplete="email"
            {...field('email')}
          />
          <TextField
            id="login-password"
            label="Password"
            type="password"
            autoComplete="current-password"
            groupClassName="mb-4"
            {...field('password')}
          />
          <Button type="submit" className="w-100" disabled={submitting}>
            {submitting ? 'Logging in…' : 'Login'}
          </Button>
        </Form>
        <p className="text-center mt-3 mb-0">
          New here? <Link to="/app/register">Create an account</Link>
        </p>
      </Card.Body>
    </Card>
  );
}
