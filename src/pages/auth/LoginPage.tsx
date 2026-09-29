import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Alert, ErrorAlert } from '@/components/ui/Feedback';
import { TextInput } from '@/components/ui/Field';
import { useAuth } from '@/features/auth/AuthContext';
import { problemCode } from '@/lib/problem';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const signIn = useMutation({
    mutationFn: () => login(email.trim(), password),
    onSuccess: () => navigate(redirectTo, { replace: true }),
  });

  const needsConfirmation = problemCode(signIn.error) === 'Auth.EmailNotConfirmed';

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <form
        className="card"
        onSubmit={(event) => {
          event.preventDefault();
          signIn.mutate();
        }}
      >
        <div className="card-body stack">
          <h1>Sign in</h1>

          <TextInput
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <TextInput
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <ErrorAlert error={signIn.error} fallback="Could not sign you in." />

          {needsConfirmation && (
            <Alert tone="warning">
              <Link to="/resend-confirmation">Resend the confirmation email</Link>
            </Alert>
          )}

          <Button type="submit" variant="primary" block loading={signIn.isPending}>
            Sign in
          </Button>

          <span className="small muted center">
            No account yet? <Link to="/register">Create one</Link>
          </span>
        </div>
      </form>
    </div>
  );
}
