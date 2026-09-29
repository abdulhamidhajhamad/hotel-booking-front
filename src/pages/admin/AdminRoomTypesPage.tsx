import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminRoomTypesApi, type RoomTypeInput } from '@/api/admin/roomTypes';
import type { RoomType } from '@/api/types';
import { AdminToolbar } from '@/components/admin/AdminToolbar';
import { Button } from '@/components/ui/Button';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { ErrorAlert } from '@/components/ui/Feedback';
import { TextArea, TextInput } from '@/components/ui/Field';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { dateTime } from '@/lib/format';

export function AdminRoomTypesPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<RoomType | 'new' | null>(null);
  const [deleting, setDeleting] = useState<RoomType | null>(null);
  const [form, setForm] = useState<RoomTypeInput>({ name: '', description: '' });

  const { data, isPending, error } = useQuery({ queryKey: ['admin-room-types'], queryFn: adminRoomTypesApi.list });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-room-types'] });

  const save = useMutation({
    mutationFn: () => {
      const payload: RoomTypeInput = { ...form, description: form.description?.trim() || null };
      return editing === 'new'
        ? adminRoomTypesApi.create(payload)
        : adminRoomTypesApi.update((editing as RoomType).id, payload);
    },
    onSuccess: () => {
      void invalidate();
      setEditing(null);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminRoomTypesApi.remove(id),
    onSuccess: () => {
      void invalidate();
      setDeleting(null);
    },
  });

  const open = (roomType: RoomType | 'new') => {
    setEditing(roomType);
    setForm(
      roomType === 'new'
        ? { name: '', description: '' }
        : { name: roomType.name, description: roomType.description ?? '' },
    );
  };

  const columns: Column<RoomType>[] = [
    { header: 'Name', render: (roomType) => <strong>{roomType.name}</strong> },
    { header: 'Description', render: (roomType) => roomType.description ?? '—' },
    { header: 'Rooms', render: (roomType) => roomType.numberOfRooms },
    { header: 'Created', render: (roomType) => dateTime(roomType.createdAt) },
    { header: 'Modified', render: (roomType) => dateTime(roomType.updatedAt) },
    {
      header: '',
      render: (roomType) => (
        <Button
          size="sm"
          variant="danger"
          onClick={(event) => {
            event.stopPropagation();
            setDeleting(roomType);
          }}
        >
          Delete
        </Button>
      ),
    },
  ];

  return (
    <div className="stack">
      <AdminToolbar title="Room types" createLabel="Create room type" onCreate={() => open('new')} />

      <ErrorAlert error={error} fallback="Could not load room types." />

      <div className="card">
        <DataTable
          columns={columns}
          rows={data ?? []}
          rowKey={(roomType) => roomType.id}
          loading={isPending}
          onRowClick={open}
          emptyMessage="No room types yet. Create one before adding rooms."
        />
      </div>

      {editing && (
        <Modal
          open
          title={editing === 'new' ? 'Create room type' : `Edit ${editing.name}`}
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
              maxLength={50}
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
            <TextArea
              label="Description"
              maxLength={500}
              value={form.description ?? ''}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            />
            <ErrorAlert error={save.error} fallback="Could not save this room type." />
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Delete room type"
        message={`Delete ${deleting?.name}? Room types still used by rooms cannot be deleted.`}
        loading={remove.isPending}
        error={remove.error}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
