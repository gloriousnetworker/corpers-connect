'use client';

import Image from 'next/image';
import { useState, useCallback, useRef, useEffect } from 'react';
import { Play } from 'lucide-react';
import { getOptimisedUrl } from '@/lib/utils';

export interface MediaGridProps {
  urls: string[];
  /** When provided, clicking opens PostCarousel instead of a basic lightbox */
  onOpenCarousel?: (index: number) => void;
}

function isVideoUrl(url: string): boolean {
  return (
    /\.(mp4|webm|mov|ogg)(\?|$)/i.test(url) ||
    url.includes('/video/upload/')
  );
}

function getVideoPosterUrl(url: string): string {
  if (!url.includes('res.cloudinary.com')) return '';
  if (url.includes('/video/upload/')) {
    return url.replace('/video/upload/', '/video/upload/so_0,q_auto:good,f_jpg/').replace(/\.(mp4|webm|mov|ogg)(\?.*)?$/i, '.jpg');
  }
  return '';
}

// ── Thumbnail tile used in all grid layouts ────────────────────────────────

interface TileProps {
  url: string;
  index: number;
  onClick: () => void;
  className?: string;
  overlay?: React.ReactNode;
}

function Tile({ url, index, onClick, className = '', overlay }: TileProps) {
  const isVideo = isVideoUrl(url);
  const poster = isVideo ? getVideoPosterUrl(url) : undefined;

  return (
    <button
      type="button"
      className={`relative overflow-hidden bg-surface-alt focus:outline-none ${className}`}
      onClick={onClick}
      aria-label={isVideo ? `Play video ${index + 1}` : `View image ${index + 1}`}
    >
      {isVideo ? (
        <>
          {poster ? (
            <Image src={poster} alt="" fill className="object-cover" sizes="340px" loading="lazy" />
          ) : (
            <video src={url} preload="metadata" muted playsInline className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/25">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-4 h-4 text-white fill-white translate-x-px" />
            </div>
          </div>
        </>
      ) : (
        <Image
          src={getOptimisedUrl(url, 1200)}
          alt={`Post image ${index + 1}`}
          fill
          className="object-cover"
          sizes="(max-width: 680px) 50vw, 680px"
          loading="lazy"
        />
      )}
      {overlay}
    </button>
  );
}

// ── Single image with natural aspect ─────────────────────────────────────

function SingleMedia({ url, onClick }: { url: string; onClick: () => void }) {
  const isVideo = isVideoUrl(url);
  const [aspect, setAspect] = useState<number>(4 / 3);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Autoplay video when 60%+ visible
  useEffect(() => {
    if (!isVideo) return;
    const el = videoRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.play().catch(() => {});
          setPlaying(true);
        } else {
          el.pause();
          setPlaying(false);
        }
      },
      { threshold: 0.6 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isVideo]);

  // Cap portrait videos at 1.0 (square) so they don't dominate laptop viewports.
  // Wider videos use their natural ratio up to 16:9.
  const handleVideoMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const vid = e.currentTarget;
    if (vid.videoWidth && vid.videoHeight) {
      const natural = vid.videoWidth / vid.videoHeight;
      setAspect(Math.max(1.0, Math.min(1.78, natural)));
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative block w-full rounded-xl overflow-hidden bg-surface-alt focus:outline-none mx-auto"
      style={{ aspectRatio: aspect, maxHeight: '70vh' }}
      aria-label={isVideo ? 'View video' : 'View image'}
    >
      {isVideo ? (
        <>
          <video
            ref={videoRef}
            src={url}
            loop
            muted
            playsInline
            preload="metadata"
            className="absolute inset-0 w-full h-full object-cover"
            onLoadedMetadata={handleVideoMetadata}
          />
          {!playing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/25">
              <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Play className="w-6 h-6 text-white fill-white translate-x-0.5" />
              </div>
            </div>
          )}
        </>
      ) : (
        <Image
          src={getOptimisedUrl(url, 1600)}
          alt="Post image"
          fill
          className="object-contain"
          sizes="(max-width: 680px) 100vw, 680px"
          onLoadingComplete={(img) => {
            const natural = img.naturalWidth / img.naturalHeight;
            // Cap portrait at square (1.0) so tall images don't blow up the
            // post height on laptop. Landscape uses natural ratio up to 16:9.
            const clamped = Math.max(1.0, Math.min(1.78, natural));
            setAspect(clamped);
          }}
        />
      )}
    </button>
  );
}

// ── Main component ──────────────────────────────────────────────────────

export default function MediaGrid({ urls, onOpenCarousel }: MediaGridProps) {
  const open = useCallback((i: number) => {
    if (onOpenCarousel) onOpenCarousel(i);
  }, [onOpenCarousel]);

  if (!urls.length) return null;
  const count = urls.length;

  // ── 1 image ─────────────────────────────────────────────────────────────
  if (count === 1) {
    return <SingleMedia url={urls[0]} onClick={() => open(0)} />;
  }

  // ── 2 images: side by side ──────────────────────────────────────────────
  if (count === 2) {
    return (
      <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden">
        <Tile url={urls[0]} index={0} onClick={() => open(0)} className="aspect-[3/4]" />
        <Tile url={urls[1]} index={1} onClick={() => open(1)} className="aspect-[3/4]" />
      </div>
    );
  }

  // ── 3 images: 1 big left + 2 stacked right ─────────────────────────────
  if (count === 3) {
    return (
      <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden" style={{ aspectRatio: '4 / 3' }}>
        <Tile url={urls[0]} index={0} onClick={() => open(0)} className="row-span-2" />
        <Tile url={urls[1]} index={1} onClick={() => open(1)} className="" />
        <Tile url={urls[2]} index={2} onClick={() => open(2)} className="" />
      </div>
    );
  }

  // ── 4+ images: show 3 tiles, +N on last ─────────────────────────────────
  const extra = count - 3;
  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden" style={{ aspectRatio: '4 / 3' }}>
      <Tile url={urls[0]} index={0} onClick={() => open(0)} className="row-span-2" />
      <Tile url={urls[1]} index={1} onClick={() => open(1)} className="" />
      <Tile
        url={urls[2]}
        index={2}
        onClick={() => open(2)}
        className=""
        overlay={
          extra > 0 ? (
            <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-black/80 flex flex-col items-center justify-center gap-0.5 backdrop-blur-[1px]">
              <span className="text-white text-2xl font-extrabold tracking-tight leading-none drop-shadow">
                +{extra}
              </span>
              <span className="text-white/80 text-[10px] font-medium uppercase tracking-wider">
                more
              </span>
            </div>
          ) : undefined
        }
      />
    </div>
  );
}
