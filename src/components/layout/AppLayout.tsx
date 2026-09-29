import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { useCart } from '@/features/cart/CartContext';
import { Button } from '@/components/ui/Button';

function Header() {
  const { isAuthenticated, isAdmin, user, logout, logoutEverywhere } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate('/');
  };

  const onLogoutEverywhere = async () => {
    await logoutEverywhere();
    navigate('/');
  };

  return (
    <header className="site-header">
      <div className="container">
        <Link to="/" className="brand">
          Hotel Booking
        </Link>

        <NavLink to="/search" className="nav-link">
          Search
        </NavLink>

        {isAuthenticated && (
          <NavLink to="/bookings" className="nav-link">
            My bookings
          </NavLink>
        )}

        {isAdmin && (
          <NavLink to="/admin/cities" className="nav-link">
            Admin
          </NavLink>
        )}

        <span className="spacer" />

        <Link to="/cart" className="nav-link">
          Cart {count > 0 && <span className="cart-count">{count}</span>}
        </Link>

        {isAuthenticated ? (
          <>
            <span className="small muted">{user?.email}</span>
            <Button size="sm" onClick={onLogout}>
              Sign out
            </Button>
            <Button
              size="sm"
              variant="ghost"
              title="Revoke every session for this account"
              onClick={onLogoutEverywhere}
            >
              All devices
            </Button>
          </>
        ) : (
          <>
            <NavLink to="/login" className="nav-link">
              Sign in
            </NavLink>
            <Link to="/register" className="btn btn-primary btn-sm">
              Create account
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

export function AppLayout() {
  return (
    <div className="app-shell">
      <Header />
      <main className="app-main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="container">Hotel Booking — demo front end for the HotelBooking API.</div>
      </footer>
    </div>
  );
}
