import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="container stack center">
      <h1>Page not found</h1>
      <p className="muted">The page you asked for does not exist.</p>
      <p>
        <Link to="/">Back to the home page</Link>
      </p>
    </div>
  );
}
