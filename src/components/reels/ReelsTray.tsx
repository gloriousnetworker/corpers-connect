'use client';

import { useQuery } from '@tanstack/react-query';
import { Film, Play } from 'lucide-react';
import Image from 'next/image';
import { useUIStore } from '@/store/ui.store';
import { getReels } from '@/lib/api/reels';
import { getAvatarUrl, getInitials } from '@/lib/utils';

function getVideoPosterUrl(url: string): string {
  if (!url.includes('res.cloudinary.com')) return '';
  if (url.includes('/video/upload/')) {
    return url
      .replace('/video/upload/', '/video/upload/so_0,q_auto:good,f_jpg/')
      .replace(/\.(mp4|webm|mov|ogg)(\?.*)?$/i, '.jpg');
  }
  return '';
}

function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov|ogg)(\?|$)/i.test(url) || url.includes('/video/upload/');
}

export default function ReelsTray() {
  const setActiveSection = useUIStore((s) => s.setActiveSection);

  const { data } = useQuery({
    queryKey: ['reels-tray'],
    queryFn: () => getReels({ limit: 8 }),
    staleTime: 120_000,
  });

  const reels = data?.items ?? [];
  if (reels.length === 0) return null;

  return (
    <div className="bg-surface rounded-2xl border border-border shadow-card py-3">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-2">
        <div className="flex items-center gap-1.5">
          <Film className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Reels</span>
        </div>
        <button
          onClick={() => setActiveSection('reels')}
          className="text-xs font-medium text-primary hover:underline"
        >
          See all
        </button>
      </div>

      {/* Horizontal reel thumbnails */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none">
        {reels.map((reel) => {
          const mediaUrl = reel.mediaUrls?.[0];
          const isVideo = mediaUrl ? isVideoUrl(mediaUrl) : false;
          const poster = isVideo && mediaUrl ? getVideoPosterUrl(mediaUrl) : undefined;
          const initials = getInitials(reel.author.firstName, reel.author.lastName);

          return (
            <button
              key={reel.id}
              onClick={() => setActiveSection('reels')}
              className="flex-shrink-0 relative w-[72px] rounded-xl overflow-hidden bg-surface-alt focus:outline-none"
              style={{ aspectRatio: '9/16' }}
              aria-label={`View reel by ${reel.author.firstName}`}
            >
              {/* Thumbnail */}
              {poster ? (
                <Image src={poster} alt="" fill className="object-cover" sizes="72px" />
              ) : mediaUrl ? (
                <video
                  src={mediaUrl}
                  preload="none"
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                  <Film className="w-5 h-5 text-primary" />
                </div>
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70 pointer-events-none" />

              {/* Play icon */}
              <div className="absolute top-2 right-2">
                <Play className="w-3 h-3 text-white fill-white drop-shadow" />
              </div>

              {/* Author avatar */}
              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2">
                <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-white bg-primary/10 flex items-center justify-center">
                  {reel.author.profilePicture ? (
                    <Image
                      src={getAvatarUrl(reel.author.profilePicture, 56)}
                      alt={initials}
                      width={28}
                      height={28}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <span className="text-[8px] font-bold text-primary uppercase">{initials}</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
