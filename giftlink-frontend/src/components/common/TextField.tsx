/**
 * Labelled form control with accessible validation.
 *
 * React Bootstrap's `isInvalid` only adds a CSS class. Screen readers also need
 * `aria-invalid` and an `aria-describedby` link to the error and help text, so they can
 * announce why a field is rejected.
 */
import type { ComponentProps } from 'react';
import { Form } from 'react-bootstrap';

type ControlProps = Omit<ComponentProps<typeof Form.Control>, 'id' | 'isInvalid'>;

interface Props extends ControlProps {
  id: string;
  label: string;
  error?: string | undefined;
  help?: string;
  groupClassName?: string;
}

export default function TextField({
  id,
  label,
  error,
  help,
  groupClassName = 'mb-3',
  ...control
}: Props) {
  const describedBy = [help && `${id}-help`, error && `${id}-error`].filter(Boolean).join(' ');

  return (
    <Form.Group className={groupClassName} controlId={id}>
      <Form.Label>{label}</Form.Label>
      <Form.Control
        {...control}
        isInvalid={Boolean(error)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
      />
      {help && (
        <Form.Text id={`${id}-help`} muted>
          {help}
        </Form.Text>
      )}
      <Form.Control.Feedback type="invalid" id={`${id}-error`}>
        {error}
      </Form.Control.Feedback>
    </Form.Group>
  );
}
