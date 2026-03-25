'use client';

import Image from 'next/image';
import { useState } from 'react';
import { X } from 'lucide-react';
import { getOptimisedUrl } from '@/lib/utils';

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
              src={getOptimisedUrl(url)}
              alt={`Post image ${i + 1}`}
              fill
              quality={90}
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

      {/* Lightbox — full-resolution viewer */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            onClick={() => setLightbox(null)}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div
            className="relative w-full max-w-3xl"
            style={{ maxHeight: '90dvh', aspectRatio: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getOptimisedUrl(lightbox)}
              alt="Full size"
              className="object-contain w-full h-full max-h-[90dvh] rounded-xl"
              style={{ maxHeight: '90dvh' }}
            />
          </div>
        </div>
      )}
    </>
  );
}
