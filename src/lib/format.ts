const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export const money = (value: number) => currencyFormatter.format(value);

export const shortDate = (value: string) => dateFormatter.format(new Date(value));

export const dateTime = (value: string | null | undefined) =>
  value ? dateTimeFormatter.format(new Date(value)) : '—';

export const percent = (value: number) => `${Math.round(value)}%`;

export const plural = (count: number, singular: string, pluralForm = `${singular}s`) =>
  `${count} ${count === 1 ? singular : pluralForm}`;
