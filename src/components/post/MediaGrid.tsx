'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import { X, Play, ChevronLeft, ChevronRight } from 'lucide-react';
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
  if (url.includes('/video/upload/')) {
    return url.replace('/video/upload/', '/video/upload/so_0,q_auto:good,f_jpg/').replace(/\.(mp4|webm|mov|ogg)(\?.*)?$/i, '.jpg');
  }
  return '';
}

export default function MediaGrid({ urls }: MediaGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // ── Keyboard navigation for lightbox ──────────────────────────────────────
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const showPrev = useCallback(() => {
    setLightboxIndex((i) => (i === null ? i : (i - 1 + urls.length) % urls.length));
  }, [urls.length]);
  const showNext = useCallback(() => {
    setLightboxIndex((i) => (i === null ? i : (i + 1) % urls.length));
  }, [urls.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') showPrev();
      else if (e.key === 'ArrowRight') showNext();
    };
    window.addEventListener('keydown', onKey);
    // Prevent body scroll while lightbox is open
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [lightboxIndex, closeLightbox, showPrev, showNext]);

  if (!urls.length) return null;

  const count = urls.length;
  const activeUrl = lightboxIndex !== null ? urls[lightboxIndex] : null;
  const lightboxIsVideo = activeUrl ? isVideoUrl(activeUrl) : false;

  // ── Single image: render at natural aspect (clamped) ──────────────────────
  if (count === 1) {
    const url = urls[0];
    const isVideo = isVideoUrl(url);

    return (
      <>
        <SingleMedia url={url} isVideo={isVideo} onOpen={() => setLightboxIndex(0)} />

        <Lightbox
          urls={urls}
          index={lightboxIndex}
          onClose={closeLightbox}
          onPrev={showPrev}
          onNext={showNext}
          isVideo={lightboxIsVideo}
        />
      </>
    );
  }

  // ── Grid for 2+ images (thumbnails preserve a uniform look) ──────────────
  const gridClass =
    count === 2 ? 'grid-cols-2'
      : count === 3 ? 'grid-cols-3'
        : 'grid-cols-2';

  return (
    <>
      <div className={`grid ${gridClass} gap-1 rounded-xl overflow-hidden`}>
        {urls.slice(0, 4).map((url, i) => {
          const isVideo = isVideoUrl(url);
          const poster = isVideo ? getVideoPosterUrl(url) : undefined;

          return (
            <button
              key={url}
              type="button"
              className="relative aspect-square overflow-hidden bg-surface-alt focus:outline-none"
              onClick={() => setLightboxIndex(i)}
              aria-label={isVideo ? `Play video ${i + 1}` : `View image ${i + 1}`}
            >
              {isVideo ? (
                <>
                  {poster ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={poster}
                      alt={`Video ${i + 1} thumbnail`}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <video
                      src={url}
                      preload="metadata"
                      muted
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
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

              {i === 3 && count > 4 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white text-xl font-bold">+{count - 4}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <Lightbox
        urls={urls}
        index={lightboxIndex}
        onClose={closeLightbox}
        onPrev={showPrev}
        onNext={showNext}
        isVideo={lightboxIsVideo}
      />
    </>
  );
}

// ── Single image/video with natural aspect (clamped) ───────────────────────

interface SingleMediaProps {
  url: string;
  isVideo: boolean;
  onOpen: () => void;
}

function SingleMedia({ url, isVideo, onOpen }: SingleMediaProps) {
  // Default aspect while the image is loading. Once loaded, we clamp the
  // natural aspect ratio to a sensible range (3:4 portrait to 16:9 landscape)
  // so the feed card stays readable but the image is never cropped.
  const [aspect, setAspect] = useState<number>(4 / 3);
  const poster = isVideo ? getVideoPosterUrl(url) : undefined;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative block w-full rounded-xl overflow-hidden bg-surface-alt focus:outline-none"
      style={{ aspectRatio: aspect }}
      aria-label={isVideo ? 'Play video' : 'View image'}
    >
      {isVideo ? (
        <>
          {poster ? (
            <Image
              src={poster}
              alt="Video thumbnail"
              fill
              className="object-cover"
              sizes="(max-width: 680px) 100vw, 680px"
            />
          ) : (
            <video
              src={url}
              preload="metadata"
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/25">
            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-6 h-6 text-white fill-white translate-x-0.5" />
            </div>
          </div>
        </>
      ) : (
        <Image
          src={getOptimisedUrl(url, 1200)}
          alt="Post image"
          fill
          className="object-contain"
          sizes="(max-width: 680px) 100vw, 680px"
          onLoadingComplete={(img) => {
            const natural = img.naturalWidth / img.naturalHeight;
            // Clamp: portrait max 3:4 (0.75), landscape max 16:9 (1.78)
            const clamped = Math.max(0.75, Math.min(1.78, natural));
            setAspect(clamped);
          }}
        />
      )}
    </button>
  );
}

// ── Full-screen carousel lightbox ───────────────────────────────────────────

interface LightboxProps {
  urls: string[];
  index: number | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  isVideo: boolean;
}

function Lightbox({ urls, index, onClose, onPrev, onNext, isVideo }: LightboxProps) {
  if (index === null) return null;
  const url = urls[index];
  const hasMultiple = urls.length > 1;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        type="button"
        className="absolute top-4 right-4 z-10 text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Image counter */}
      {hasMultiple && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white text-xs font-medium">
          {index + 1} / {urls.length}
        </div>
      )}

      {/* Previous */}
      {hasMultiple && (
        <button
          type="button"
          className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          aria-label="Previous image"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Next */}
      {hasMultiple && (
        <button
          type="button"
          className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          aria-label="Next image"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Media */}
      <div
        className="relative w-full h-full flex items-center justify-center p-4 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {isVideo ? (
          <video
            key={url}
            src={url}
            controls
            autoPlay
            playsInline
            preload="metadata"
            className="max-w-full max-h-full rounded-xl"
          />
        ) : (
          <Image
            key={url}
            src={getOptimisedUrl(url, 1600)}
            alt={`Image ${index + 1}`}
            width={1600}
            height={1600}
            sizes="(max-width: 768px) 100vw, 1200px"
            className="max-w-full max-h-full w-auto h-auto object-contain rounded-xl"
            priority
          />
        )}
      </div>
    </div>
  );
}
