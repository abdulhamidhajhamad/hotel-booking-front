import type { HotelRoom } from '@/api/types';
import { Button } from '@/components/ui/Button';
import { Thumb } from '@/components/ui/Thumb';
import { money, plural } from '@/lib/format';

interface RoomCardProps {
  room: HotelRoom;
  nights: number;
  inCart: boolean;
  capacityWarning?: string;
  onAdd: () => void;
}

export function RoomCard({ room, nights, inCart, capacityWarning, onAdd }: RoomCardProps) {
  const hasDiscount = room.discountedPricePerNight < room.originalPricePerNight;

  return (
    <article className="card hotel-row">
      <Thumb url={room.thumbnailUrl} alt={`Room ${room.number}`} />
      <div className="card-body stack-sm">
        <div className="row-between">
          <div className="stack-sm">
            <h3>
              {room.roomTypeName} · Room {room.number}
            </h3>
            <span className="small muted">
              Sleeps {plural(room.adultsCapacity, 'adult')}, {plural(room.childrenCapacity, 'child', 'children')}
            </span>
          </div>
          <div className="stack-sm" style={{ textAlign: 'right' }}>
            {hasDiscount && <span className="small strike">{money(room.originalPricePerNight)}</span>}
            <span className="price">{money(room.discountedPricePerNight)}</span>
            <span className="small muted">per night</span>
          </div>
        </div>

        {room.roomTypeDescription && <p className="small muted">{room.roomTypeDescription}</p>}

        {capacityWarning && <span className="field-error">{capacityWarning}</span>}

        <div className="row-between">
          <span className="small muted">
            {nights > 0 && `${money(room.discountedPricePerNight * nights)} for ${plural(nights, 'night')}`}
          </span>
          <Button variant={inCart ? 'default' : 'primary'} disabled={inCart || !!capacityWarning} onClick={onAdd}>
            {inCart ? 'In cart' : 'Add to cart'}
          </Button>
        </div>
      </div>
    </article>
  );
}
