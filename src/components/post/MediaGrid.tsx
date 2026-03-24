'use client';

import Image from 'next/image';
import { useState } from 'react';
import { X } from 'lucide-react';

interface MediaGridProps {
  urls: string[];
}

export default function MediaGrid({ urls }: MediaGridProps) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (!urls.length) return null;

  const count = urls.length;

  const gridClass =
    count === 1
      ? 'grid-cols-1'
      : count === 2
        ? 'grid-cols-2'
        : count === 3
          ? 'grid-cols-3'
          : 'grid-cols-2';

  const aspectClass =
    count === 1 ? 'aspect-video' : count === 3 ? 'aspect-square' : 'aspect-square';

  return (
    <>
      <div className={`grid ${gridClass} gap-1 rounded-xl overflow-hidden`}>
        {urls.slice(0, 4).map((url, i) => (
          <button
            key={url}
            className={`relative ${aspectClass} overflow-hidden bg-surface-alt focus:outline-none`}
            onClick={() => setLightbox(url)}
            aria-label={`View image ${i + 1}`}
          >
            <Image
              src={url}
              alt={`Post image ${i + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 680px) 50vw, 340px"
            />
            {/* +N overlay on 4th image when more than 4 */}
            {i === 3 && count > 4 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white text-xl font-bold">+{count - 4}</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[300] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white p-2 rounded-full bg-black/50 hover:bg-black/70"
            onClick={() => setLightbox(null)}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="relative max-w-3xl max-h-full w-full" onClick={(e) => e.stopPropagation()}>
            <Image
              src={lightbox}
              alt="Full size"
              width={800}
              height={600}
              className="object-contain w-full h-auto max-h-[85vh] rounded-xl"
            />
          </div>
        </div>
      )}
    </>
  );
}
