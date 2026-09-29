# Front end

React front end for the HotelBooking API. Every feature in the project brief is wired to the endpoint
that serves it. The backend was read only — no backend file was modified.

## Screens and the endpoints behind them

| Screen | Route | Endpoints |
| --- | --- | --- |
| Login | `/login` | `POST /auth/login` |
| Register | `/register` | `POST /auth/register` |
| Email confirmation | `/confirm-email#token=…` | `POST /auth/confirm-email` |
| Resend confirmation | `/resend-confirmation` | `POST /auth/resend-confirmation` |
| Home | `/` | `GET /hotels/featured-deals`, `GET /hotels/recently-visited`, `GET /cities/trending` |
| Search results | `/search` | `GET /hotels/search`, `GET /amenities` |
| Hotel | `/hotels/:id` | `GET /hotels/{id}?checkIn&checkOut`, `GET /hotels/{id}/reviews` |
| Cart | `/cart` | client-side only |
| Checkout | `/checkout` | `POST /bookings/checkout` |
| Confirmation | `/bookings/:groupId` | `GET /bookings/{id}/invoice`, `GET /bookings/{id}/invoice/pdf` |
| My bookings | `/bookings` | local history of this browser |
| Admin — Cities | `/admin/cities` | `GET/POST/PATCH/DELETE /admin/cities`, `POST/DELETE /admin/cities/{id}/images` |
| Admin — Hotels | `/admin/hotels` | `GET/POST/PATCH/DELETE /admin/hotels`, hotel image upload / primary / delete |
| Admin — Rooms | `/admin/hotels/:id/rooms` | `GET/POST/PATCH/DELETE /admin/hotels/{id}/rooms`, room image upload / delete |
| Admin — Room types | `/admin/room-types` | `GET/POST/PATCH/DELETE /admin/room-types` |
| Admin — Amenities | `/admin/amenities` | `GET/POST/PATCH/DELETE /admin/amenities` |
| Admin — Discounts | `/admin/discounts` | `GET/POST/DELETE /admin/discounts` |
| Admin — Users | `/admin/users` | `POST /admin/users` |
| Admin — Outbox | `/admin/outbox` | `GET /admin/outbox/dead-letters`, `POST /admin/outbox/{id}/requeue` |

Sign-in state is required for checkout, invoices and recently-visited; the admin area additionally
requires the `Admin` role, taken from the access token.

## Brief coverage

- **Login page** — email and password, with a direct path to resend the confirmation email when the
  API answers `Auth.EmailNotConfirmed`.
- **Home** — search bar with the required placeholder, check-in defaulting to today and check-out to
  tomorrow, adults defaulting to 2, children to 0 and rooms to 1; Featured Deals (up to 5, thumbnail,
  name, location, original and discounted price, stars); recently visited (up to 5); trending
  destinations (top 5 cities by bookings).
- **Search results** — sidebar filters for price range, star rating, hotel type and amenities, plus
  sorting; results load by infinite scroll, each entry showing thumbnail, name, stars, price per night
  and a short description.
- **Hotel page** — gallery with a fullscreen lightbox, description, star rating, amenities, guest
  reviews, an interactive map of the location, and the list of available room types with images,
  capacity, prices and "add to cart".
- **Checkout and confirmation** — guest details, special requests, payment method, then a confirmation
  page with the confirmation number, hotel address, room details, dates and total, with print and
  save-as-PDF. The invoice email is sent by the API through the outbox.
- **Admin** — collapsible left navigation, per-grid search and filters, the required columns on the
  cities, hotels and rooms grids with creation and modification dates and a delete action, a create
  button per resource, and an update form opened by clicking a grid row.

## Conventions

- One module per API area under `src/api`; `types.ts` mirrors the backend DTOs field for field.
- Screens hold no fetching logic of their own beyond a `useQuery`/`useMutation` call; the request
  shapes live in the API modules.
- Server state is TanStack Query; client state is two small contexts (auth, cart). No global store.
- Reusable primitives (`Button`, `Field`, `Modal`, `ConfirmDialog`, `DataTable`, `Pagination`,
  `ImageManager`, `Stars`, `Thumb`, `Alert`) are shared by every screen, so an admin grid is a column
  definition plus a form, not a new table.
- Styling is plain CSS with tokens at the top of `global.css`; no utility-class framework.
- All API failures render through one translator (`lib/problem.ts`) keyed on the error code the API
  puts in `ProblemDetails.type`.

## Constraints found in the API

Behaviours that the front end had to work around. All of them are backend-side; none were changed.

1. **Checkout requires `idempotencyKey` in the request body as well as the header.** `CheckoutCommand`
   declares it as a required (non-nullable) property, so `[ApiController]` model validation returns
   `400 "The IdempotencyKey field is required."` before the controller copies the header into the
   command. The client sends both.
2. **No CORS policy is registered.** The dev server proxies `/api` to the API to keep requests
   same-origin. A deployment needs `AddCors`/`UseCors` or a shared origin.
3. **No endpoint lists a user's bookings**, and no endpoint returns individual booking ids. As a
   result `POST /reviews`, which needs a `bookingId`, cannot be reached from a browser, so reviews are
   displayed but not written. "My bookings" falls back to what this browser booked.
4. **No endpoint links amenities to hotels**, so the amenity filter only matches links created
   directly in the database.
5. **Trending destinations are cached in memory for one hour**, so a fresh booking does not change the
   list until the cache expires or the API restarts.
6. **City and room images have no list endpoint** (`CityDetail`/`RoomDetail` do not include image
   URLs), so those screens show only images uploaded in the current session. Hotel images are listed
   through the public hotel-details endpoint and are fully manageable, including setting the primary.
7. ~~Image upload fails with the Cloudinary credentials.~~ **Resolved.** Uploads returned
   `500 — Cloudinary upload failed: Request forbidden due to missing permissions (actions=["create"])`
   because the configured API key had no permissions on the product environment: the same key was
   also refused `read` on `/usage`, while `ping` (the one call needing no permission) returned 200 and
   asset delivery worked, which ruled out bad credentials and a suspended account. A new API key in
   `.env` fixed it; hotel, city and room uploads, set-primary and delete are all verified working.
8. **Enums serialize as numbers** (no `JsonStringEnumConverter`), so request bodies must send
   `category: 3` rather than `"Luxury"`.
9. **The refresh token lives 30 minutes** and reuse revokes every session for the account, so the
   client keeps a single in-flight refresh and signs the user out cleanly when it fails.

## Verified against the running API

Checked end to end against the API on `localhost:5279` with SQL Server, Redis and Mailpit up:

- register → confirmation email in Mailpit → confirm through the emailed link → login;
- token refresh, rotation, and the reuse-detection path;
- search with dates, guests, price range, stars, category and multiple amenities, plus sorting and
  infinite scroll paging;
- hotel details with and without dates, discounted pricing, gallery, map;
- add to cart → checkout with `pm_card_visa` → 201, confirmation page, invoice JSON, invoice PDF
  (`application/pdf`), and the invoice email arriving in Mailpit;
- declined card (`409 Booking.PaymentFailed`), replayed idempotency key (same result returned), reused
  key with a different body (`409 Booking.IdempotencyKeyReused`), and double-booked dates
  (`409 Booking.RoomNotAvailable`);
- admin create, row-click edit and delete for cities through the UI, including the `409 City.HasHotels`
  conflict surfacing in the delete dialog;
- every admin grid loading with the columns the brief asks for;
- image management end to end: multi-file upload for hotels, cities and rooms, the returned
  `res.cloudinary.com` URL serving the exact bytes that were sent, set-primary reordering the gallery,
  and delete on both hotel and room images;
- every endpoint the client calls — all 51 — exercised at least once, including logout, logout-all,
  resend-confirmation, admin user creation, outbox requeue, and every PATCH and DELETE route.
