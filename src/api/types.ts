export const HotelCategory = {
  Standard: 0,
  Budget: 1,
  Boutique: 2,
  Luxury: 3,
} as const;

export type HotelCategoryValue = (typeof HotelCategory)[keyof typeof HotelCategory];

export const hotelCategoryLabels: Record<HotelCategoryValue, string> = {
  [HotelCategory.Standard]: 'Standard',
  [HotelCategory.Budget]: 'Budget',
  [HotelCategory.Boutique]: 'Boutique',
  [HotelCategory.Luxury]: 'Luxury',
};

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  errors?: Record<string, string[]>;
  correlationId?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface RegisterResponse {
  userId: string;
  email: string;
  userName: string;
}

export interface Amenity {
  id: string;
  name: string;
  icon: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface FeaturedDeal {
  hotelId: string;
  hotelName: string;
  cityName: string;
  country: string;
  starRating: number;
  thumbnailUrl: string | null;
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
}

export interface RecentlyVisitedHotel {
  hotelId: string;
  hotelName: string;
  cityName: string;
  country: string;
  starRating: number;
  thumbnailUrl: string | null;
  pricePerNight: number;
  lastBookedAt: string;
}

export interface TrendingDestination {
  cityId: string;
  name: string;
  country: string;
  thumbnailUrl: string | null;
  bookingCount: number;
}

export interface HotelSearchResult {
  hotelId: string;
  hotelName: string;
  cityName: string;
  country: string;
  starRating: number;
  category: HotelCategoryValue;
  description: string | null;
  thumbnailUrl: string | null;
  originalPricePerNight: number;
  discountedPricePerNight: number;
}

export interface HotelImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

export interface HotelAmenity {
  id: string;
  name: string;
  icon: string | null;
}

export interface HotelRoom {
  roomId: string;
  number: string;
  roomTypeName: string;
  roomTypeDescription: string | null;
  adultsCapacity: number;
  childrenCapacity: number;
  originalPricePerNight: number;
  discountedPricePerNight: number;
  thumbnailUrl: string | null;
}

export interface HotelDetails {
  hotelId: string;
  hotelName: string;
  description: string | null;
  starRating: number;
  category: HotelCategoryValue;
  address: string;
  latitude: number | null;
  longitude: number | null;
  cityName: string;
  country: string;
  ownerName: string | null;
  images: HotelImage[];
  amenities: HotelAmenity[];
  rooms: HotelRoom[];
}

export interface Review {
  id: string;
  hotelId: string;
  rating: number;
  comment: string | null;
  reviewerName: string | null;
  createdAt: string;
}

export interface CheckoutRoomItem {
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
}

export interface CreateBookingRequest {
  specialRequests: string | null;
  rooms: CheckoutRoomItem[];
}

export interface CreateBookingResult {
  bookingGroupId: string;
  confirmationNumber: string;
  totalPrice: number;
  holdExpiresAt: string;
}

export interface PayBookingResult {
  bookingGroupId: string;
  confirmationNumber: string;
  paymentStatus: string;
  totalPrice: number;
}

export interface InvoiceLine {
  hotelName: string;
  hotelAddress: string;
  roomNumber: string;
  roomType: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  originalPricePerNight: number;
  discountedPricePerNight: number;
  discountPerNight: number;
  lineTotal: number;
}

export interface Invoice {
  bookingGroupId: string;
  confirmationNumber: string;
  guestName: string;
  guestEmail: string;
  issuedAt: string;
  paymentStatus: string;
  currency: string;
  totalPrice: number;
  lines: InvoiceLine[];
}

export interface CityGridItem {
  id: string;
  name: string;
  country: string;
  postalCode: string | null;
  numberOfHotels: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface CityDetail extends CityGridItem {
  timezone: string;
}

export interface HotelGridItem {
  id: string;
  name: string;
  starRating: number;
  category: HotelCategoryValue;
  cityName: string;
  ownerName: string | null;
  numberOfRooms: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface HotelDetail {
  id: string;
  name: string;
  description: string | null;
  starRating: number;
  category: HotelCategoryValue;
  address: string;
  latitude: number | null;
  longitude: number | null;
  cityId: string;
  cityName: string;
  cityCountry: string;
  ownerName: string | null;
  numberOfRooms: number;
  primaryImageUrl: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface RoomGridItem {
  id: string;
  number: string;
  roomTypeName: string;
  adultsCapacity: number;
  childrenCapacity: number;
  pricePerNight: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface RoomDetail {
  id: string;
  hotelId: string;
  hotelName: string;
  roomTypeId: string;
  roomTypeName: string;
  number: string;
  adultsCapacity: number;
  childrenCapacity: number;
  pricePerNight: number;
  isActive: boolean;
  numberOfImages: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface RoomType {
  id: string;
  name: string;
  description: string | null;
  numberOfRooms: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface Discount {
  id: string;
  roomId: string;
  roomNumber: string;
  hotelId: string;
  hotelName: string;
  title: string | null;
  percentage: number;
  startUtc: string;
  endUtc: string;
  isActive: boolean;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  userName: string;
  role: string;
  createdAt: string;
}

export interface OutboxDeadLetter {
  id: string;
  type: string;
  occurredAtUtc: string;
  attemptCount: number;
  lastError: string | null;
}

export interface UploadedImage {
  id: string;
  url: string;
  isPrimary?: boolean;
}
