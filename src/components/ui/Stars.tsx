export function Stars({ value, max = 5 }: { value: number; max?: number }) {
  const filled = Math.max(0, Math.min(max, Math.round(value)));
  return (
    <span className="stars" title={`${filled} of ${max} stars`} aria-label={`${filled} of ${max} stars`}>
      {'★'.repeat(filled)}
      <span className="muted">{'★'.repeat(max - filled)}</span>
    </span>
  );
}
