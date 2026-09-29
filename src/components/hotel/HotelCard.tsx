import { Link } from 'react-router-dom';
import { Stars } from '@/components/ui/Stars';
import { Thumb } from '@/components/ui/Thumb';
import { money, percent } from '@/lib/format';

interface HotelCardProps {
  hotelId: string;
  name: string;
  location: string;
  starRating: number;
  thumbnailUrl: string | null;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  footer?: string;
  linkTo?: string;
}

export function HotelCard({
  hotelId,
  name,
  location,
  starRating,
  thumbnailUrl,
  price,
  originalPrice,
  discountPercentage,
  footer,
  linkTo,
}: HotelCardProps) {
  const hasDiscount = originalPrice !== undefined && originalPrice > price;

  return (
    <Link to={linkTo ?? `/hotels/${hotelId}`} className="card card-hover" style={{ color: 'inherit' }}>
      <Thumb url={thumbnailUrl} alt={name} />
      <div className="card-body stack-sm">
        <div className="row-between">
          <Stars value={starRating} />
          {discountPercentage !== undefined && discountPercentage > 0 && (
            <span className="badge badge-danger">-{percent(discountPercentage)}</span>
          )}
        </div>
        <h3>{name}</h3>
        <span className="small muted">{location}</span>
        <div className="row">
          {hasDiscount && <span className="small strike">{money(originalPrice)}</span>}
          <span className="price">{money(price)}</span>
          <span className="small muted">/ night</span>
        </div>
        {footer && <span className="small muted">{footer}</span>}
      </div>
    </Link>
  );
}
