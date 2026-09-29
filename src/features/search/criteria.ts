import type { HotelCategoryValue } from '@/api/types';
import type { SearchHotelsParams } from '@/api/hotels';
import { today, tomorrow } from '@/lib/dates';

export interface SearchCriteria {
  query: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  rooms: number;
  minPrice: string;
  maxPrice: string;
  minStar: string;
  category: string;
  amenityIds: string[];
  sortBy: 'name' | 'price' | 'starRating';
  sortDesc: boolean;
}

export function defaultCriteria(): SearchCriteria {
  return {
    query: '',
    checkIn: today(),
    checkOut: tomorrow(),
    adults: 2,
    children: 0,
    rooms: 1,
    minPrice: '',
    maxPrice: '',
    minStar: '',
    category: '',
    amenityIds: [],
    sortBy: 'name',
    sortDesc: false,
  };
}

function toInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  return value !== null && Number.isFinite(parsed) ? parsed : fallback;
}

export function criteriaFromParams(params: URLSearchParams): SearchCriteria {
  const defaults = defaultCriteria();
  const sortBy = params.get('sortBy');

  return {
    query: params.get('query') ?? defaults.query,
    checkIn: params.get('checkIn') ?? defaults.checkIn,
    checkOut: params.get('checkOut') ?? defaults.checkOut,
    adults: toInt(params.get('adults'), defaults.adults),
    children: toInt(params.get('children'), defaults.children),
    rooms: toInt(params.get('rooms'), defaults.rooms),
    minPrice: params.get('minPrice') ?? '',
    maxPrice: params.get('maxPrice') ?? '',
    minStar: params.get('minStar') ?? '',
    category: params.get('category') ?? '',
    amenityIds: params.getAll('amenityIds'),
    sortBy: sortBy === 'price' || sortBy === 'starRating' ? sortBy : 'name',
    sortDesc: params.get('sortDesc') === 'true',
  };
}

export function criteriaToParams(criteria: SearchCriteria): URLSearchParams {
  const params = new URLSearchParams();

  if (criteria.query.trim()) params.set('query', criteria.query.trim());
  params.set('checkIn', criteria.checkIn);
  params.set('checkOut', criteria.checkOut);
  params.set('adults', String(criteria.adults));
  params.set('children', String(criteria.children));
  params.set('rooms', String(criteria.rooms));
  if (criteria.minPrice) params.set('minPrice', criteria.minPrice);
  if (criteria.maxPrice) params.set('maxPrice', criteria.maxPrice);
  if (criteria.minStar) params.set('minStar', criteria.minStar);
  if (criteria.category) params.set('category', criteria.category);
  criteria.amenityIds.forEach((id) => params.append('amenityIds', id));
  if (criteria.sortBy !== 'name') params.set('sortBy', criteria.sortBy);
  if (criteria.sortDesc) params.set('sortDesc', 'true');

  return params;
}

export function criteriaToQuery(criteria: SearchCriteria, page: number, pageSize: number): SearchHotelsParams {
  return {
    query: criteria.query.trim() || undefined,
    checkIn: criteria.checkIn || undefined,
    checkOut: criteria.checkOut || undefined,
    adults: criteria.adults,
    children: criteria.children,
    rooms: criteria.rooms,
    minPrice: criteria.minPrice ? Number(criteria.minPrice) : undefined,
    maxPrice: criteria.maxPrice ? Number(criteria.maxPrice) : undefined,
    minStar: criteria.minStar ? Number(criteria.minStar) : undefined,
    category: criteria.category ? (Number(criteria.category) as HotelCategoryValue) : undefined,
    amenityIds: criteria.amenityIds.length > 0 ? criteria.amenityIds : undefined,
    sortBy: criteria.sortBy,
    sortDesc: criteria.sortDesc,
    page,
    pageSize,
  };
}

export function validateCriteria(criteria: SearchCriteria): string | null {
  if (!criteria.checkIn || !criteria.checkOut) return 'Pick both a check-in and a check-out date.';
  if (new Date(criteria.checkOut) <= new Date(criteria.checkIn))
    return 'Check-out must be after check-in.';
  if (criteria.adults < 1) return 'At least one adult is required.';
  if (criteria.children < 0) return 'Children cannot be negative.';
  if (criteria.rooms < 1) return 'At least one room is required.';
  if (criteria.minPrice && criteria.maxPrice && Number(criteria.maxPrice) < Number(criteria.minPrice))
    return 'Max price must be greater than or equal to min price.';
  return null;
}
