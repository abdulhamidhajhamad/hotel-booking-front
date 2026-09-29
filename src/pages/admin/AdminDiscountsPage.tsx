import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminDiscountsApi, type DiscountInput } from '@/api/admin/discounts';
import { adminHotelsApi } from '@/api/admin/hotels';
import { adminRoomsApi } from '@/api/admin/rooms';
import type { Discount } from '@/api/types';
import { AdminToolbar } from '@/components/admin/AdminToolbar';
import { Button } from '@/components/ui/Button';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { ErrorAlert } from '@/components/ui/Feedback';
import { SelectInput, TextInput } from '@/components/ui/Field';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { dateTime, percent } from '@/lib/format';

const PAGE_SIZE = 10;

function useHotelOptions() {
  return useQuery({
    queryKey: ['admin-hotels-options'],
    queryFn: () => adminHotelsApi.list({ page: 1, pageSize: 100, sortBy: 'name' }),
    select: (result) => result.items,
  });
}

function DiscountForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: hotels } = useHotelOptions();
  const [hotelId, setHotelId] = useState('');
  const [form, setForm] = useState<DiscountInput>({
    roomId: '',
    percentage: 10,
    startUtc: '',
    endUtc: '',
    title: '',
  });

  const { data: rooms } = useQuery({
    queryKey: ['admin-rooms-options', hotelId],
    queryFn: () => adminRoomsApi.list(hotelId, { page: 1, pageSize: 100, sortBy: 'number' }),
    select: (result) => result.items,
    enabled: !!hotelId,
  });

  const patch = (changes: Partial<DiscountInput>) => setForm((current) => ({ ...current, ...changes }));

  const save = useMutation({
    mutationFn: () =>
      adminDiscountsApi.create({
        ...form,
        title: form.title?.trim() || null,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-discounts'] });
      void queryClient.invalidateQueries({ queryKey: ['featured-deals'] });
      onClose();
    },
  });

  return (
    <Modal
      open
      title="Create discount"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            loading={save.isPending}
            disabled={!form.roomId || !form.startUtc || !form.endUtc}
            onClick={() => save.mutate()}
          >
            Create discount
          </Button>
        </>
      }
    >
      <div className="stack">
        <SelectInput label="Hotel" value={hotelId} onChange={(event) => { setHotelId(event.target.value); patch({ roomId: '' }); }}>
          <option value="">Select a hotel…</option>
          {(hotels ?? []).map((hotel) => (
            <option key={hotel.id} value={hotel.id}>
              {hotel.name}
            </option>
          ))}
        </SelectInput>

        <SelectInput
          label="Room"
          value={form.roomId}
          disabled={!hotelId}
          onChange={(event) => patch({ roomId: event.target.value })}
        >
          <option value="">Select a room…</option>
          {(rooms ?? []).map((room) => (
            <option key={room.id} value={room.id}>
              Room {room.number} · {room.roomTypeName}
            </option>
          ))}
        </SelectInput>

        <TextInput
          label="Percentage"
          type="number"
          min={1}
          max={100}
          step="0.01"
          value={form.percentage}
          onChange={(event) => patch({ percentage: Number(event.target.value) })}
        />

        <div className="grid grid-2">
          <TextInput
            label="Starts (UTC)"
            type="datetime-local"
            value={form.startUtc}
            onChange={(event) => patch({ startUtc: event.target.value })}
          />
          <TextInput
            label="Ends (UTC)"
            type="datetime-local"
            value={form.endUtc}
            onChange={(event) => patch({ endUtc: event.target.value })}
          />
        </div>

        <TextInput
          label="Title"
          maxLength={200}
          placeholder="Autumn sale"
          value={form.title ?? ''}
          onChange={(event) => patch({ title: event.target.value })}
        />

        <ErrorAlert error={save.error} fallback="Could not create this discount." />
      </div>
    </Modal>
  );
}

export function AdminDiscountsPage() {
  const queryClient = useQueryClient();
  const { data: hotels } = useHotelOptions();

  const [hotelId, setHotelId] = useState('');
  const [activeOnly, setActiveOnly] = useState('');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Discount | null>(null);

  const { data, isPending, error } = useQuery({
    queryKey: ['admin-discounts', hotelId, activeOnly, page],
    queryFn: () =>
      adminDiscountsApi.list({
        hotelId: hotelId || undefined,
        activeOnly: activeOnly === '' ? undefined : activeOnly === 'true',
        page,
        pageSize: PAGE_SIZE,
      }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminDiscountsApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-discounts'] });
      void queryClient.invalidateQueries({ queryKey: ['featured-deals'] });
      setDeleting(null);
    },
  });

  const columns: Column<Discount>[] = [
    { header: 'Hotel', render: (discount) => <strong>{discount.hotelName}</strong> },
    { header: 'Room', render: (discount) => discount.roomNumber },
    { header: 'Title', render: (discount) => discount.title ?? '—' },
    { header: 'Percentage', render: (discount) => percent(discount.percentage) },
    { header: 'Starts', render: (discount) => dateTime(discount.startUtc) },
    { header: 'Ends', render: (discount) => dateTime(discount.endUtc) },
    {
      header: 'Status',
      render: (discount) => (
        <span className={`badge ${discount.isActive ? 'badge-success' : ''}`}>
          {discount.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: '',
      render: (discount) => (
        <Button size="sm" variant="danger" onClick={() => setDeleting(discount)}>
          Delete
        </Button>
      ),
    },
  ];

  return (
    <div className="stack">
      <AdminToolbar
        title="Discounts"
        filters={
          <>
            <select
              className="select"
              style={{ maxWidth: 220 }}
              value={hotelId}
              onChange={(event) => {
                setHotelId(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All hotels</option>
              {(hotels ?? []).map((hotel) => (
                <option key={hotel.id} value={hotel.id}>
                  {hotel.name}
                </option>
              ))}
            </select>

            <select
              className="select"
              style={{ maxWidth: 160 }}
              value={activeOnly}
              onChange={(event) => {
                setActiveOnly(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All discounts</option>
              <option value="true">Active only</option>
              <option value="false">Inactive only</option>
            </select>
          </>
        }
        createLabel="Create discount"
        onCreate={() => setCreating(true)}
      />

      <ErrorAlert error={error} fallback="Could not load discounts." />

      <div className="card">
        <DataTable
          columns={columns}
          rows={data?.items ?? []}
          rowKey={(discount) => discount.id}
          loading={isPending}
          emptyMessage="No discounts yet. Featured deals are built from active discounts."
        />
      </div>

      {data && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          totalCount={data.totalCount}
          onPageChange={setPage}
        />
      )}

      {creating && <DiscountForm onClose={() => setCreating(false)} />}

      <ConfirmDialog
        open={!!deleting}
        title="Delete discount"
        message={`Delete the ${deleting ? percent(deleting.percentage) : ''} discount on room ${deleting?.roomNumber}?`}
        loading={remove.isPending}
        error={remove.error}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
