import { useEffect, useMemo, useRef } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { hotelsApi } from '@/api/hotels';
import { plural } from '@/lib/format';
import { catalogApi } from '@/api/catalog';
import { HotelCategory, hotelCategoryLabels } from '@/api/types';
import { HotelListItem } from '@/components/hotel/HotelListItem';
import { SearchBar } from '@/components/hotel/SearchBar';
import { Button } from '@/components/ui/Button';
import { Empty, ErrorAlert, Loading } from '@/components/ui/Feedback';
import { Field, SelectInput } from '@/components/ui/Field';
import {
  criteriaFromParams,
  criteriaToParams,
  criteriaToQuery,
  defaultCriteria,
  type SearchCriteria,
} from '@/features/search/criteria';

const PAGE_SIZE = 10;

function Filters({
  criteria,
  onChange,
}: {
  criteria: SearchCriteria;
  onChange: (criteria: SearchCriteria) => void;
}) {
  const { data: amenities } = useQuery({ queryKey: ['amenities'], queryFn: catalogApi.amenities });

  const patch = (changes: Partial<SearchCriteria>) => onChange({ ...criteria, ...changes });

  const toggleAmenity = (id: string) =>
    patch({
      amenityIds: criteria.amenityIds.includes(id)
        ? criteria.amenityIds.filter((value) => value !== id)
        : [...criteria.amenityIds, id],
    });

  return (
    <aside className="filters card">
      <div className="card-body stack">
        <div className="row-between">
          <h3>Filters</h3>
          <Button size="sm" variant="ghost" onClick={() => onChange({ ...defaultCriteria(), query: criteria.query })}>
            Reset
          </Button>
        </div>

        <Field label="Price per night">
          <div className="row">
            <input
              className="input"
              type="number"
              min={0}
              placeholder="Min"
              value={criteria.minPrice}
              onChange={(event) => patch({ minPrice: event.target.value })}
            />
            <input
              className="input"
              type="number"
              min={0}
              placeholder="Max"
              value={criteria.maxPrice}
              onChange={(event) => patch({ maxPrice: event.target.value })}
            />
          </div>
        </Field>

        <SelectInput
          label="Star rating"
          value={criteria.minStar}
          onChange={(event) => patch({ minStar: event.target.value })}
        >
          <option value="">Any rating</option>
          {[5, 4, 3, 2, 1].map((stars) => (
            <option key={stars} value={stars}>
              {plural(stars, 'star')} and up
            </option>
          ))}
        </SelectInput>

        <SelectInput
          label="Hotel type"
          value={criteria.category}
          onChange={(event) => patch({ category: event.target.value })}
        >
          <option value="">All types</option>
          {Object.values(HotelCategory).map((value) => (
            <option key={value} value={value}>
              {hotelCategoryLabels[value]}
            </option>
          ))}
        </SelectInput>

        {amenities && amenities.length > 0 && (
          <Field label="Amenities">
            <div className="stack-sm">
              {amenities.map((amenity) => (
                <label key={amenity.id} className="checkbox">
                  <input
                    type="checkbox"
                    checked={criteria.amenityIds.includes(amenity.id)}
                    onChange={() => toggleAmenity(amenity.id)}
                  />
                  {amenity.name}
                </label>
              ))}
            </div>
          </Field>
        )}

        <SelectInput
          label="Sort by"
          value={`${criteria.sortBy}:${criteria.sortDesc}`}
          onChange={(event) => {
            const [sortBy, sortDesc] = event.target.value.split(':');
            patch({ sortBy: sortBy as SearchCriteria['sortBy'], sortDesc: sortDesc === 'true' });
          }}
        >
          <option value="name:false">Name (A–Z)</option>
          <option value="name:true">Name (Z–A)</option>
          <option value="price:false">Price (low to high)</option>
          <option value="price:true">Price (high to low)</option>
          <option value="starRating:true">Stars (high to low)</option>
          <option value="starRating:false">Stars (low to high)</option>
        </SelectInput>
      </div>
    </aside>
  );
}

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const criteria = useMemo(() => criteriaFromParams(params), [params]);
  const sentinel = useRef<HTMLDivElement>(null);

  const applyCriteria = (next: SearchCriteria) => setParams(criteriaToParams(next));

  const { data, isPending, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['hotel-search', params.toString()],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => hotelsApi.search(criteriaToQuery(criteria, pageParam, PAGE_SIZE)),
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
  });

  useEffect(() => {
    const node = sentinel.current;
    if (!node || !hasNextPage) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !isFetchingNextPage) void fetchNextPage();
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const hotels = data?.pages.flatMap((page) => page.items) ?? [];
  const totalCount = data?.pages[0]?.totalCount ?? 0;
  const detailsQuery = `checkIn=${criteria.checkIn}&checkOut=${criteria.checkOut}&adults=${criteria.adults}&children=${criteria.children}`;

  return (
    <div className="container stack-lg">
      <SearchBar value={criteria} onSubmit={applyCriteria} submitLabel="Update search" />

      <div className="search-layout">
        <Filters criteria={criteria} onChange={applyCriteria} />

        <div className="stack">
          <div className="row-between">
            <h2>{totalCount} hotels found</h2>
            <span className="small muted">
              {criteria.checkIn} → {criteria.checkOut} · {plural(criteria.adults, 'adult')},{' '}
              {plural(criteria.children, 'child', 'children')}, {plural(criteria.rooms, 'room')}
            </span>
          </div>

          {isPending && <Loading label="Searching hotels…" />}
          <ErrorAlert error={error} fallback="Could not run the search." />

          {!isPending && !error && hotels.length === 0 && (
            <Empty>No hotels match these filters. Try widening the dates or price range.</Empty>
          )}

          {hotels.map((hotel) => (
            <HotelListItem
              key={hotel.hotelId}
              hotel={hotel}
              detailsLink={`/hotels/${hotel.hotelId}?${detailsQuery}`}
            />
          ))}

          <div ref={sentinel} />
          {isFetchingNextPage && <Loading label="Loading more hotels…" />}
          {!hasNextPage && hotels.length > 0 && <span className="small muted center">End of results</span>}
        </div>
      </div>
    </div>
  );
}
