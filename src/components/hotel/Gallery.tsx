import { useEffect, useState } from 'react';
import type { HotelImage } from '@/api/types';
import { Button } from '@/components/ui/Button';
import { Empty } from '@/components/ui/Feedback';

export function Gallery({ images, alt }: { images: HotelImage[]; alt: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    if (openIndex === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenIndex(null);
      if (event.key === 'ArrowRight') setOpenIndex((index) => ((index ?? 0) + 1) % images.length);
      if (event.key === 'ArrowLeft')
        setOpenIndex((index) => ((index ?? 0) - 1 + images.length) % images.length);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openIndex, images.length]);

  if (images.length === 0) return <Empty>This hotel has no photos yet.</Empty>;

  const visible = images.slice(0, 5);

  return (
    <>
      <div className="gallery">
        {visible.map((image, index) => (
          <img
            key={image.id}
            src={image.url}
            alt={alt}
            loading="lazy"
            onClick={() => setOpenIndex(index)}
          />
        ))}
      </div>

      {images.length > visible.length && (
        <span className="small muted">+{images.length - visible.length} more photos</span>
      )}

      {openIndex !== null && (
        <div className="lightbox" onClick={() => setOpenIndex(null)} role="presentation">
          <img
            src={images[openIndex].url}
            alt={alt}
            onClick={(event) => event.stopPropagation()}
          />
          <Button className="lightbox-close" onClick={() => setOpenIndex(null)}>
            Close
          </Button>
          {images.length > 1 && (
            <>
              <Button
                className="lightbox-nav prev"
                onClick={(event) => {
                  event.stopPropagation();
                  setOpenIndex((index) => ((index ?? 0) - 1 + images.length) % images.length);
                }}
              >
                ‹
              </Button>
              <Button
                className="lightbox-nav next"
                onClick={(event) => {
                  event.stopPropagation();
                  setOpenIndex((index) => ((index ?? 0) + 1) % images.length);
                }}
              >
                ›
              </Button>
            </>
          )}
        </div>
      )}
    </>
  );
}
