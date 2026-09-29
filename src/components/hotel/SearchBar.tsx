import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Feedback';
import { Field } from '@/components/ui/Field';
import { addDays } from '@/lib/dates';
import { validateCriteria, type SearchCriteria } from '@/features/search/criteria';

interface SearchBarProps {
  value: SearchCriteria;
  onSubmit: (criteria: SearchCriteria) => void;
  submitLabel?: string;
}

export function SearchBar({ value, onSubmit, submitLabel = 'Search' }: SearchBarProps) {
  const [criteria, setCriteria] = useState(value);
  const [error, setError] = useState<string | null>(null);

  const patch = (changes: Partial<SearchCriteria>) => setCriteria((current) => ({ ...current, ...changes }));

  const onCheckInChange = (checkIn: string) => {
    patch({
      checkIn,
      checkOut: new Date(criteria.checkOut) <= new Date(checkIn) ? addDays(checkIn, 1) : criteria.checkOut,
    });
  };

  const submit = () => {
    const problem = validateCriteria(criteria);
    setError(problem);
    if (!problem) onSubmit(criteria);
  };

  return (
    <div className="stack-sm">
      <form
        className="search-bar"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <Field label="Destination">
          <input
            className="input"
            placeholder="Search for hotels, cities..."
            value={criteria.query}
            onChange={(event) => patch({ query: event.target.value })}
          />
        </Field>

        <Field label="Check-in">
          <input
            className="input"
            type="date"
            value={criteria.checkIn}
            onChange={(event) => onCheckInChange(event.target.value)}
          />
        </Field>

        <Field label="Check-out">
          <input
            className="input"
            type="date"
            min={addDays(criteria.checkIn, 1)}
            value={criteria.checkOut}
            onChange={(event) => patch({ checkOut: event.target.value })}
          />
        </Field>

        <div className="guests">
          <Field label="Adults">
            <input
              className="input"
              type="number"
              min={1}
              value={criteria.adults}
              onChange={(event) => patch({ adults: Number(event.target.value) })}
            />
          </Field>
          <Field label="Children">
            <input
              className="input"
              type="number"
              min={0}
              value={criteria.children}
              onChange={(event) => patch({ children: Number(event.target.value) })}
            />
          </Field>
          <Field label="Rooms">
            <input
              className="input"
              type="number"
              min={1}
              value={criteria.rooms}
              onChange={(event) => patch({ rooms: Number(event.target.value) })}
            />
          </Field>
        </div>

        <Button type="submit" variant="primary">
          {submitLabel}
        </Button>
      </form>

      {error && <Alert tone="error">{error}</Alert>}
    </div>
  );
}
