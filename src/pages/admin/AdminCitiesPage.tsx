import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminCitiesApi, type CityInput } from '@/api/admin/cities';
import type { CityGridItem } from '@/api/types';
import { AdminImageUploader } from '@/components/admin/AdminImageUploader';
import { AdminToolbar } from '@/components/admin/AdminToolbar';
import { Button } from '@/components/ui/Button';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { ErrorAlert } from '@/components/ui/Feedback';
import { TextInput } from '@/components/ui/Field';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { dateTime } from '@/lib/format';
import { useDebouncedValue } from '@/lib/useDebouncedValue';

const PAGE_SIZE = 10;

const emptyCity: CityInput = { name: '', country: '', postalCode: '', timezone: 'UTC' };

function CityForm({
  cityId,
  onClose,
}: {
  cityId: string | 'new';
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const isNew = cityId === 'new';

  const { data: city } = useQuery({
    queryKey: ['admin-city', cityId],
    queryFn: () => adminCitiesApi.byId(cityId),
    enabled: !isNew,
  });

  const [form, setForm] = useState<CityInput>(emptyCity);
  const [loadedId, setLoadedId] = useState<string | null>(null);

  if (city && loadedId !== city.id) {
    setLoadedId(city.id);
    setForm({
      name: city.name,
      country: city.country,
      postalCode: city.postalCode ?? '',
      timezone: city.timezone,
    });
  }

  const patch = (changes: Partial<CityInput>) => setForm((current) => ({ ...current, ...changes }));

  const save = useMutation({
    mutationFn: () => {
      const payload: CityInput = { ...form, postalCode: form.postalCode?.trim() || null };
      return isNew ? adminCitiesApi.create(payload) : adminCitiesApi.update(cityId, payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-cities'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-city', cityId] });
      onClose();
    },
  });

  return (
    <Modal
      open
      title={isNew ? 'Create city' : `Edit ${city?.name ?? 'city'}`}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={save.isPending} onClick={() => save.mutate()}>
            {isNew ? 'Create city' : 'Save changes'}
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
          onChange={(event) => patch({ name: event.target.value })}
        />
        <TextInput
          label="Country"
          required
          maxLength={2}
          placeholder="JO"
          hint="Two-letter ISO country code."
          value={form.country}
          onChange={(event) => patch({ country: event.target.value.toUpperCase() })}
        />
        <TextInput
          label="Post office"
          maxLength={20}
          value={form.postalCode ?? ''}
          onChange={(event) => patch({ postalCode: event.target.value })}
        />
        <TextInput
          label="Timezone"
          required
          maxLength={64}
          placeholder="Asia/Amman"
          value={form.timezone}
          onChange={(event) => patch({ timezone: event.target.value })}
        />

        <ErrorAlert error={save.error} fallback="Could not save this city." />

        {!isNew && (
          <AdminImageUploader
            label="City images"
            upload={(files) => adminCitiesApi.uploadImages(cityId, files)}
            remove={(imageId) => adminCitiesApi.deleteImage(cityId, imageId)}
          />
        )}
      </div>
    </Modal>
  );
}

export function AdminCitiesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [deleting, setDeleting] = useState<CityGridItem | null>(null);

  const debouncedSearch = useDebouncedValue(search);

  const { data, isPending, error } = useQuery({
    queryKey: ['admin-cities', debouncedSearch, page],
    queryFn: () =>
      adminCitiesApi.list({
        search: debouncedSearch || undefined,
        page,
        pageSize: PAGE_SIZE,
        sortBy: 'name',
      }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminCitiesApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-cities'] });
      setDeleting(null);
    },
  });

  const columns: Column<CityGridItem>[] = [
    { header: 'Name', render: (city) => <strong>{city.name}</strong> },
    { header: 'Country', render: (city) => city.country },
    { header: 'Post office', render: (city) => city.postalCode ?? '—' },
    { header: 'Hotels', render: (city) => city.numberOfHotels },
    { header: 'Created', render: (city) => dateTime(city.createdAt) },
    { header: 'Modified', render: (city) => dateTime(city.updatedAt) },
    {
      header: '',
      render: (city) => (
        <Button
          size="sm"
          variant="danger"
          onClick={(event) => {
            event.stopPropagation();
            setDeleting(city);
          }}
        >
          Delete
        </Button>
      ),
    },
  ];

  return (
    <div className="stack">
      <AdminToolbar
        title="Cities"
        search={{ value: search, placeholder: 'Filter by name or country…', onChange: (value) => { setSearch(value); setPage(1); } }}
        createLabel="Create city"
        onCreate={() => setEditing('new')}
      />

      <ErrorAlert error={error} fallback="Could not load cities." />

      <div className="card">
        <DataTable
          columns={columns}
          rows={data?.items ?? []}
          rowKey={(city) => city.id}
          loading={isPending}
          onRowClick={(city) => setEditing(city.id)}
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

      {editing && <CityForm cityId={editing} onClose={() => setEditing(null)} />}

      <ConfirmDialog
        open={!!deleting}
        title="Delete city"
        message={`Delete ${deleting?.name}? Cities that still have hotels cannot be deleted.`}
        loading={remove.isPending}
        error={remove.error}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
