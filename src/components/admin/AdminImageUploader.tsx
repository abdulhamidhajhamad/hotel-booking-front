import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { UploadedImage } from '@/api/types';
import { Alert, ErrorAlert } from '@/components/ui/Feedback';
import { ImageManager } from '@/components/ui/ImageManager';

interface AdminImageUploaderProps {
  label: string;
  upload: (files: File[]) => Promise<UploadedImage[]>;
  remove: (imageId: string) => Promise<void>;
}

export function AdminImageUploader({ label, upload, remove }: AdminImageUploaderProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);

  const uploadImages = useMutation({
    mutationFn: upload,
    onSuccess: (uploaded) => setImages(uploaded),
  });

  const deleteImage = useMutation({
    mutationFn: remove,
    onSuccess: (_result, imageId) => setImages((current) => current.filter((image) => image.id !== imageId)),
  });

  return (
    <div className="stack">
      <h3>{label}</h3>
      <Alert tone="info">
        The API has no endpoint that lists these images, so only the ones uploaded right now are shown here.
      </Alert>

      <ErrorAlert error={uploadImages.error} fallback="Could not upload the images." />
      <ErrorAlert error={deleteImage.error} fallback="Could not delete the image." />

      <ImageManager
        images={images}
        uploading={uploadImages.isPending}
        onUpload={(files) => uploadImages.mutate(files)}
        onDelete={(imageId) => deleteImage.mutate(imageId)}
      />
    </div>
  );
}
