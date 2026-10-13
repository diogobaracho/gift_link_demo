import { Alert, Button } from 'react-bootstrap';

interface Props {
  message: string;
  onRetry?: () => void;
}

/** Error message with an optional retry action, instead of a blank page. */
export default function ErrorAlert({ message, onRetry }: Props) {
  return (
    <Alert variant="danger" className="d-flex align-items-center justify-content-between gap-3">
      <span>{message}</span>
      {onRetry && (
        <Button variant="outline-danger" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </Alert>
  );
}
