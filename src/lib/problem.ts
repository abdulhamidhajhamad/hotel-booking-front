import { AxiosError } from 'axios';
import type { ProblemDetails } from '@/api/types';

const friendlyByCode: Record<string, string> = {
  'Auth.InvalidCredentials': 'Email or password is incorrect.',
  'Auth.AccountLockedOut': 'Too many failed attempts. Try again in a few minutes.',
  'Auth.EmailNotConfirmed': 'Confirm your email before signing in. Check your inbox.',
  'Auth.EmailAlreadyRegistered': 'An account with this email already exists.',
  'Auth.UsernameAlreadyTaken': 'That username is already taken.',
  'Auth.InvalidOrExpiredToken': 'This confirmation link is invalid or has expired.',
  'Auth.InvalidRefreshToken': 'Your session has ended. Please sign in again.',
  'Auth.RefreshTokenExpired': 'Your session has expired. Please sign in again.',
  'Auth.RefreshTokenReused': 'Your session was ended for security reasons. Please sign in again.',
  'Booking.RoomNotAvailable': 'One or more rooms were just taken for those dates. Pick other dates or rooms.',
  'Booking.RoomCapacityExceeded': 'That room cannot hold the number of guests you selected.',
  'Booking.RoomInactive': 'That room is no longer available for booking.',
  'Booking.RequestInProgress': 'This booking is still being processed. Wait a moment and try again.',
  'Booking.IdempotencyKeyReused': 'This checkout was already submitted with different details.',
  'Booking.MissingIdempotencyKey': 'The booking request was malformed. Please retry.',
  'Booking.InvoiceForbidden': 'This booking belongs to another account.',
  'Booking.Forbidden': 'This booking belongs to another account.',
  'Booking.NotFound': 'This booking hold could not be found. Please start a new booking.',
  'Booking.NotPending': 'This hold is no longer awaiting payment. Please start a new booking.',
  'Booking.HoldExpired': 'The hold on these rooms has expired. Please start a new booking.',
  'Booking.PaymentFailed': 'The payment was declined. Try a different card and book again.',
  'City.DuplicateNameCountry': 'A city with this name already exists in that country.',
  'City.HasHotels': 'This city still has hotels. Delete or move them first.',
  'Hotel.CityNotFound': 'Pick a city that still exists.',
  'Hotel.HasActiveBookings': 'This hotel still has active bookings and cannot be deleted.',
  'Room.DuplicateNumber': 'This hotel already has a room with that number.',
  'Room.HasActiveBookings': 'This room still has active bookings and cannot be deleted.',
  'Room.RoomTypeNotFound': 'Pick a room type that still exists.',
  'RoomType.AlreadyExists': 'A room type with this name already exists.',
  'RoomType.InUseByRooms': 'Rooms still use this room type, so it cannot be deleted.',
  'Amenity.AlreadyExists': 'An amenity with this name already exists.',
  'AdminUsers.InvalidRole': 'Role must be either User or Admin.',
  'Review.StayNotCompleted': 'You can review a hotel only after the stay has ended.',
  'Review.AlreadyReviewed': 'This booking has already been reviewed.',
  'Review.NotBookingOwner': 'You can review only your own bookings.',
};

export function problemMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!(error instanceof AxiosError)) {
    return error instanceof Error && error.message ? error.message : fallback;
  }

  if (error.code === 'ERR_NETWORK') {
    return 'Cannot reach the API. Make sure the backend is running on http://localhost:5279.';
  }

  if (error.response?.status === 429) {
    return 'Too many requests. Please wait a minute and try again.';
  }

  const problem = error.response?.data as ProblemDetails | undefined;

  if (problem?.type && friendlyByCode[problem.type]) return friendlyByCode[problem.type];

  if (problem?.errors) {
    const first = Object.values(problem.errors).flat().find(Boolean);
    if (first) return first;
  }

  return problem?.detail || problem?.title || fallback;
}

export async function parseBlobProblem(error: unknown): Promise<unknown> {
  if (error instanceof AxiosError && error.response?.data instanceof Blob) {
    try {
      error.response.data = JSON.parse(await error.response.data.text());
    } catch {
      /* not JSON - leave the blob in place and fall back to a generic message */
    }
  }
  return error;
}

export function problemCode(error: unknown): string | undefined {
  if (!(error instanceof AxiosError)) return undefined;
  return (error.response?.data as ProblemDetails | undefined)?.type;
}

export function statusOf(error: unknown): number | undefined {
  return error instanceof AxiosError ? error.response?.status : undefined;
}
