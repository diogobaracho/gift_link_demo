import { Spinner } from 'react-bootstrap';

/** Accessible loading indicator: announced by screen readers through role="status". */
export default function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="d-flex justify-content-center py-5" role="status" aria-live="polite">
      <Spinner animation="border" variant="primary" aria-hidden="true" />
      <span className="visually-hidden">{label}</span>
    </div>
  );
}
