import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { catalogApi } from '@/api/catalog';
import { hotelsApi } from '@/api/hotels';
import { HotelCard } from '@/components/hotel/HotelCard';
import { SearchBar } from '@/components/hotel/SearchBar';
import { Empty, ErrorAlert, Loading } from '@/components/ui/Feedback';
import { Thumb } from '@/components/ui/Thumb';
import { useAuth } from '@/features/auth/AuthContext';
import { criteriaToParams, defaultCriteria, type SearchCriteria } from '@/features/search/criteria';
import { dateTime, plural } from '@/lib/format';

function FeaturedDeals({ dates }: { dates: { checkIn: string; checkOut: string } }) {
  const { data, isPending, error } = useQuery({
    queryKey: ['featured-deals'],
    queryFn: () => hotelsApi.featuredDeals(5),
  });

  if (isPending) return <Loading label="Loading featured deals…" />;
  if (error) return <ErrorAlert error={error} fallback="Could not load featured deals." />;
  if (!data || data.length === 0) return <Empty>No active deals right now.</Empty>;

  return (
    <div className="grid grid-cards">
      {data.map((deal) => (
        <HotelCard
          key={deal.hotelId}
          hotelId={deal.hotelId}
          name={deal.hotelName}
          location={`${deal.cityName}, ${deal.country}`}
          starRating={deal.starRating}
          thumbnailUrl={deal.thumbnailUrl}
          price={deal.discountedPrice}
          originalPrice={deal.originalPrice}
          discountPercentage={deal.discountPercentage}
          linkTo={`/hotels/${deal.hotelId}?checkIn=${dates.checkIn}&checkOut=${dates.checkOut}`}
        />
      ))}
    </div>
  );
}

function RecentlyVisited() {
  const { data, isPending, error } = useQuery({
    queryKey: ['recently-visited'],
    queryFn: () => hotelsApi.recentlyVisited(5),
  });

  if (isPending) return <Loading label="Loading your recent hotels…" />;
  if (error) return <ErrorAlert error={error} fallback="Could not load your recent hotels." />;
  if (!data || data.length === 0) return <Empty>Book a stay and it will show up here.</Empty>;

  return (
    <div className="grid grid-cards">
      {data.map((hotel) => (
        <HotelCard
          key={hotel.hotelId}
          hotelId={hotel.hotelId}
          name={hotel.hotelName}
          location={`${hotel.cityName}, ${hotel.country}`}
          starRating={hotel.starRating}
          thumbnailUrl={hotel.thumbnailUrl}
          price={hotel.pricePerNight}
          footer={`Last booked ${dateTime(hotel.lastBookedAt)}`}
        />
      ))}
    </div>
  );
}

function TrendingDestinations() {
  const { data, isPending, error } = useQuery({
    queryKey: ['trending-destinations'],
    queryFn: () => catalogApi.trendingDestinations(5),
  });

  if (isPending) return <Loading label="Loading trending destinations…" />;
  if (error) return <ErrorAlert error={error} fallback="Could not load trending destinations." />;
  if (!data || data.length === 0) return <Empty>No destinations to highlight yet.</Empty>;

  return (
    <div className="grid grid-cards">
      {data.map((city) => (
        <Link
          key={city.cityId}
          to={`/search?query=${encodeURIComponent(city.name)}`}
          className="card card-hover"
          style={{ color: 'inherit' }}
        >
          <Thumb url={city.thumbnailUrl} alt={city.name} />
          <div className="card-body stack-sm">
            <h3>{city.name}</h3>
            <span className="small muted">{city.country}</span>
            <span className="badge badge-primary">{plural(city.bookingCount, 'booking')}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const criteria = defaultCriteria();

  const onSearch = (next: SearchCriteria) => navigate(`/search?${criteriaToParams(next)}`);

  return (
    <div className="stack-lg">
      <section className="hero">
        <div className="container stack">
          <div className="stack-sm">
            <h1>Find your next stay</h1>
            <p>Search hotels and cities, compare deals, and book in a few clicks.</p>
          </div>
          <SearchBar value={criteria} onSubmit={onSearch} />
        </div>
      </section>

      <div className="container stack-lg">
        <section>
          <div className="section-title">
            <h2>Featured Deals</h2>
            <span className="small muted">Biggest active discounts</span>
          </div>
          <FeaturedDeals dates={{ checkIn: criteria.checkIn, checkOut: criteria.checkOut }} />
        </section>

        {isAuthenticated && (
          <section>
            <div className="section-title">
              <h2>Recently visited</h2>
              <span className="small muted">Your latest stays</span>
            </div>
            <RecentlyVisited />
          </section>
        )}

        <section>
          <div className="section-title">
            <h2>Trending destinations</h2>
            <span className="small muted">Top 5 most booked cities</span>
          </div>
          <TrendingDestinations />
        </section>
      </div>
    </div>
  );
}
