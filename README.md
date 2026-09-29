# Hotel Booking — Front End

React front end for the **HotelBooking API** (.NET 10). It covers the whole product: login and
registration, the home page with deals and trending cities, search with filters and infinite scroll,
the hotel page with gallery, map and rooms, a cart, Stripe checkout, the invoice/confirmation page,
and the admin area for cities, hotels, rooms, room types, amenities, discounts, users and the outbox.

The API is consumed as-is. No backend file was changed.

## Stack

| Concern | Choice |
| --- | --- |
| Build | Vite 6 + React 19 + TypeScript (strict) |
| Routing | React Router 7 |
| Server state | TanStack Query 5 |
| HTTP | Axios, one instance with bearer + refresh interceptor |
| Map | React Leaflet + OpenStreetMap (no API key) |
| Styling | Plain CSS with design tokens in `src/styles/global.css` |

## Running it

The API must be running first on `http://localhost:5279` (`dotnet run --project src/HotelBooking.Presentation`
in the backend solution, with the docker-compose infrastructure up).

```bash
npm install
```

```bash
npm run dev
```

The app starts on **http://localhost:3000**. That port is not optional: the backend's
`EMAIL_CONFIRM_URL_TEMPLATE` points confirmation emails at `http://localhost:3000/confirm-email#token={token}`.

Other scripts:

```bash
npm run build
```

```bash
npm run typecheck
```

### Why a dev proxy instead of calling the API directly

The backend registers no CORS policy, so a browser on `localhost:3000` cannot call `localhost:5279`
directly. Vite proxies `/api` to the API instead, which keeps every request same-origin and needs no
backend change. Point it elsewhere with `API_PROXY_TARGET` in a `.env` file (see `.env.example`).

For a real deployment the API needs `AddCors`/`UseCors`, or the front end has to be served behind the
same origin as the API (reverse proxy).

## Test accounts

Local development accounts against the local database only.

| Account | Email | Password | Role |
| --- | --- | --- | --- |
| Admin | `frontend.admin@hotelbooking.local` | `FrontDev2026x` | User + Admin |
| Sami Odeh | `sami.odeh@example.ps` | `Falastin2026a` | User |
| Rana Khalil | `rana.khalil@example.ps` | `Falastin2026a` | User |
| Yousef Mansour | `yousef.mansour@example.ps` | `Falastin2026a` | User |
| Lina Haddad | `lina.haddad@example.ps` | `Falastin2026a` | User |
| Tariq Nassar | `tariq.nassar@example.ps` | `Falastin2026a` | User |

The five guest accounts each have a completed stay (so their review is on the hotel page) and an
upcoming one (so "recently visited" is populated when they sign in).

The API has no endpoint that creates the first admin (`POST /api/v1/admin/users` itself requires an
admin), so an account is registered normally and then promoted in SQL:

```sql
SET QUOTED_IDENTIFIER ON;
UPDATE AspNetUsers SET EmailConfirmed = 1 WHERE Email = 'you@example.com';
INSERT INTO AspNetUserRoles (UserId, RoleId)
SELECT u.Id, r.Id FROM AspNetUsers u CROSS JOIN AspNetRoles r
WHERE u.Email = 'you@example.com' AND r.Name = 'Admin';
```

Outgoing mail lands in Mailpit at http://localhost:8025 — that is where confirmation and invoice
emails show up.

## Layout

```
src/
  api/          One module per API area; types.ts mirrors the backend DTOs exactly.
    admin/      Admin-only endpoints, one module per resource.
  components/
    ui/         Reusable primitives: Button, Field, Modal, DataTable, Pagination, ImageManager…
    layout/     App shell, admin shell, route guards.
    hotel/      SearchBar, HotelCard, HotelListItem, RoomCard, Gallery, HotelMap, ReviewsSection.
    admin/      AdminToolbar, image managers.
  features/
    auth/       AuthContext: tokens, decoded user, roles.
    cart/       CartContext: rooms picked before checkout (localStorage).
    search/     Search criteria <-> URL query string.
    checkout/   Stripe test payment methods.
  lib/          http (axios + refresh), problem (API error -> message), jwt, dates, format.
  pages/        One file per screen; admin screens under pages/admin.
  styles/       global.css — tokens first, then components.
```

## How the pieces work

**Auth.** `POST /auth/login` returns tokens only, so the role comes from decoding the access token.
The role claim is the long `schemas.microsoft.com/...role` URI and holds an array, which `lib/jwt.ts`
handles along with the short `role`/`roles` spellings. Tokens live in `localStorage`; a 401 triggers a
single shared refresh call and the original request is retried once. Because the API revokes every
session when a refresh token is reused, the refresh is deliberately single-flight.

**Errors.** Every failure goes through `lib/problem.ts`, which turns an RFC 7807 `ProblemDetails` into
one sentence, keyed on the machine code in `type` (`Booking.RoomNotAvailable`, `Auth.EmailNotConfirmed`,
`City.HasHotels`, …) and falling back to `detail`, then to model-state `errors`.

**Cart and checkout.** The API has no cart, so rooms are held client-side until checkout, which posts
them all in one `POST /bookings/checkout`. The request carries an `Idempotency-Key` header **and** an
`idempotencyKey` field in the body — the command record requires both (see *API notes* below). A fresh
key is generated whenever the cart, the remarks or the payment method change, so retrying the same
order is safe while a changed order is never merged into the old one.

**Payments.** The API forwards `paymentMethodId` straight to Stripe's `PaymentIntent.Confirm`, so
checkout offers Stripe's test payment methods (`pm_card_visa`, `pm_card_chargeDeclined`, …). No card
details are collected by this app.

**Enums.** The API serializes enums as numbers, so `HotelCategory` travels as `0..3`
(Standard, Budget, Boutique, Luxury) with the labels kept in `api/types.ts`.

## API notes worth knowing

These are behaviours of the existing API that shape the front end. None of them were changed.

- **Checkout needs `idempotencyKey` in the body too.** The header is what the handler uses, but
  `CheckoutCommand.IdempotencyKey` is a non-nullable property, so model validation rejects a body
  without it before the controller runs.
- **No CORS policy** — hence the dev proxy.
- **No "my bookings" endpoint.** `/bookings` lists what this browser booked (kept in `localStorage`);
  every confirmation stays reachable by its URL.
- **Reviews are read-only here.** `POST /reviews` needs a `bookingId` and no endpoint ever returns
  booking ids, so the hotel page lists reviews but offers no write form.
- **Amenities cannot be attached to a hotel** through the API, so the amenity filter only matches
  links already present in the database.
- **Trending destinations are cached server-side for one hour**, so new bookings appear there late.
- **City and room images have no list endpoint**, so those screens can only show what was just
  uploaded; hotel images are listed through the public hotel-details endpoint and fully manageable.
