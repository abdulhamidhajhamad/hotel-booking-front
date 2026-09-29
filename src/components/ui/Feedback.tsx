import type { ReactNode } from 'react';
import { problemMessage } from '@/lib/problem';

type Tone = 'error' | 'success' | 'info' | 'warning';

export function Alert({ tone = 'info', children }: { tone?: Tone; children: ReactNode }) {
  return <div className={`alert alert-${tone}`}>{children}</div>;
}

export function ErrorAlert({ error, fallback }: { error: unknown; fallback?: string }) {
  if (!error) return null;
  return <Alert tone="error">{problemMessage(error, fallback)}</Alert>;
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="loading-block">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function Empty({ children = 'Nothing to show yet.' }: { children?: ReactNode }) {
  return <div className="empty">{children}</div>;
}
