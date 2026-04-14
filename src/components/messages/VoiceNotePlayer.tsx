'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause } from 'lucide-react';

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

export default function VoiceNotePlayer({ mediaUrl, isOwn }: VoiceNotePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    // crossOrigin needed for Cloudinary URLs to work with audio context
    audio.crossOrigin = 'anonymous';
    audio.src = mediaUrl;
    audioRef.current = audio;

    const onMeta = () => {
      if (isFinite(audio.duration)) setDuration(audio.duration);
    };
    const onTime = () => setCurrentTime(audio.currentTime);
    const onEnd = () => { setIsPlaying(false); setCurrentTime(0); };
    // Some audio won't fire loadedmetadata — use durationchange as fallback
    const onDurChange = () => {
      if (isFinite(audio.duration) && audio.duration > 0) setDuration(audio.duration);
    };
    const onError = () => setDuration(0);

    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('durationchange', onDurChange);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnd);
    audio.addEventListener('error', onError);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('durationchange', onDurChange);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnd);
      audio.removeEventListener('error', onError);
      audio.src = '';
    };
  }, [mediaUrl]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      // Attempt play — if it fails (autoplay policy, format issue), reset state
      audio.play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          setIsPlaying(false);
          // Try reloading the audio element — some browsers need a fresh load
          audio.load();
          audio.play()
            .then(() => setIsPlaying(true))
            .catch(() => {});
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
      <button
        onClick={togglePlay}
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-transform active:scale-90 ${
          isOwn ? 'bg-white/20 hover:bg-white/30' : 'bg-primary/10 hover:bg-primary/20'
        }`}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying
          ? <Pause className={`w-4 h-4 ${iconColor}`} />
          : <Play className={`w-4 h-4 ${iconColor} translate-x-px`} />
        }
      </button>

      <div className="flex flex-col flex-1 gap-1.5">
        {/* Progress track */}
        <div
          ref={progressRef}
          onClick={handleProgressClick}
          className={`relative h-1.5 rounded-full cursor-pointer ${trackBg}`}
        >
          <div
            className={`absolute inset-y-0 left-0 rounded-full transition-all duration-100 ${fillBg}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Time */}
        <span className={`text-[10px] tabular-nums ${timeColor}`}>
          {isPlaying ? formatDuration(currentTime) : formatDuration(duration)}
        </span>
      </div>
    </div>
  );
}
