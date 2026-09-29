import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { adminHotelsApi } from '@/api/admin/hotels';
import { adminRoomsApi, type RoomInput } from '@/api/admin/rooms';
import { adminRoomTypesApi } from '@/api/admin/roomTypes';
import type { RoomGridItem } from '@/api/types';
import { AdminImageUploader } from '@/components/admin/AdminImageUploader';
import { AdminToolbar } from '@/components/admin/AdminToolbar';
import { Button } from '@/components/ui/Button';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { ErrorAlert } from '@/components/ui/Feedback';
import { SelectInput, TextInput } from '@/components/ui/Field';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { dateTime, money } from '@/lib/format';
import { useDebouncedValue } from '@/lib/useDebouncedValue';

const PAGE_SIZE = 10;

const emptyRoom: RoomInput = {
  roomTypeId: '',
  number: '',
  adultsCapacity: 2,
  childrenCapacity: 0,
  pricePerNight: 100,
  isActive: true,
};

function RoomForm({
  hotelId,
  roomId,
  onClose,
}: {
  hotelId: string;
  roomId: string | 'new';
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const isNew = roomId === 'new';

  const { data: roomTypes } = useQuery({ queryKey: ['admin-room-types'], queryFn: adminRoomTypesApi.list });

  const { data: room } = useQuery({
    queryKey: ['admin-room', hotelId, roomId],
    queryFn: () => adminRoomsApi.byId(hotelId, roomId),
    enabled: !isNew,
  });

  const [form, setForm] = useState<RoomInput>(emptyRoom);
  const [loadedId, setLoadedId] = useState<string | null>(null);

  if (room && loadedId !== room.id) {
    setLoadedId(room.id);
    setForm({
      roomTypeId: room.roomTypeId,
      number: room.number,
      adultsCapacity: room.adultsCapacity,
      childrenCapacity: room.childrenCapacity,
      pricePerNight: room.pricePerNight,
      isActive: room.isActive,
    });
  }

  const patch = (changes: Partial<RoomInput>) => setForm((current) => ({ ...current, ...changes }));

  const save = useMutation({
    mutationFn: () =>
      isNew ? adminRoomsApi.create(hotelId, form) : adminRoomsApi.update(hotelId, roomId, form),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-rooms', hotelId] });
      void queryClient.invalidateQueries({ queryKey: ['admin-room', hotelId, roomId] });
      onClose();
    },
  });

  return (
    <Modal
      open
      title={isNew ? 'Create room' : `Edit room ${room?.number ?? ''}`}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={save.isPending} onClick={() => save.mutate()}>
            {isNew ? 'Create room' : 'Save changes'}
          </Button>
        </>
      }
    >
      <div className="stack">
        <TextInput
          label="Number"
          required
          maxLength={20}
          value={form.number}
          onChange={(event) => patch({ number: event.target.value })}
        />

        <SelectInput
          label="Room type"
          required
          value={form.roomTypeId}
          onChange={(event) => patch({ roomTypeId: event.target.value })}
        >
          <option value="">Select a room type…</option>
          {(roomTypes ?? []).map((roomType) => (
            <option key={roomType.id} value={roomType.id}>
              {roomType.name}
            </option>
          ))}
        </SelectInput>

        <div className="grid grid-2">
          <TextInput
            label="Adults capacity"
            type="number"
            min={1}
            value={form.adultsCapacity}
            onChange={(event) => patch({ adultsCapacity: Number(event.target.value) })}
          />
          <TextInput
            label="Children capacity"
            type="number"
            min={0}
            value={form.childrenCapacity}
            onChange={(event) => patch({ childrenCapacity: Number(event.target.value) })}
          />
        </div>

        <TextInput
          label="Price per night"
          type="number"
          min={0}
          step="0.01"
          value={form.pricePerNight}
          onChange={(event) => patch({ pricePerNight: Number(event.target.value) })}
        />

        <label className="checkbox">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => patch({ isActive: event.target.checked })}
          />
          Available for booking
        </label>

        <ErrorAlert error={save.error} fallback="Could not save this room." />

        {!isNew && (
          <AdminImageUploader
            label="Room images"
            upload={(files) => adminRoomsApi.uploadImages(hotelId, roomId, files)}
            remove={(imageId) => adminRoomsApi.deleteImage(hotelId, roomId, imageId)}
          />
        )}
      </div>
    </Modal>
  );
}

export function AdminRoomsPage() {
  const { hotelId = '' } = useParams();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [roomTypeId, setRoomTypeId] = useState('');
  const [isActive, setIsActive] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [deleting, setDeleting] = useState<RoomGridItem | null>(null);

  const debouncedSearch = useDebouncedValue(search);

  const { data: hotel } = useQuery({
    queryKey: ['admin-hotel', hotelId],
    queryFn: () => adminHotelsApi.byId(hotelId),
  });

  const { data: roomTypes } = useQuery({ queryKey: ['admin-room-types'], queryFn: adminRoomTypesApi.list });

  const { data, isPending, error } = useQuery({
    queryKey: ['admin-rooms', hotelId, debouncedSearch, roomTypeId, isActive, page],
    queryFn: () =>
      adminRoomsApi.list(hotelId, {
        search: debouncedSearch || undefined,
        roomTypeId: roomTypeId || undefined,
        isActive: isActive === '' ? undefined : isActive === 'true',
        page,
        pageSize: PAGE_SIZE,
        sortBy: 'number',
      }),
  });

  const remove = useMutation({
    mutationFn: (roomId: string) => adminRoomsApi.remove(hotelId, roomId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-rooms', hotelId] });
      setDeleting(null);
    },
  });

  const columns: Column<RoomGridItem>[] = [
    { header: 'Number', render: (room) => <strong>{room.number}</strong> },
    { header: 'Type', render: (room) => room.roomTypeName },
    {
      header: 'Availability',
      render: (room) => (
        <span className={`badge ${room.isActive ? 'badge-success' : 'badge-danger'}`}>
          {room.isActive ? 'Available' : 'Unavailable'}
        </span>
      ),
    },
    { header: 'Adults', render: (room) => room.adultsCapacity },
    { header: 'Children', render: (room) => room.childrenCapacity },
    { header: 'Price', render: (room) => money(room.pricePerNight) },
    { header: 'Created', render: (room) => dateTime(room.createdAt) },
    { header: 'Modified', render: (room) => dateTime(room.updatedAt) },
    {
      header: '',
      render: (room) => (
        <Button
          size="sm"
          variant="danger"
          onClick={(event) => {
            event.stopPropagation();
            setDeleting(room);
          }}
        >
          Delete
        </Button>
      ),
    },
  ];

  return (
    <div className="stack">
      <Link to="/admin/hotels" className="small">
        ← Back to hotels
      </Link>

      <AdminToolbar
        title={hotel ? `Rooms · ${hotel.name}` : 'Rooms'}
        search={{
          value: search,
          placeholder: 'Filter by room number…',
          onChange: (value) => {
            setSearch(value);
            setPage(1);
          },
        }}
        filters={
          <>
            <select
              className="select"
              style={{ maxWidth: 200 }}
              value={roomTypeId}
              onChange={(event) => {
                setRoomTypeId(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All room types</option>
              {(roomTypes ?? []).map((roomType) => (
                <option key={roomType.id} value={roomType.id}>
                  {roomType.name}
                </option>
              ))}
            </select>

            <select
              className="select"
              style={{ maxWidth: 180 }}
              value={isActive}
              onChange={(event) => {
                setIsActive(event.target.value);
                setPage(1);
              }}
            >
              <option value="">Any availability</option>
              <option value="true">Available only</option>
              <option value="false">Unavailable only</option>
            </select>
          </>
        }
        createLabel="Create room"
        onCreate={() => setEditing('new')}
      />

      <ErrorAlert error={error} fallback="Could not load rooms." />

      <div className="card">
        <DataTable
          columns={columns}
          rows={data?.items ?? []}
          rowKey={(room) => room.id}
          loading={isPending}
          onRowClick={(room) => setEditing(room.id)}
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

      {editing && <RoomForm hotelId={hotelId} roomId={editing} onClose={() => setEditing(null)} />}

      <ConfirmDialog
        open={!!deleting}
        title="Delete room"
        message={`Delete room ${deleting?.number}? Rooms with bookings cannot be deleted.`}
        loading={remove.isPending}
        error={remove.error}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
