import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { Button } from '@/components/ui/Button';
import { Alert, ErrorAlert } from '@/components/ui/Feedback';
import { TextInput } from '@/components/ui/Field';

const USERNAME_PATTERN = /^[a-zA-Z0-9._-]+$/;

function passwordProblem(password: string): string | undefined {
  if (password.length < 8) return 'At least 8 characters.';
  if (!/[A-Z]/.test(password)) return 'Add an uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Add a lowercase letter.';
  if (!/[0-9]/.test(password)) return 'Add a digit.';
  return undefined;
}

function userNameProblem(userName: string): string | undefined {
  if (userName.length < 3) return 'At least 3 characters.';
  if (userName.length > 32) return 'At most 32 characters.';
  if (!USERNAME_PATTERN.test(userName)) return 'Only letters, digits, dot, underscore or hyphen.';
  return undefined;
}

export function RegisterPage() {
  const [email, setEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState(false);

  const register = useMutation({
    mutationFn: () => authApi.register(email.trim(), userName.trim(), password),
  });

  const userNameError = touched ? userNameProblem(userName.trim()) : undefined;
  const passwordError = touched ? passwordProblem(password) : undefined;
  const canSubmit = !userNameProblem(userName.trim()) && !passwordProblem(password) && !!email.trim();

  if (register.isSuccess) {
    return (
      <div className="container" style={{ maxWidth: 480 }}>
        <div className="card">
          <div className="card-body stack">
            <h1>Check your inbox</h1>
            <Alert tone="success">
              Account created for {register.data.email}. Open the confirmation link we emailed you, then sign in.
            </Alert>
            <span className="small muted">
              Nothing arrived? <Link to="/resend-confirmation">Resend the confirmation email</Link>.
            </span>
            <Link to="/login" className="btn btn-primary btn-block">
              Go to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 480 }}>
      <form
        className="card"
        onSubmit={(event) => {
          event.preventDefault();
          setTouched(true);
          if (canSubmit) register.mutate();
        }}
      >
        <div className="card-body stack">
          <h1>Create account</h1>

          <TextInput
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <TextInput
            label="Username"
            autoComplete="username"
            required
            value={userName}
            error={userNameError}
            onChange={(event) => setUserName(event.target.value)}
          />

          <TextInput
            label="Password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            error={passwordError}
            hint="At least 8 characters with an uppercase letter, a lowercase letter and a digit."
            onChange={(event) => setPassword(event.target.value)}
          />

          <ErrorAlert error={register.error} fallback="Could not create the account." />

          <Button type="submit" variant="primary" block loading={register.isPending}>
            Create account
          </Button>

          <span className="small muted center">
            Already registered? <Link to="/login">Sign in</Link>
          </span>
        </div>
      </form>
    </div>
  );
}
