import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { bookingsApi } from '@/api/bookings';
import { Button } from '@/components/ui/Button';
import { Alert, ErrorAlert, Loading } from '@/components/ui/Feedback';
import { money, plural, shortDate, dateTime } from '@/lib/format';
import { problemMessage } from '@/lib/problem';

function statusTone(status: string) {
  if (status === 'Succeeded') return 'badge-success';
  if (status === 'Failed') return 'badge-danger';
  return 'badge';
}

export function ConfirmationPage() {
  const { bookingGroupId = '' } = useParams();
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const { data: invoice, isPending, error } = useQuery({
    queryKey: ['invoice', bookingGroupId],
    queryFn: () => bookingsApi.invoice(bookingGroupId),
  });

  const downloadPdf = async () => {
    setPdfError(null);
    setDownloading(true);
    try {
      const blob = await bookingsApi.invoicePdf(bookingGroupId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoice?.confirmationNumber ?? bookingGroupId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (downloadFailure) {
      setPdfError(problemMessage(downloadFailure, 'Could not download the PDF invoice.'));
    } finally {
      setDownloading(false);
    }
  };

  if (isPending) return <Loading label="Loading your confirmation…" />;
  if (error)
    return (
      <div className="container">
        <ErrorAlert error={error} fallback="Could not load this booking." />
      </div>
    );
  if (!invoice) return null;

  return (
    <div className="container invoice stack">
      <Alert tone={invoice.paymentStatus === 'Succeeded' ? 'success' : 'warning'}>
        {invoice.paymentStatus === 'Succeeded'
          ? 'Booking confirmed. A confirmation email with the invoice is on its way.'
          : `Payment status: ${invoice.paymentStatus}.`}
      </Alert>

      <div className="card">
        <div className="card-body stack">
          <div className="row-between">
            <div className="stack-sm">
              <h1>Confirmation {invoice.confirmationNumber}</h1>
              <span className="small muted">Issued {dateTime(invoice.issuedAt)}</span>
            </div>
            <span className={`badge ${statusTone(invoice.paymentStatus)}`}>{invoice.paymentStatus}</span>
          </div>

          <div className="grid grid-2">
            <div className="stack-sm">
              <span className="small muted">Guest</span>
              <strong>{invoice.guestName}</strong>
              <span className="small">{invoice.guestEmail}</span>
            </div>
            <div className="stack-sm">
              <span className="small muted">Total paid</span>
              <strong className="price">
                {money(invoice.totalPrice)} {invoice.currency}
              </strong>
            </div>
          </div>

          <div className="stack">
            <h2>Booking details</h2>
            {invoice.lines.map((line, index) => (
              <div key={`${line.roomNumber}-${index}`} className="stack-sm">
                <div className="summary-line">
                  <strong>
                    {line.hotelName} · {line.roomType} · Room {line.roomNumber}
                  </strong>
                  <span>{money(line.lineTotal)}</span>
                </div>
                <span className="small muted">{line.hotelAddress}</span>
                <span className="small muted">
                  {shortDate(line.checkInDate)} → {shortDate(line.checkOutDate)} ·{' '}
                  {plural(line.nights, 'night')} · {money(line.discountedPricePerNight)} per night
                  {line.discountPerNight > 0 && ` (saved ${money(line.discountPerNight)} per night)`}
                </span>
              </div>
            ))}

            <div className="summary-total">
              <span>Total</span>
              <span>{money(invoice.totalPrice)}</span>
            </div>
          </div>

          {pdfError && <Alert tone="error">{pdfError}</Alert>}

          <div className="row no-print">
            <Button onClick={() => window.print()}>Print</Button>
            <Button variant="primary" loading={downloading} onClick={downloadPdf}>
              Save as PDF
            </Button>
            <span className="spacer" />
            <Link to="/bookings" className="btn btn-ghost">
              My bookings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
