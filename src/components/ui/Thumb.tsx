interface ThumbProps {
  url: string | null | undefined;
  alt: string;
  className?: string;
}

export function Thumb({ url, alt, className = '' }: ThumbProps) {
  if (!url) {
    return (
      <div className={`thumb thumb-placeholder ${className}`} aria-label={`${alt} (no image)`}>
        No image
      </div>
    );
  }

  return <img className={`thumb ${className}`} src={url} alt={alt} loading="lazy" />;
}
