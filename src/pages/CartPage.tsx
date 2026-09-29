import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Empty } from '@/components/ui/Feedback';
import { Thumb } from '@/components/ui/Thumb';
import { useAuth } from '@/features/auth/AuthContext';
import { cartItemKey, itemNights, itemTotal, useCart } from '@/features/cart/CartContext';
import { money, plural, shortDate } from '@/lib/format';

export function CartPage() {
  const cart = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (cart.count === 0) {
    return (
      <div className="container stack">
        <h1>Your cart</h1>
        <Empty>
          Your cart is empty. <Link to="/search">Find a room</Link> to get started.
        </Empty>
      </div>
    );
  }

  return (
    <div className="container stack-lg">
      <div className="row-between">
        <h1>Your cart</h1>
        <Button variant="ghost" onClick={cart.clear}>
          Clear cart
        </Button>
      </div>

      <div className="detail-layout">
        <div className="stack">
          {cart.items.map((item) => (
            <article key={cartItemKey(item)} className="card hotel-row">
              <Thumb url={item.thumbnailUrl} alt={item.hotelName} />
              <div className="card-body stack-sm">
                <div className="row-between">
                  <div className="stack-sm">
                    <h3>{item.hotelName}</h3>
                    <span className="small muted">
                      {item.roomTypeName} · Room {item.roomNumber}
                    </span>
                  </div>
                  <span className="price">{money(itemTotal(item))}</span>
                </div>

                <span className="small muted">
                  {shortDate(item.checkIn)} → {shortDate(item.checkOut)} · {plural(itemNights(item), 'night')} ·{' '}
                  {plural(item.adults, 'adult')}, {plural(item.children, 'child', 'children')}
                </span>

                <div className="row-between">
                  <span className="small muted">{money(item.pricePerNight)} per night</span>
                  <Button size="sm" variant="danger" onClick={() => cart.remove(cartItemKey(item))}>
                    Remove
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="card summary">
          <div className="card-body stack">
            <h3>Summary</h3>
            {cart.items.map((item) => (
              <div key={cartItemKey(item)} className="summary-line">
                <span className="muted">
                  {item.roomTypeName} · {plural(itemNights(item), 'night')}
                </span>
                <span>{money(itemTotal(item))}</span>
              </div>
            ))}
            <div className="summary-total">
              <span>Total</span>
              <span>{money(cart.total)}</span>
            </div>
            <Button
              variant="primary"
              block
              onClick={() =>
                isAuthenticated
                  ? navigate('/checkout')
                  : navigate('/login', { state: { from: '/checkout' } })
              }
            >
              {isAuthenticated ? 'Proceed to checkout' : 'Sign in to check out'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
