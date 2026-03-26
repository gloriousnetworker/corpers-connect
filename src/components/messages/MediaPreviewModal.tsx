'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { X, Download } from 'lucide-react';
import ClientPortal from '@/components/ui/ClientPortal';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

interface MediaPreviewModalProps {
  url: string;
  type: 'image' | 'video';
  caption?: string | null;
  onClose: () => void;
}

export default function MediaPreviewModal({
  url,
  type,
  caption,
  onClose,
}: MediaPreviewModalProps) {
  useBodyScrollLock(true);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <ClientPortal>
      <div
        className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Media preview"
      >
        {/* Top bar */}
        <div
          className="absolute top-0 inset-x-0 flex items-center justify-between px-4 py-3 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            aria-label="Close preview"
          >
            <X className="w-5 h-5" />
          </button>
          <a
            href={url}
            download
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            aria-label="Download"
          >
            <Download className="w-5 h-5" />
          </a>
        </div>

        {/* Media */}
        <div
          className="relative w-full h-full flex items-center justify-center px-4"
          onClick={(e) => e.stopPropagation()}
        >
          {type === 'video' ? (
            <video
              src={url}
              controls
              autoPlay
              className="max-w-full max-h-[85dvh] rounded-lg"
            />
          ) : (
            <div className="relative w-full max-w-2xl" style={{ aspectRatio: 'unset' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={caption ?? 'Preview'}
                className="max-w-full max-h-[85dvh] object-contain mx-auto block rounded-lg"
              />
            </div>
          )}
        </div>

        {/* Caption */}
        {caption && (
          <div
            className="absolute bottom-0 inset-x-0 px-6 py-4 bg-gradient-to-t from-black/60 to-transparent"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-white text-sm text-center leading-relaxed">{caption}</p>
          </div>
        )}
      </div>
    </ClientPortal>
  );
}
