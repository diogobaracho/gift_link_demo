/**
 * Editable profile (spec 003, user story 3): completes the course Profile Tasks 1-5
 * (PUT /api/auth/update with the bearer token, then refresh the cached user).
 */
import { useState, type FormEvent } from 'react';
import { Alert, Button, Card, Col, Form, Row } from 'react-bootstrap';
import { useNavigate } from 'react-router';

import { ApiError, api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { compact, validateRequired, type FieldErrors } from '../../lib/validation';
import TextField from '../common/TextField';
import '../LoginPage/AuthPages.css';

type Field = 'firstName' | 'lastName';

export default function Profile() {
  const { user, token, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
  });
  const [errors, setErrors] = useState<FieldErrors<Field>>({});
  const [status, setStatus] = useState<{ variant: 'success' | 'danger'; message: string } | null>(
    null,
  );
  const [saving, setSaving] = useState(false);

  // ProtectedRoute guarantees a session; this keeps TypeScript (and refactors) honest.
  if (!user || !token) return null;

  const startEditing = () => {
    setValues({ firstName: user.firstName, lastName: user.lastName });
    setErrors({});
    setStatus(null);
    setEditing(true);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const found = compact({
      firstName: validateRequired(values.firstName, 'First name'),
      lastName: validateRequired(values.lastName, 'Last name'),
    });
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      const { user: updated } = await api.updateProfile(
        { firstName: values.firstName.trim(), lastName: values.lastName.trim() },
        token,
      );
      updateUser(updated);
      setEditing(false);
      setStatus({ variant: 'success', message: 'Profile updated!' });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        void navigate('/app/login', { replace: true });
        return;
      }
      setStatus({
        variant: 'danger',
        message: err instanceof ApiError ? err.message : 'Could not update your profile.',
      });
    } finally {
      setSaving(false);
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
        <h1 className="h3 mb-3">Hi, {user.firstName}</h1>
        {status && (
          <Alert variant={status.variant} role={status.variant === 'success' ? 'status' : 'alert'}>
            {status.message}
          </Alert>
        )}

        {editing ? (
          <Form noValidate onSubmit={(e) => void handleSubmit(e)}>
            <TextField
              id="profile-email"
              label="Email"
              type="email"
              value={user.email}
              disabled
              readOnly
            />
            <Row className="g-3 mb-3">
              <Col sm={6}>
                <TextField
                  id="profile-first-name"
                  label="First name"
                  groupClassName=""
                  {...field('firstName')}
                />
              </Col>
              <Col sm={6}>
                <TextField
                  id="profile-last-name"
                  label="Last name"
                  groupClassName=""
                  {...field('lastName')}
                />
              </Col>
            </Row>
            <div className="d-flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
              <Button
                variant="outline-secondary"
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </Form>
        ) : (
          <>
            <dl className="row mb-4">
              <dt className="col-4">Name</dt>
              <dd className="col-8">
                {user.firstName} {user.lastName}
              </dd>
              <dt className="col-4">Email</dt>
              <dd className="col-8">{user.email}</dd>
            </dl>
            <Button onClick={startEditing}>Edit profile</Button>
          </>
        )}
      </Card.Body>
    </Card>
  );
}
