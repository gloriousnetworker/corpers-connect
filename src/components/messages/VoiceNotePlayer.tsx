'use client';

import { useState, useRef, useCallback } from 'react';
import { Play, Pause, AlertCircle } from 'lucide-react';

interface VoiceNotePlayerProps {
  mediaUrl: string;
  isOwn: boolean;
}

function formatDuration(secs: number): string {
  if (!isFinite(secs) || secs < 0) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Uses a real DOM <audio> element instead of new Audio() for better
 * cross-browser compatibility. The element is hidden but present in the
 * DOM, which gives browsers the best chance of loading and playing audio.
 */
export default function VoiceNotePlayer({ mediaUrl, isOwn }: VoiceNotePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      setLoadError(false);
      audio.play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          setIsPlaying(false);
          setLoadError(true);
        });
    }
  }, [isPlaying]);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
    setCurrentTime(audio.currentTime);
  }, [duration]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const trackBg = isOwn ? 'bg-white/25' : 'bg-foreground/15';
  const fillBg = isOwn ? 'bg-white' : 'bg-primary';
  const iconColor = isOwn ? 'text-white' : 'text-primary';
  const timeColor = isOwn ? 'text-white/70' : 'text-foreground-muted';

  return (
    <div className="flex items-center gap-2 w-48 py-0.5">
      {/* Hidden <audio> element — DOM-rendered for best browser compat */}
      <audio
        ref={audioRef}
        src={mediaUrl}
        preload="metadata"
        crossOrigin="anonymous"
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (isFinite(d)) setDuration(d);
        }}
        onDurationChange={(e) => {
          const d = e.currentTarget.duration;
          if (isFinite(d) && d > 0) setDuration(d);
        }}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onEnded={() => { setIsPlaying(false); setCurrentTime(0); }}
        onError={() => { setDuration(0); setLoadError(true); }}
        className="hidden"
      />

      <button
        onClick={togglePlay}
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-transform active:scale-90 ${
          loadError
            ? 'bg-red-100 dark:bg-red-900/30'
            : isOwn ? 'bg-white/20 hover:bg-white/30' : 'bg-primary/10 hover:bg-primary/20'
        }`}
        aria-label={loadError ? 'Retry audio' : isPlaying ? 'Pause' : 'Play'}
      >
        {loadError
          ? <AlertCircle className="w-4 h-4 text-red-500" />
          : isPlaying
          ? <Pause className={`w-4 h-4 ${iconColor}`} />
          : <Play className={`w-4 h-4 ${iconColor} translate-x-px`} />
        }
      </button>

      <div className="flex flex-col flex-1 gap-1.5">
        <div
          onClick={handleProgressClick}
          className={`relative h-1.5 rounded-full cursor-pointer ${trackBg}`}
        >
          <div
            className={`absolute inset-y-0 left-0 rounded-full transition-all duration-100 ${fillBg}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className={`text-[10px] tabular-nums ${timeColor}`}>
          {isPlaying ? formatDuration(currentTime) : formatDuration(duration)}
        </span>
      </div>
    </div>
  );
}
