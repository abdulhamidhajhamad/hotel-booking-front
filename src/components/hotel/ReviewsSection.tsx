import { useQuery } from '@tanstack/react-query';
import { reviewsApi } from '@/api/reviews';
import { Empty, ErrorAlert, Loading } from '@/components/ui/Feedback';
import { Pagination } from '@/components/ui/Pagination';
import { Stars } from '@/components/ui/Stars';
import { dateTime } from '@/lib/format';
import { useState } from 'react';

const PAGE_SIZE = 5;

export function ReviewsSection({ hotelId }: { hotelId: string }) {
  const [page, setPage] = useState(1);

  const { data, isPending, error } = useQuery({
    queryKey: ['reviews', hotelId, page],
    queryFn: () => reviewsApi.forHotel(hotelId, page, PAGE_SIZE),
  });

  if (isPending) return <Loading label="Loading reviews…" />;
  if (error) return <ErrorAlert error={error} fallback="Could not load reviews." />;
  if (!data || data.totalCount === 0) return <Empty>No guest reviews yet.</Empty>;

  return (
    <div className="stack">
      {data.items.map((review) => (
        <div key={review.id} className="stack-sm">
          <div className="row">
            <Stars value={review.rating} />
            <strong className="small">{review.reviewerName ?? 'Guest'}</strong>
            <span className="small muted">{dateTime(review.createdAt)}</span>
          </div>
          {review.comment && <p className="small">{review.comment}</p>}
        </div>
      ))}

      <Pagination
        page={data.page}
        totalPages={data.totalPages}
        totalCount={data.totalCount}
        onPageChange={setPage}
      />
    </div>
  );
}
