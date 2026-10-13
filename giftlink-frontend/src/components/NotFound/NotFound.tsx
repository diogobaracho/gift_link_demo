import { Link } from 'react-router';

/** Fallback for unknown URLs (spec 002, user story 3). */
export default function NotFound() {
  return (
    <section className="container text-center py-5">
      <h1 className="display-6">Page not found</h1>
      <p className="text-muted">The page you are looking for does not exist or was moved.</p>
      <Link to="/app" className="btn btn-primary d-inline-block w-auto">
        Browse gifts
      </Link>
    </section>
  );
}
