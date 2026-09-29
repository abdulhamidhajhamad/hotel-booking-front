import { Link } from 'react-router-dom';
import { hotelCategoryLabels, type HotelSearchResult } from '@/api/types';
import { Stars } from '@/components/ui/Stars';
import { Thumb } from '@/components/ui/Thumb';
import { money } from '@/lib/format';

export function HotelListItem({ hotel, detailsLink }: { hotel: HotelSearchResult; detailsLink: string }) {
  const hasDiscount = hotel.discountedPricePerNight < hotel.originalPricePerNight;

  return (
    <article className="card hotel-row">
      <Thumb url={hotel.thumbnailUrl} alt={hotel.hotelName} />
      <div className="card-body stack-sm">
        <div className="row-between">
          <div className="stack-sm">
            <h3>{hotel.hotelName}</h3>
            <span className="small muted">
              {hotel.cityName}, {hotel.country}
            </span>
          </div>
          <div className="stack-sm" style={{ textAlign: 'right' }}>
            {hasDiscount && <span className="small strike">{money(hotel.originalPricePerNight)}</span>}
            <span className="price">{money(hotel.discountedPricePerNight)}</span>
            <span className="small muted">per night</span>
          </div>
        </div>

        <div className="row row-wrap">
          <Stars value={hotel.starRating} />
          <span className="badge">{hotelCategoryLabels[hotel.category]}</span>
        </div>

        {hotel.description && <p className="small muted">{hotel.description}</p>}

        <div className="row">
          <Link to={detailsLink} className="btn btn-primary btn-sm">
            View hotel
          </Link>
        </div>
      </div>
    </article>
  );
}
