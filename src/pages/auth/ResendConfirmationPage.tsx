import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { Button } from '@/components/ui/Button';
import { Alert, ErrorAlert } from '@/components/ui/Feedback';
import { TextInput } from '@/components/ui/Field';

export function ResendConfirmationPage() {
  const [email, setEmail] = useState('');

  const resend = useMutation({ mutationFn: () => authApi.resendConfirmation(email.trim()) });

  return (
    <div className="container" style={{ maxWidth: 440 }}>
      <form
        className="card"
        onSubmit={(event) => {
          event.preventDefault();
          resend.mutate();
        }}
      >
        <div className="card-body stack">
          <h1>Resend confirmation</h1>

          <TextInput
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          {resend.isSuccess && (
            <Alert tone="success">
              If that address needs confirming, a new link is on its way. Links can be requested every minute.
            </Alert>
          )}

          <ErrorAlert error={resend.error} fallback="Could not resend the confirmation email." />

          <Button type="submit" variant="primary" block loading={resend.isPending}>
            Send link
          </Button>

          <span className="small muted center">
            <Link to="/login">Back to sign in</Link>
          </span>
        </div>
      </form>
    </div>
  );
}
