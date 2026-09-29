import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { bookingsApi } from '@/api/bookings';
import type { CreateBookingRequest, CreateBookingResult } from '@/api/types';
import { Button } from '@/components/ui/Button';
import { Alert, Empty, ErrorAlert } from '@/components/ui/Feedback';
import { SelectInput, TextArea, TextInput } from '@/components/ui/Field';
import { useAuth } from '@/features/auth/AuthContext';
import { cartItemKey, itemNights, itemTotal, useCart } from '@/features/cart/CartContext';
import { testPaymentMethods } from '@/features/checkout/paymentMethods';
import { bookingHistory } from '@/lib/localHistory';
import { money, plural, shortDate } from '@/lib/format';

const MAX_SPECIAL_REQUESTS = 1000;

function newIdempotencyKey() {
  return crypto.randomUUID();
}

function useCountdown(target: string | null) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!target) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!target) return { secondsLeft: 0, expired: false, label: '' };

  const secondsLeft = Math.max(0, Math.floor((new Date(target).getTime() - now) / 1000));
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return {
    secondsLeft,
    expired: secondsLeft <= 0,
    label: `${minutes}:${seconds.toString().padStart(2, '0')}`,
  };
}

export function CheckoutPage() {
  const cart = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [paymentMethodId, setPaymentMethodId] = useState(testPaymentMethods[0].id);
  const [specialRequests, setSpecialRequests] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey);
  const [hold, setHold] = useState<CreateBookingResult | null>(null);

  const request = useMemo<CreateBookingRequest>(
    () => ({
      specialRequests: specialRequests.trim() || null,
      rooms: cart.items.map((item) => ({
        roomId: item.roomId,
        checkInDate: item.checkIn,
        checkOutDate: item.checkOut,
        adults: item.adults,
        children: item.children,
      })),
    }),
    [specialRequests, cart.items],
  );

  useEffect(() => {
    if (!hold) setIdempotencyKey(newIdempotencyKey());
  }, [request, hold]);

  const countdown = useCountdown(hold?.holdExpiresAt ?? null);

  const holdRooms = useMutation({
    mutationFn: () => bookingsApi.createHold(request, idempotencyKey),
    onSuccess: (result) => setHold(result),
  });

  const pay = useMutation({
    mutationFn: () => bookingsApi.pay(hold!.bookingGroupId, paymentMethodId),
    onSuccess: (result) => {
      bookingHistory.add({
        bookingGroupId: result.bookingGroupId,
        confirmationNumber: result.confirmationNumber,
        totalPrice: result.totalPrice,
        paymentStatus: result.paymentStatus,
        hotelNames: [...new Set(cart.items.map((item) => item.hotelName))],
        createdAt: new Date().toISOString(),
      });
      cart.clear();
      navigate(`/bookings/${result.bookingGroupId}`, { replace: true });
    },
  });

  function startOver() {
    setHold(null);
    pay.reset();
    holdRooms.reset();
    setIdempotencyKey(newIdempotencyKey());
  }

  if (cart.count === 0 && !hold && !pay.isPending) {
    return (
      <div className="container stack">
        <h1>Checkout</h1>
        <Empty>
          Your cart is empty. <Link to="/search">Pick a room</Link> first.
        </Empty>
      </div>
    );
  }

  const selected = testPaymentMethods.find((method) => method.id === paymentMethodId);
  const stage = hold ? 'payment' : 'details';
  const total = hold?.totalPrice ?? cart.total;

  return (
    <div className="container stack-lg">
      <h1>Secure checkout</h1>

      <div className="steps">
        <span className={`step ${stage === 'details' ? 'step-active' : 'step-done'}`}>1 · Hold your rooms</span>
        <span className={`step ${stage === 'payment' ? 'step-active' : ''}`}>2 · Payment</span>
      </div>

      <div className="detail-layout">
        <div className="stack">
          {stage === 'details' ? (
            <section className="card">
              <div className="card-body stack">
                <h2>Guest details</h2>
                <TextInput
                  label="Email"
                  value={user?.email ?? ''}
                  readOnly
                  hint="Taken from your account — the invoice is emailed here."
                />
                <TextArea
                  label="Special requests or remarks"
                  placeholder="Late arrival, high floor, extra pillows…"
                  maxLength={MAX_SPECIAL_REQUESTS}
                  value={specialRequests}
                  onChange={(event) => setSpecialRequests(event.target.value)}
                  hint={`${specialRequests.length}/${MAX_SPECIAL_REQUESTS} characters`}
                />
                <ErrorAlert error={holdRooms.error} fallback="The rooms could not be held." />
              </div>
            </section>
          ) : (
            <section className="card">
              <div className="card-body stack">
                <h2>Payment method</h2>

                {countdown.expired ? (
                  <Alert tone="warning">
                    Your hold expired. The rooms have been released — start over to try again.
                  </Alert>
                ) : (
                  <Alert tone="success">
                    Rooms held under confirmation <strong>{hold!.confirmationNumber}</strong>. Complete payment within{' '}
                    <strong>{countdown.label}</strong> or the hold is released.
                  </Alert>
                )}

                <Alert tone="info">
                  The API charges through Stripe in test mode, so pick one of Stripe&apos;s test cards below. No real
                  card details are collected or sent.
                </Alert>
                <SelectInput
                  label="Test card"
                  value={paymentMethodId}
                  onChange={(event) => setPaymentMethodId(event.target.value)}
                  disabled={countdown.expired}
                >
                  {testPaymentMethods.map((method) => (
                    <option key={method.id} value={method.id}>
                      {method.label} — {method.outcome}
                    </option>
                  ))}
                </SelectInput>
                {selected && <span className="small muted">Sends paymentMethodId: {selected.id}</span>}

                <ErrorAlert error={pay.error} fallback="The payment could not be completed." />
                {(pay.isError || countdown.expired) && (
                  <Button variant="ghost" onClick={startOver}>
                    Start over
                  </Button>
                )}
              </div>
            </section>
          )}
        </div>

        <div className="card summary">
          <div className="card-body stack">
            <h3>Order summary</h3>

            {cart.items.map((item) => (
              <div key={cartItemKey(item)} className="stack-sm">
                <div className="summary-line">
                  <span>
                    {item.hotelName} · Room {item.roomNumber}
                  </span>
                  <span>{money(itemTotal(item))}</span>
                </div>
                <span className="small muted">
                  {shortDate(item.checkIn)} → {shortDate(item.checkOut)} · {plural(itemNights(item), 'night')}
                </span>
              </div>
            ))}

            <div className="summary-total">
              <span>Total</span>
              <span>{money(total)}</span>
            </div>

            {stage === 'details' ? (
              <Button variant="primary" block loading={holdRooms.isPending} onClick={() => holdRooms.mutate()}>
                Hold rooms &amp; continue
              </Button>
            ) : (
              <Button
                variant="primary"
                block
                loading={pay.isPending}
                disabled={countdown.expired}
                onClick={() => pay.mutate()}
              >
                Pay {money(total)}
              </Button>
            )}

            <span className="small muted">
              {stage === 'details'
                ? 'We hold the rooms for 15 minutes while you pay. Nothing is charged yet.'
                : 'Rooms are confirmed only once payment succeeds.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
