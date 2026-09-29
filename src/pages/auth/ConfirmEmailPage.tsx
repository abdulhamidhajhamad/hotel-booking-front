import { useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { Alert, ErrorAlert, Loading } from '@/components/ui/Feedback';

function tokenFromUrl(hash: string, search: string): string {
  const fromHash = new URLSearchParams(hash.replace(/^#/, '')).get('token');
  return fromHash ?? new URLSearchParams(search).get('token') ?? '';
}

export function ConfirmEmailPage() {
  const location = useLocation();
  const token = tokenFromUrl(location.hash, location.search);
  const started = useRef(false);

  const confirm = useMutation({ mutationFn: (value: string) => authApi.confirmEmail(value) });

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    confirm.mutate(token);
  }, [token, confirm]);

  return (
    <div className="container" style={{ maxWidth: 480 }}>
      <div className="card">
        <div className="card-body stack">
          <h1>Email confirmation</h1>

          {!token && (
            <Alert tone="error">
              This link has no confirmation token. Open the link from your email again, or{' '}
              <Link to="/resend-confirmation">request a new one</Link>.
            </Alert>
          )}

          {token && confirm.isPending && <Loading label="Confirming your email…" />}

          {confirm.isSuccess && (
            <>
              <Alert tone="success">Your email is confirmed. You can sign in now.</Alert>
              <Link to="/login" className="btn btn-primary btn-block">
                Go to sign in
              </Link>
            </>
          )}

          {confirm.isError && (
            <>
              <ErrorAlert error={confirm.error} fallback="Could not confirm this email." />
              <Link to="/resend-confirmation" className="btn btn-block">
                Request a new link
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
