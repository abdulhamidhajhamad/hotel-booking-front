import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminCitiesApi } from '@/api/admin/cities';
import { adminHotelsApi, type HotelInput } from '@/api/admin/hotels';
import { HotelCategory, hotelCategoryLabels, type HotelCategoryValue, type HotelGridItem } from '@/api/types';
import { AdminToolbar } from '@/components/admin/AdminToolbar';
import { HotelImagesManager } from '@/components/admin/HotelImagesManager';
import { Button } from '@/components/ui/Button';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { ErrorAlert } from '@/components/ui/Feedback';
import { SelectInput, TextArea, TextInput } from '@/components/ui/Field';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { Stars } from '@/components/ui/Stars';
import { dateTime } from '@/lib/format';
import { useDebouncedValue } from '@/lib/useDebouncedValue';

const PAGE_SIZE = 10;

const emptyHotel: HotelInput = {
  name: '',
  description: '',
  starRating: 3,
  category: HotelCategory.Standard,
  address: '',
  latitude: null,
  longitude: null,
  cityId: '',
  ownerName: '',
};

function useCityOptions() {
  return useQuery({
    queryKey: ['admin-cities-options'],
    queryFn: () => adminCitiesApi.list({ page: 1, pageSize: 100, sortBy: 'name' }),
    select: (result) => result.items,
  });
}

function HotelForm({ hotelId, onClose }: { hotelId: string | 'new'; onClose: () => void }) {
  const queryClient = useQueryClient();
  const isNew = hotelId === 'new';
  const { data: cities } = useCityOptions();

  const { data: hotel } = useQuery({
    queryKey: ['admin-hotel', hotelId],
    queryFn: () => adminHotelsApi.byId(hotelId),
    enabled: !isNew,
  });

  const [form, setForm] = useState<HotelInput>(emptyHotel);
  const [loadedId, setLoadedId] = useState<string | null>(null);

  if (hotel && loadedId !== hotel.id) {
    setLoadedId(hotel.id);
    setForm({
      name: hotel.name,
      description: hotel.description ?? '',
      starRating: hotel.starRating,
      category: hotel.category,
      address: hotel.address,
      latitude: hotel.latitude,
      longitude: hotel.longitude,
      cityId: hotel.cityId,
      ownerName: hotel.ownerName ?? '',
    });
  }

  const patch = (changes: Partial<HotelInput>) => setForm((current) => ({ ...current, ...changes }));

  const save = useMutation({
    mutationFn: () => {
      const payload: HotelInput = {
        ...form,
        description: form.description?.trim() || null,
        ownerName: form.ownerName?.trim() || null,
      };
      return isNew ? adminHotelsApi.create(payload) : adminHotelsApi.update(hotelId, payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-hotels'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-hotel', hotelId] });
      onClose();
    },
  });

  return (
    <Modal
      open
      title={isNew ? 'Create hotel' : `Edit ${hotel?.name ?? 'hotel'}`}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={save.isPending} onClick={() => save.mutate()}>
            {isNew ? 'Create hotel' : 'Save changes'}
          </Button>
        </>
      }
    >
      <div className="stack">
        <TextInput
          label="Name"
          required
          maxLength={200}
          value={form.name}
          onChange={(event) => patch({ name: event.target.value })}
        />

        <SelectInput
          label="City"
          required
          value={form.cityId}
          onChange={(event) => patch({ cityId: event.target.value })}
        >
          <option value="">Select a city…</option>
          {(cities ?? []).map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}, {city.country}
            </option>
          ))}
        </SelectInput>

        <div className="grid grid-2">
          <SelectInput
            label="Star rating"
            value={form.starRating}
            onChange={(event) => patch({ starRating: Number(event.target.value) })}
          >
            {[1, 2, 3, 4, 5].map((stars) => (
              <option key={stars} value={stars}>
                {stars} stars
              </option>
            ))}
          </SelectInput>

          <SelectInput
            label="Category"
            value={form.category}
            onChange={(event) => patch({ category: Number(event.target.value) as HotelCategoryValue })}
          >
            {Object.values(HotelCategory).map((value) => (
              <option key={value} value={value}>
                {hotelCategoryLabels[value]}
              </option>
            ))}
          </SelectInput>
        </div>

        <TextInput
          label="Address"
          required
          maxLength={300}
          value={form.address}
          onChange={(event) => patch({ address: event.target.value })}
        />

        <div className="grid grid-2">
          <TextInput
            label="Latitude"
            type="number"
            step="any"
            min={-90}
            max={90}
            value={form.latitude ?? ''}
            onChange={(event) => patch({ latitude: event.target.value === '' ? null : Number(event.target.value) })}
          />
          <TextInput
            label="Longitude"
            type="number"
            step="any"
            min={-180}
            max={180}
            value={form.longitude ?? ''}
            onChange={(event) => patch({ longitude: event.target.value === '' ? null : Number(event.target.value) })}
          />
        </div>

        <TextInput
          label="Owner"
          maxLength={200}
          value={form.ownerName ?? ''}
          onChange={(event) => patch({ ownerName: event.target.value })}
        />

        <TextArea
          label="Description"
          maxLength={2000}
          value={form.description ?? ''}
          onChange={(event) => patch({ description: event.target.value })}
        />

        <ErrorAlert error={save.error} fallback="Could not save this hotel." />

        {!isNew && <HotelImagesManager hotelId={hotelId} />}
      </div>
    </Modal>
  );
}

export function AdminHotelsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: cities } = useCityOptions();

  const [search, setSearch] = useState('');
  const [cityId, setCityId] = useState('');
  const [minStar, setMinStar] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [deleting, setDeleting] = useState<HotelGridItem | null>(null);

  const debouncedSearch = useDebouncedValue(search);

  const { data, isPending, error } = useQuery({
    queryKey: ['admin-hotels', debouncedSearch, cityId, minStar, category, page],
    queryFn: () =>
      adminHotelsApi.list({
        search: debouncedSearch || undefined,
        cityId: cityId || undefined,
        minStar: minStar ? Number(minStar) : undefined,
        category: category ? (Number(category) as HotelCategoryValue) : undefined,
        page,
        pageSize: PAGE_SIZE,
        sortBy: 'name',
      }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminHotelsApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-hotels'] });
      setDeleting(null);
    },
  });

  const resetPage = () => setPage(1);

  const columns: Column<HotelGridItem>[] = [
    { header: 'Name', render: (hotel) => <strong>{hotel.name}</strong> },
    { header: 'Star rate', render: (hotel) => <Stars value={hotel.starRating} /> },
    { header: 'Category', render: (hotel) => hotelCategoryLabels[hotel.category] },
    { header: 'City', render: (hotel) => hotel.cityName },
    { header: 'Owner', render: (hotel) => hotel.ownerName ?? '—' },
    { header: 'Rooms', render: (hotel) => hotel.numberOfRooms },
    { header: 'Created', render: (hotel) => dateTime(hotel.createdAt) },
    { header: 'Modified', render: (hotel) => dateTime(hotel.updatedAt) },
    {
      header: '',
      render: (hotel) => (
        <div className="row">
          <Button
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              navigate(`/admin/hotels/${hotel.id}/rooms`);
            }}
          >
            Rooms
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={(event) => {
              event.stopPropagation();
              setDeleting(hotel);
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="stack">
      <AdminToolbar
        title="Hotels"
        search={{
          value: search,
          placeholder: 'Filter by hotel name…',
          onChange: (value) => {
            setSearch(value);
            resetPage();
          },
        }}
        filters={
          <>
            <select
              className="select"
              style={{ maxWidth: 200 }}
              value={cityId}
              onChange={(event) => {
                setCityId(event.target.value);
                resetPage();
              }}
            >
              <option value="">All cities</option>
              {(cities ?? []).map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>

            <select
              className="select"
              style={{ maxWidth: 160 }}
              value={minStar}
              onChange={(event) => {
                setMinStar(event.target.value);
                resetPage();
              }}
            >
              <option value="">Any rating</option>
              {[5, 4, 3, 2, 1].map((stars) => (
                <option key={stars} value={stars}>
                  {stars} stars and up
                </option>
              ))}
            </select>

            <select
              className="select"
              style={{ maxWidth: 160 }}
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                resetPage();
              }}
            >
              <option value="">All categories</option>
              {Object.values(HotelCategory).map((value) => (
                <option key={value} value={value}>
                  {hotelCategoryLabels[value]}
                </option>
              ))}
            </select>
          </>
        }
        createLabel="Create hotel"
        onCreate={() => setEditing('new')}
      />

      <ErrorAlert error={error} fallback="Could not load hotels." />

      <div className="card">
        <DataTable
          columns={columns}
          rows={data?.items ?? []}
          rowKey={(hotel) => hotel.id}
          loading={isPending}
          onRowClick={(hotel) => setEditing(hotel.id)}
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

      {editing && <HotelForm hotelId={editing} onClose={() => setEditing(null)} />}

      <ConfirmDialog
        open={!!deleting}
        title="Delete hotel"
        message={`Delete ${deleting?.name}? Hotels with active bookings cannot be deleted.`}
        loading={remove.isPending}
        error={remove.error}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
