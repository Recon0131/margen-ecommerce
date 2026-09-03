'use client';

import { useState } from 'react';

type GalleryImage = { url: string; alt: string };

export function ProductGallery({ images, fallback }: { images: GalleryImage[]; fallback: string }) {
  const [active, setActive] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="product-gallery-main">
        <span style={{ color: 'var(--color-text-muted)' }}>{fallback}</span>
      </div>
    );
  }

  const current = images[active] ?? images[0];

  return (
    <div>
      <div className="product-gallery-main">
        <img src={current.url} alt={current.alt} />
      </div>
      {images.length > 1 && (
        <div className="product-gallery-thumbs" role="group" aria-label="Galería de imágenes">
          {images.map((img, i) => (
            <button
              key={img.url + i}
              type="button"
              className={`product-gallery-thumb ${i === active ? 'is-active' : ''}`}
              onClick={() => setActive(i)}
              aria-label={`Ver imagen ${i + 1} de ${images.length}`}
              aria-pressed={i === active}
            >
              <img src={img.url} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
