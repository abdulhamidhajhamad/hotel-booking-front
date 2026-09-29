import { useQuery } from '@tanstack/react-query';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { hotelsApi } from '@/api/hotels';
import { hotelCategoryLabels } from '@/api/types';
import { Gallery } from '@/components/hotel/Gallery';
import { HotelMap } from '@/components/hotel/HotelMap';
import { ReviewsSection } from '@/components/hotel/ReviewsSection';
import { RoomCard } from '@/components/hotel/RoomCard';
import { Alert, Empty, ErrorAlert, Loading } from '@/components/ui/Feedback';
import { Stars } from '@/components/ui/Stars';
import { useCart } from '@/features/cart/CartContext';
import { nightsBetween, today, tomorrow } from '@/lib/dates';
import { money, plural } from '@/lib/format';

export function HotelPage() {
  const { hotelId = '' } = useParams();
  const [params] = useSearchParams();
  const cart = useCart();

  const checkIn = params.get('checkIn') ?? today();
  const checkOut = params.get('checkOut') ?? tomorrow();
  const adults = Number(params.get('adults') ?? 2);
  const children = Number(params.get('children') ?? 0);
  const nights = nightsBetween(checkIn, checkOut);

  const { data: hotel, isPending, error } = useQuery({
    queryKey: ['hotel', hotelId, checkIn, checkOut],
    queryFn: () => hotelsApi.details(hotelId, checkIn, checkOut),
  });

  if (isPending) return <Loading label="Loading hotel…" />;
  if (error) return <div className="container"><ErrorAlert error={error} fallback="Could not load this hotel." /></div>;
  if (!hotel) return null;

  return (
    <div className="container stack-lg">
      <div className="stack">
        <div className="row-between">
          <div className="stack-sm">
            <h1>{hotel.hotelName}</h1>
            <div className="row row-wrap">
              <Stars value={hotel.starRating} />
              <span className="badge">{hotelCategoryLabels[hotel.category]}</span>
              <span className="small muted">
                {hotel.address} · {hotel.cityName}, {hotel.country}
              </span>
            </div>
          </div>
          {hotel.ownerName && <span className="small muted">Managed by {hotel.ownerName}</span>}
        </div>

        <Gallery images={hotel.images} alt={hotel.hotelName} />
      </div>

      <div className="detail-layout">
        <div className="stack-lg">
          {hotel.description && (
            <section className="stack">
              <h2>About this hotel</h2>
              <p>{hotel.description}</p>
            </section>
          )}

          {hotel.amenities.length > 0 && (
            <section className="stack">
              <h2>Amenities</h2>
              <div className="row row-wrap">
                {hotel.amenities.map((amenity) => (
                  <span key={amenity.id} className="badge badge-primary">
                    {amenity.icon ? `${amenity.icon} ` : ''}
                    {amenity.name}
                  </span>
                ))}
              </div>
            </section>
          )}

          <section className="stack">
            <div className="section-title">
              <h2>Available rooms</h2>
              <span className="small muted">
                {checkIn} → {checkOut} · {plural(nights, 'night')}
              </span>
            </div>

            {hotel.rooms.length === 0 ? (
              <Empty>No rooms are free for these dates. Try different dates.</Empty>
            ) : (
              <div className="stack">
                {hotel.rooms.map((room) => {
                  const overAdults = adults > room.adultsCapacity;
                  const overChildren = children > room.childrenCapacity;
                  const capacityWarning = overAdults || overChildren
                    ? `This room takes up to ${plural(room.adultsCapacity, 'adult')} and ${plural(room.childrenCapacity, 'child', 'children')}.`
                    : undefined;

                  return (
                    <RoomCard
                      key={room.roomId}
                      room={room}
                      nights={nights}
                      inCart={cart.has(room.roomId, checkIn, checkOut)}
                      capacityWarning={capacityWarning}
                      onAdd={() =>
                        cart.add({
                          roomId: room.roomId,
                          hotelId: hotel.hotelId,
                          hotelName: hotel.hotelName,
                          roomNumber: room.number,
                          roomTypeName: room.roomTypeName,
                          thumbnailUrl: room.thumbnailUrl,
                          pricePerNight: room.discountedPricePerNight,
                          originalPricePerNight: room.originalPricePerNight,
                          checkIn,
                          checkOut,
                          adults,
                          children,
                        })
                      }
                    />
                  );
                })}
              </div>
            )}
          </section>

          <section className="stack">
            <h2>Guest reviews</h2>
            <ReviewsSection hotelId={hotel.hotelId} />
          </section>
        </div>

        <div className="stack summary">
          <div className="card">
            <div className="card-body stack">
              <h3>Your cart</h3>
              {cart.count === 0 ? (
                <span className="small muted">No rooms added yet.</span>
              ) : (
                <>
                  <span className="small muted">{plural(cart.count, 'room')} selected</span>
                  <div className="summary-total">
                    <span>Total</span>
                    <span>{money(cart.total)}</span>
                  </div>
                  <Link to="/cart" className="btn btn-primary btn-block">
                    Go to cart
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-body stack">
              <h3>Location</h3>
              {hotel.latitude !== null && hotel.longitude !== null ? (
                <HotelMap
                  latitude={hotel.latitude}
                  longitude={hotel.longitude}
                  name={hotel.hotelName}
                  address={hotel.address}
                />
              ) : (
                <Alert tone="info">No map coordinates were set for this hotel.</Alert>
              )}
              <span className="small muted">{hotel.address}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
