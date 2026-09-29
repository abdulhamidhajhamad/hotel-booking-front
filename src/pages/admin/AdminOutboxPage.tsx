import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminOutboxApi } from '@/api/admin/outbox';
import type { OutboxDeadLetter } from '@/api/types';
import { AdminToolbar } from '@/components/admin/AdminToolbar';
import { Button } from '@/components/ui/Button';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Alert, ErrorAlert } from '@/components/ui/Feedback';
import { dateTime } from '@/lib/format';

export function AdminOutboxPage() {
  const queryClient = useQueryClient();

  const { data, isPending, error } = useQuery({
    queryKey: ['admin-outbox'],
    queryFn: () => adminOutboxApi.deadLetters(0, 20),
  });

  const requeue = useMutation({
    mutationFn: (id: string) => adminOutboxApi.requeue(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-outbox'] }),
  });

  const columns: Column<OutboxDeadLetter>[] = [
    { header: 'Event', render: (message) => <strong>{message.type}</strong> },
    { header: 'Occurred', render: (message) => dateTime(message.occurredAtUtc) },
    { header: 'Attempts', render: (message) => message.attemptCount },
    { header: 'Last error', render: (message) => <span className="small">{message.lastError ?? '—'}</span> },
    {
      header: '',
      render: (message) => (
        <Button size="sm" loading={requeue.isPending} onClick={() => requeue.mutate(message.id)}>
          Requeue
        </Button>
      ),
    },
  ];

  return (
    <div className="stack">
      <AdminToolbar title="Outbox dead letters" />

      <Alert tone="info">
        Emails and other post-commit side effects run through the outbox. Messages that exhausted their retries land
        here and can be requeued.
      </Alert>

      <ErrorAlert error={error} fallback="Could not load the dead letters." />
      <ErrorAlert error={requeue.error} fallback="Could not requeue this message." />

      <div className="card">
        <DataTable
          columns={columns}
          rows={data ?? []}
          rowKey={(message) => message.id}
          loading={isPending}
          emptyMessage="No dead letters — every outbox message went through."
        />
      </div>
    </div>
  );
}
