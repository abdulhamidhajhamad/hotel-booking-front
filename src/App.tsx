import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AppLayout } from '@/components/layout/AppLayout';
import { RequireAdmin, RequireAuth } from '@/components/layout/RouteGuards';
import { CartPage } from '@/pages/CartPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { ConfirmationPage } from '@/pages/ConfirmationPage';
import { HomePage } from '@/pages/HomePage';
import { HotelPage } from '@/pages/HotelPage';
import { MyBookingsPage } from '@/pages/MyBookingsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { SearchPage } from '@/pages/SearchPage';
import { AdminAmenitiesPage } from '@/pages/admin/AdminAmenitiesPage';
import { AdminCitiesPage } from '@/pages/admin/AdminCitiesPage';
import { AdminDiscountsPage } from '@/pages/admin/AdminDiscountsPage';
import { AdminHotelsPage } from '@/pages/admin/AdminHotelsPage';
import { AdminOutboxPage } from '@/pages/admin/AdminOutboxPage';
import { AdminRoomTypesPage } from '@/pages/admin/AdminRoomTypesPage';
import { AdminRoomsPage } from '@/pages/admin/AdminRoomsPage';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { ConfirmEmailPage } from '@/pages/auth/ConfirmEmailPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ResendConfirmationPage } from '@/pages/auth/ResendConfirmationPage';

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="hotels/:hotelId" element={<HotelPage />} />
        <Route path="cart" element={<CartPage />} />

        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="confirm-email" element={<ConfirmEmailPage />} />
        <Route path="resend-confirmation" element={<ResendConfirmationPage />} />

        <Route element={<RequireAuth />}>
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="bookings" element={<MyBookingsPage />} />
          <Route path="bookings/:bookingGroupId" element={<ConfirmationPage />} />
        </Route>

        <Route path="admin" element={<RequireAdmin />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/cities" replace />} />
            <Route path="cities" element={<AdminCitiesPage />} />
            <Route path="hotels" element={<AdminHotelsPage />} />
            <Route path="hotels/:hotelId/rooms" element={<AdminRoomsPage />} />
            <Route path="room-types" element={<AdminRoomTypesPage />} />
            <Route path="amenities" element={<AdminAmenitiesPage />} />
            <Route path="discounts" element={<AdminDiscountsPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="outbox" element={<AdminOutboxPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
