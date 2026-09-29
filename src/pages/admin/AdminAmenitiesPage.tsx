import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminAmenitiesApi, type AmenityInput } from '@/api/admin/amenities';
import type { Amenity } from '@/api/types';
import { AdminToolbar } from '@/components/admin/AdminToolbar';
import { Button } from '@/components/ui/Button';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Alert, ErrorAlert } from '@/components/ui/Feedback';
import { TextInput } from '@/components/ui/Field';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { dateTime } from '@/lib/format';

export function AdminAmenitiesPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Amenity | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Amenity | null>(null);
  const [form, setForm] = useState<AmenityInput>({ name: '', icon: '' });

  const { data, isPending, error } = useQuery({ queryKey: ['admin-amenities'], queryFn: adminAmenitiesApi.list });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin-amenities'] });
    void queryClient.invalidateQueries({ queryKey: ['amenities'] });
  };

  const save = useMutation({
    mutationFn: () => {
      const payload: AmenityInput = { ...form, icon: form.icon?.trim() || null };
      return editing === 'new'
        ? adminAmenitiesApi.create(payload)
        : adminAmenitiesApi.update((editing as Amenity).id, payload);
    },
    onSuccess: () => {
      invalidate();
      setEditing(null);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminAmenitiesApi.remove(id),
    onSuccess: () => {
      invalidate();
      setDeleting(null);
    },
  });

  const open = (amenity: Amenity | 'new') => {
    setEditing(amenity);
    setForm(amenity === 'new' ? { name: '', icon: '' } : { name: amenity.name, icon: amenity.icon ?? '' });
  };

  const columns: Column<Amenity>[] = [
    { header: 'Name', render: (amenity) => <strong>{amenity.name}</strong> },
    { header: 'Icon', render: (amenity) => amenity.icon ?? '—' },
    { header: 'Created', render: (amenity) => dateTime(amenity.createdAt) },
    { header: 'Modified', render: (amenity) => dateTime(amenity.updatedAt) },
    {
      header: '',
      render: (amenity) => (
        <Button
          size="sm"
          variant="danger"
          onClick={(event) => {
            event.stopPropagation();
            setDeleting(amenity);
          }}
        >
          Delete
        </Button>
      ),
    },
  ];

  return (
    <div className="stack">
      <AdminToolbar title="Amenities" createLabel="Create amenity" onCreate={() => open('new')} />

      <Alert tone="warning">
        The API has no endpoint that links an amenity to a hotel, so amenities created here can be filtered on only
        once the link rows exist in the database.
      </Alert>

      <ErrorAlert error={error} fallback="Could not load amenities." />

      <div className="card">
        <DataTable
          columns={columns}
          rows={data ?? []}
          rowKey={(amenity) => amenity.id}
          loading={isPending}
          onRowClick={open}
          emptyMessage="No amenities yet."
        />
      </div>

      {editing && (
        <Modal
          open
          title={editing === 'new' ? 'Create amenity' : `Edit ${editing.name}`}
          onClose={() => setEditing(null)}
          footer={
            <>
              <Button onClick={() => setEditing(null)}>Cancel</Button>
              <Button variant="primary" loading={save.isPending} onClick={() => save.mutate()}>
                Save
              </Button>
            </>
          }
        >
          <div className="stack">
            <TextInput
              label="Name"
              required
              maxLength={100}
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
            <TextInput
              label="Icon"
              maxLength={100}
              placeholder="🏊 or wifi"
              hint="Shown next to the amenity name on the hotel page."
              value={form.icon ?? ''}
              onChange={(event) => setForm((current) => ({ ...current, icon: event.target.value }))}
            />
            <ErrorAlert error={save.error} fallback="Could not save this amenity." />
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Delete amenity"
        message={`Delete ${deleting?.name}?`}
        loading={remove.isPending}
        error={remove.error}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
