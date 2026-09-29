import { Link } from 'react-router-dom';
import { Alert, Empty } from '@/components/ui/Feedback';
import { bookingHistory } from '@/lib/localHistory';
import { dateTime, money } from '@/lib/format';

function statusTone(status: string) {
  if (status === 'Succeeded') return 'badge-success';
  if (status === 'Failed') return 'badge-danger';
  return 'badge';
}

export function MyBookingsPage() {
  const bookings = bookingHistory.list();

  return (
    <div className="container stack">
      <h1>My bookings</h1>

      <Alert tone="info">
        The API has no &quot;list my bookings&quot; endpoint, so this page shows the bookings made in this browser.
        Every confirmation stays reachable by its link.
      </Alert>

      {bookings.length === 0 ? (
        <Empty>
          No bookings yet. <Link to="/search">Search for a hotel</Link> to make one.
        </Empty>
      ) : (
        <div className="stack">
          {bookings.map((booking) => (
            <Link
              key={booking.bookingGroupId}
              to={`/bookings/${booking.bookingGroupId}`}
              className="card card-hover"
              style={{ color: 'inherit' }}
            >
              <div className="card-body row-between">
                <div className="stack-sm">
                  <strong>{booking.confirmationNumber}</strong>
                  <span className="small muted">{booking.hotelNames.join(', ')}</span>
                  <span className="small muted">{dateTime(booking.createdAt)}</span>
                </div>
                <div className="stack-sm" style={{ textAlign: 'right' }}>
                  <span className="price">{money(booking.totalPrice)}</span>
                  <span className={`badge ${statusTone(booking.paymentStatus)}`}>{booking.paymentStatus}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
