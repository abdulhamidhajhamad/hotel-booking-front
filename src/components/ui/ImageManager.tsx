import { useRef, useState, type DragEvent } from 'react';
import type { UploadedImage } from '@/api/types';
import { Alert } from './Feedback';
import { Button } from './Button';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_FILES = 20;

export function validateImages(files: File[]): string | null {
  if (files.length === 0) return 'Pick at least one image.';
  if (files.length > MAX_FILES) return `Upload at most ${MAX_FILES} images at once.`;

  const wrongType = files.find((file) => !ACCEPTED_TYPES.includes(file.type));
  if (wrongType) return `${wrongType.name} is not a JPEG, PNG or WebP image.`;

  const tooBig = files.find((file) => file.size > MAX_FILE_BYTES);
  if (tooBig) return `${tooBig.name} is larger than 5 MB.`;

  return null;
}

interface ImageManagerProps {
  images: UploadedImage[];
  uploading?: boolean;
  onUpload: (files: File[]) => void;
  onDelete: (imageId: string) => void;
  onSetPrimary?: (imageId: string) => void;
}

export function ImageManager({
  images,
  uploading = false,
  onUpload,
  onDelete,
  onSetPrimary,
}: ImageManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = (fileList: FileList | null) => {
    const files = Array.from(fileList ?? []);
    const problem = validateImages(files);
    setError(problem);
    if (!problem) onUpload(files);
    if (inputRef.current) inputRef.current.value = '';
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    submit(event.dataTransfer.files);
  };

  return (
    <div className="stack">
      {error && <Alert tone="error">{error}</Alert>}

      <div
        className={`dropzone ${dragOver ? 'over' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
      >
        {uploading ? 'Uploading…' : 'Drop images here or click to choose (JPEG, PNG, WebP · max 5 MB each)'}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_TYPES.join(',')}
        hidden
        onChange={(event) => submit(event.target.files)}
      />

      {images.length > 0 && (
        <div className="image-grid">
          {images.map((image) => (
            <div key={image.id} className="image-tile">
              <img src={image.url} alt="" loading="lazy" />
              <div className="image-actions">
                {onSetPrimary && (
                  <Button
                    size="sm"
                    variant={image.isPrimary ? 'primary' : 'default'}
                    disabled={image.isPrimary}
                    onClick={() => onSetPrimary(image.id)}
                  >
                    {image.isPrimary ? 'Primary' : 'Make primary'}
                  </Button>
                )}
                <Button size="sm" variant="danger" onClick={() => onDelete(image.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
