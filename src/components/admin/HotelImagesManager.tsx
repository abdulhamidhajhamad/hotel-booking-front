import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminHotelsApi } from '@/api/admin/hotels';
import { hotelsApi } from '@/api/hotels';
import { ErrorAlert, Loading } from '@/components/ui/Feedback';
import { ImageManager } from '@/components/ui/ImageManager';

export function HotelImagesManager({ hotelId }: { hotelId: string }) {
  const queryClient = useQueryClient();
  const queryKey = ['hotel-images', hotelId];

  const { data, isPending, error } = useQuery({
    queryKey,
    queryFn: () => hotelsApi.details(hotelId),
    select: (hotel) => hotel.images,
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey });
    void queryClient.invalidateQueries({ queryKey: ['hotel', hotelId] });
  };

  const upload = useMutation({
    mutationFn: (files: File[]) => adminHotelsApi.uploadImages(hotelId, files),
    onSuccess: refresh,
  });

  const remove = useMutation({
    mutationFn: (imageId: string) => adminHotelsApi.deleteImage(hotelId, imageId),
    onSuccess: refresh,
  });

  const setPrimary = useMutation({
    mutationFn: (imageId: string) => adminHotelsApi.setPrimaryImage(hotelId, imageId),
    onSuccess: refresh,
  });

  if (isPending) return <Loading label="Loading images…" />;

  return (
    <div className="stack">
      <h3>Hotel images</h3>
      <ErrorAlert error={error} fallback="Could not load the hotel images." />
      <ErrorAlert error={upload.error} fallback="Could not upload the images." />
      <ErrorAlert error={remove.error} fallback="Could not delete the image." />
      <ErrorAlert error={setPrimary.error} fallback="Could not set the primary image." />

      <ImageManager
        images={data ?? []}
        uploading={upload.isPending}
        onUpload={(files) => upload.mutate(files)}
        onDelete={(imageId) => remove.mutate(imageId)}
        onSetPrimary={(imageId) => setPrimary.mutate(imageId)}
      />
    </div>
  );
}
