import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';

interface AdminToolbarProps {
  title: string;
  search?: { value: string; placeholder: string; onChange: (value: string) => void };
  filters?: ReactNode;
  createLabel?: string;
  onCreate?: () => void;
}

export function AdminToolbar({ title, search, filters, createLabel, onCreate }: AdminToolbarProps) {
  return (
    <div className="stack">
      <div className="row-between">
        <h1>{title}</h1>
        {onCreate && (
          <Button variant="primary" onClick={onCreate}>
            {createLabel ?? 'Create'}
          </Button>
        )}
      </div>

      {(search || filters) && (
        <div className="row row-wrap">
          {search && (
            <input
              className="input"
              style={{ maxWidth: 280 }}
              placeholder={search.placeholder}
              value={search.value}
              onChange={(event) => search.onChange(event.target.value)}
            />
          )}
          {filters}
        </div>
      )}
    </div>
  );
}
