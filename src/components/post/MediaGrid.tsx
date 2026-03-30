'use client';

import Image from 'next/image';
import { useState } from 'react';
import { X, Play } from 'lucide-react';
import { getOptimisedUrl } from '@/lib/utils';

interface MediaGridProps {
  urls: string[];
}

function isVideoUrl(url: string): boolean {
  return (
    /\.(mp4|webm|mov|ogg)(\?|$)/i.test(url) ||
    url.includes('/video/upload/')
  );
}

/**
 * Returns a Cloudinary thumbnail URL for a video URL.
 * Replaces /video/upload/ with /video/upload/<transforms>/ and changes extension to .jpg
 * so Cloudinary auto-generates a poster image.
 */
function getVideoPosterUrl(url: string): string {
  if (!url.includes('res.cloudinary.com')) return '';
  // Cloudinary: swap /video/upload/ → /video/upload/so_0,q_auto:good,f_jpg/ for poster
  if (url.includes('/video/upload/')) {
    return url.replace('/video/upload/', '/video/upload/so_0,q_auto:good,f_jpg/').replace(/\.(mp4|webm|mov|ogg)(\?.*)?$/i, '.jpg');
  }
  return '';
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
    count === 1 ? 'aspect-video' : 'aspect-square';

  const lightboxIsVideo = lightbox ? isVideoUrl(lightbox) : false;

  return (
    <>
      <div className={`grid ${gridClass} gap-1 rounded-xl overflow-hidden`}>
        {urls.slice(0, 4).map((url, i) => {
          const isVideo = isVideoUrl(url);
          const poster = isVideo ? getVideoPosterUrl(url) : undefined;

          return (
            <button
              key={url}
              className={`relative ${aspectClass} overflow-hidden bg-surface-alt focus:outline-none`}
              onClick={() => setLightbox(url)}
              aria-label={isVideo ? `Play video ${i + 1}` : `View image ${i + 1}`}
            >
              {isVideo ? (
                <>
                  {/* Poster frame — loads one JPEG thumbnail instead of downloading the full video */}
                  {poster ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={poster}
                      alt={`Video ${i + 1} thumbnail`}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    // Fallback: load just metadata so browser can show first frame
                    <video
                      src={url}
                      preload="metadata"
                      muted
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Play className="w-5 h-5 text-white fill-white translate-x-0.5" />
                    </div>
                  </div>
                </>
              ) : (
                <Image
                  src={getOptimisedUrl(url, 680)}
                  alt={`Post image ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 680px) 50vw, 340px"
                  loading="lazy"
                />
              )}

              {/* +N overlay on 4th item when more than 4 */}
              {i === 3 && count > 4 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white text-xl font-bold">+{count - 4}</span>
                </div>
              )}
            </button>
          );
        })}
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
            className="relative w-full max-w-3xl flex items-center justify-center"
            style={{ maxHeight: '90dvh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {lightboxIsVideo ? (
              <video
                src={lightbox}
                controls
                autoPlay
                playsInline
                preload="metadata"
                className="w-full max-h-[90dvh] rounded-xl"
                style={{ maxHeight: '90dvh' }}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getOptimisedUrl(lightbox)}
                alt="Full size"
                className="object-contain w-full max-h-[90dvh] rounded-xl"
                style={{ maxHeight: '90dvh' }}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
