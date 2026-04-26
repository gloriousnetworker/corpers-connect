'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Film, Globe, Users, Lock, MapPin, Loader2,
  Volume2, VolumeX, Scissors,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createReel } from '@/lib/api/reels';
import { queryKeys } from '@/lib/query-keys';
import { useUIStore } from '@/store/ui.store';
import { useAuthStore } from '@/store/auth.store';
import { getInitials, getAvatarUrl } from '@/lib/utils';
import { ACCEPTED_VIDEO_TYPES, MAX_MEDIA_SIZE_MB } from '@/lib/constants';
import { PostVisibility } from '@/types/enums';
import ClientPortal from '@/components/ui/ClientPortal';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import Image from 'next/image';

const MAX_CAPTION_LENGTH = 500;
const MIN_TRIM_SECONDS = 1;

const VISIBILITY_OPTIONS = [
  { value: PostVisibility.PUBLIC, label: 'Public', icon: Globe },
  { value: PostVisibility.STATE, label: 'My State', icon: MapPin },
  { value: PostVisibility.FRIENDS, label: 'Friends', icon: Users },
  { value: PostVisibility.ONLY_ME, label: 'Only Me', icon: Lock },
] as const;

function fmtTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Re-encode a slice of a video file into a new Blob using MediaRecorder.
 * Plays the source through silently in a hidden <video>, captures its stream,
 * and stops the recorder once we hit the desired end time.
 *
 * Output is webm (universally supported by MediaRecorder); backend accepts it.
 */
async function trimVideoFile(file: File, start: number, end: number): Promise<Blob> {
  if (typeof MediaRecorder === 'undefined') {
    throw new Error("Your browser doesn't support video trimming. Please update or pick a pre-trimmed clip.");
  }

  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.src = url;
  video.crossOrigin = 'anonymous';
  video.muted = false; // need audio track in the stream
  video.playsInline = true;
  video.preload = 'auto';

  try {
    await new Promise<void>((resolve, reject) => {
      const onReady = () => resolve();
      const onErr = () => reject(new Error('Could not load the video for trimming.'));
      video.addEventListener('loadedmetadata', onReady, { once: true });
      video.addEventListener('error', onErr, { once: true });
    });

    // captureStream is available unprefixed on Chromium/Firefox; Safari ships it
    // since 17. We need the cast because the lib.dom types don't expose it on
    // every TS lib version.
    type CapturableMedia = HTMLMediaElement & {
      captureStream?: () => MediaStream;
      mozCaptureStream?: () => MediaStream;
    };
    const capturable = video as CapturableMedia;
    const captureFn = capturable.captureStream ?? capturable.mozCaptureStream;
    if (!captureFn) {
      throw new Error("Your browser can't capture video for trimming.");
    }
    const stream: MediaStream = captureFn.call(capturable);

    // Pick the most compatible mime supported by the current browser.
    const candidates = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4',
    ];
    const mimeType = candidates.find((m) => MediaRecorder.isTypeSupported(m)) ?? '';
    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

    const stopWatcher = () => {
      video.removeEventListener('timeupdate', tick);
      video.pause();
      try { recorder.stop(); } catch { /* already stopped */ }
    };

    const tick = () => {
      if (video.currentTime >= end - 0.05) stopWatcher();
    };

    return await new Promise<Blob>((resolve, reject) => {
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType || 'video/webm' });
        resolve(blob);
      };
      recorder.onerror = (ev) => reject(new Error(`Recorder error: ${(ev as ErrorEvent).message ?? 'unknown'}`));

      const startCapture = () => {
        recorder.start(250); // 250 ms timeslice for incremental chunks
        video.addEventListener('timeupdate', tick);
        video.play().catch((err) => reject(err));
      };

      // Seek to the trim start, then start recording.
      const onSeeked = () => {
        video.removeEventListener('seeked', onSeeked);
        startCapture();
      };
      video.addEventListener('seeked', onSeeked, { once: true });
      try { video.currentTime = start; } catch (err) { reject(err); }
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function CreateReelModal() {
  const open = useUIStore((s) => s.createReelOpen);
  const setOpen = useUIStore((s) => s.setCreateReelOpen);
  const currentUser = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState<PostVisibility>(PostVisibility.PUBLIC);

  // Preview controls
  const [duration, setDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [muted, setMuted] = useState(false);
  const [trimProgress, setTrimProgress] = useState<number | null>(null); // 0..1 while encoding

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useBodyScrollLock(open);

  const reset = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setCaption('');
    setVisibility(PostVisibility.PUBLIC);
    setDuration(0);
    setTrimStart(0);
    setTrimEnd(0);
    setMuted(false);
    setTrimProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [previewUrl]);

  // Free the object URL on unmount.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const close = useCallback(() => {
    setOpen(false);
    reset();
  }, [setOpen, reset]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Pick a video first.');
      const isFullClip = trimStart <= 0.05 && trimEnd >= duration - 0.05;
      let payloadFile: File = file;

      if (!isFullClip) {
        setTrimProgress(0);
        try {
          const blob = await trimVideoFile(file, trimStart, trimEnd);
          payloadFile = new File([blob], 'reel.webm', { type: blob.type || 'video/webm' });
        } finally {
          setTrimProgress(null);
        }
      }

      return createReel({ file: payloadFile, caption: caption.trim() || undefined, visibility });
    },
    onMutate: () => toast.loading('Sharing your reel…'),
    onSuccess: (_, _vars, toastId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reels() });
      queryClient.invalidateQueries({ queryKey: queryKeys.feed() });
      toast.success('Your reel is live!', { id: toastId });
      close();
    },
    onError: (err: Error, _vars, toastId) => {
      toast.error(err.message || 'Could not post reel.', { id: toastId });
    },
  });

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ACCEPTED_VIDEO_TYPES.includes(f.type)) {
      toast.error('Please pick an mp4, webm, or mov video.');
      return;
    }
    const sizeLimit = MAX_MEDIA_SIZE_MB * 1024 * 1024;
    if (f.size > sizeLimit) {
      toast.error(`"${f.name}" is too large (max ${MAX_MEDIA_SIZE_MB} MB).`);
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setDuration(0);
    setTrimStart(0);
    setTrimEnd(0);
  }, [previewUrl]);

  // When metadata loads, set defaults so the trim covers the whole clip.
  const handleLoadedMetadata = () => {
    const v = videoRef.current;
    if (!v) return;
    const d = Number.isFinite(v.duration) ? v.duration : 0;
    setDuration(d);
    setTrimStart(0);
    setTrimEnd(d);
  };

  // Loop the preview within [trimStart, trimEnd].
  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.currentTime >= trimEnd) {
      v.currentTime = trimStart;
      // play() may have been pre-empted by seeking; resume.
      v.play().catch(() => {});
    }
  };

  // Keep the player synced to the start handle while the user drags it.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.currentTime < trimStart || v.currentTime > trimEnd) {
      v.currentTime = trimStart;
    }
  }, [trimStart, trimEnd]);

  // Sync mute toggle to the element.
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  const handleStartChange = (val: number) => {
    // Don't let the start handle cross the end handle.
    const next = Math.min(val, Math.max(0, trimEnd - MIN_TRIM_SECONDS));
    setTrimStart(next);
  };
  const handleEndChange = (val: number) => {
    const next = Math.max(val, trimStart + MIN_TRIM_SECONDS);
    setTrimEnd(Math.min(next, duration));
  };

  const userInitials = currentUser
    ? getInitials(currentUser.firstName, currentUser.lastName)
    : 'C';

  const trimDuration = trimEnd - trimStart;
  const isTrimmed = trimStart > 0.05 || trimEnd < duration - 0.05;
  const canSubmit = !!file && !mutation.isPending && trimProgress === null;
  const selectedVisibility = VISIBILITY_OPTIONS.find((o) => o.value === visibility)!;
  const VisIcon = selectedVisibility.icon;

  // Position the highlighted band on the trim track.
  const startPct = duration > 0 ? (trimStart / duration) * 100 : 0;
  const endPct = duration > 0 ? (trimEnd / duration) * 100 : 100;

  return (
    <ClientPortal>
      <AnimatePresence>
        {open && (
          <motion.div
            key="create-reel-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={close}
          >
            <motion.div
              key="create-reel-modal"
              initial={{ scale: 0.97, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.97, y: 12, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-lg bg-surface rounded-2xl shadow-2xl overflow-hidden flex flex-col"
              style={{ maxHeight: 'calc(100dvh - 2rem)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Film className="w-4 h-4 text-primary" />
                  Create Reel
                </h3>
                <button
                  onClick={close}
                  className="p-1.5 rounded-full hover:bg-surface-alt transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-foreground-secondary" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto overscroll-y-none p-4 space-y-4 min-h-0">
                {/* Author + visibility row */}
                <div className="flex items-center gap-3">
                  {currentUser?.profilePicture ? (
                    <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={getAvatarUrl(currentUser.profilePicture, 80)}
                        alt={userInitials}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary uppercase">{userInitials}</span>
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-sm text-foreground">
                      {currentUser?.firstName} {currentUser?.lastName}
                    </p>
                    <div className="relative inline-block mt-1">
                      <select
                        value={visibility}
                        onChange={(e) => setVisibility(e.target.value as PostVisibility)}
                        className="text-xs font-medium text-foreground-secondary bg-surface-alt border border-border rounded-full px-2 py-0.5 pr-5 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
                        aria-label="Reel visibility"
                      >
                        {VISIBILITY_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      <VisIcon className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground-muted pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Video preview / picker */}
                <div className="relative w-full aspect-[9/16] max-h-[420px] rounded-xl overflow-hidden bg-black/90 border-2 border-dashed border-border flex items-center justify-center">
                  {previewUrl ? (
                    <>
                      <video
                        ref={videoRef}
                        src={previewUrl}
                        className="absolute inset-0 w-full h-full object-contain"
                        autoPlay
                        loop={false}
                        playsInline
                        muted={muted}
                        onLoadedMetadata={handleLoadedMetadata}
                        onTimeUpdate={handleTimeUpdate}
                      />
                      {/* Top-right: mute toggle */}
                      <button
                        onClick={() => setMuted((m) => !m)}
                        className="absolute top-2 right-2 w-9 h-9 rounded-full bg-black/55 hover:bg-black/75 transition-colors flex items-center justify-center"
                        aria-label={muted ? 'Unmute' : 'Mute'}
                      >
                        {muted
                          ? <VolumeX className="w-4 h-4 text-white" />
                          : <Volume2 className="w-4 h-4 text-white" />}
                      </button>
                      {/* Top-left: change clip */}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute top-2 left-2 px-2.5 py-1 rounded-md bg-black/55 hover:bg-black/75 transition-colors text-[11px] font-semibold text-white"
                      >
                        Change clip
                      </button>
                      {/* Encoding overlay */}
                      {trimProgress !== null && (
                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2">
                          <Loader2 className="w-7 h-7 text-white animate-spin" />
                          <span className="text-white text-xs font-semibold">Trimming clip…</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center gap-2 px-6 text-center w-full h-full justify-center hover:bg-white/5 transition-colors"
                    >
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                        <Film className="w-6 h-6 text-primary" />
                      </div>
                      <span className="text-sm font-semibold text-foreground">Pick a video</span>
                      <span className="text-xs text-foreground-muted">
                        Up to {MAX_MEDIA_SIZE_MB} MB. Portrait videos look best.
                      </span>
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_VIDEO_TYPES.join(',')}
                  className="hidden"
                  onChange={handleFileChange}
                />

                {/* Trim controls — only shown once metadata is loaded */}
                {previewUrl && duration > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-foreground-secondary font-medium">
                        <Scissors className="w-3.5 h-3.5 text-primary" />
                        <span>Trim</span>
                      </div>
                      <span className="font-mono text-foreground-muted">
                        {fmtTime(trimStart)} – {fmtTime(trimEnd)}
                        <span className="ml-1.5 text-primary font-semibold">
                          ({fmtTime(trimDuration)})
                        </span>
                      </span>
                    </div>

                    {/* Dual-handle range track */}
                    <div className="relative h-9">
                      {/* Background track */}
                      <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1.5 rounded-full bg-surface-alt" />
                      {/* Selected band */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-primary"
                        style={{ left: `${startPct}%`, right: `${100 - endPct}%` }}
                      />
                      {/* Start handle */}
                      <input
                        type="range"
                        min={0}
                        max={duration}
                        step={0.05}
                        value={trimStart}
                        onChange={(e) => handleStartChange(Number(e.target.value))}
                        className="cc-trim-thumb absolute inset-0 w-full appearance-none bg-transparent pointer-events-none"
                        aria-label="Trim start"
                      />
                      {/* End handle */}
                      <input
                        type="range"
                        min={0}
                        max={duration}
                        step={0.05}
                        value={trimEnd}
                        onChange={(e) => handleEndChange(Number(e.target.value))}
                        className="cc-trim-thumb absolute inset-0 w-full appearance-none bg-transparent pointer-events-none"
                        aria-label="Trim end"
                      />
                    </div>
                    {isTrimmed && (
                      <p className="text-[11px] text-foreground-muted">
                        Reel will be re-encoded to your selection before posting.
                      </p>
                    )}
                  </div>
                )}

                {/* Caption */}
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a caption…"
                  rows={3}
                  maxLength={MAX_CAPTION_LENGTH}
                  className="w-full bg-transparent text-foreground placeholder:text-foreground-muted text-sm leading-relaxed resize-none outline-none border border-border focus:border-primary/60 rounded-xl p-3 transition-colors"
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-border flex-shrink-0 gap-3">
                {caption.length > MAX_CAPTION_LENGTH * 0.8 ? (
                  <span
                    className={`text-xs ${
                      caption.length > MAX_CAPTION_LENGTH
                        ? 'text-danger font-medium'
                        : 'text-foreground-muted'
                    }`}
                  >
                    {MAX_CAPTION_LENGTH - caption.length}
                  </span>
                ) : (
                  <span className="text-xs text-foreground-muted truncate max-w-[55%]">
                    {file ? file.name : 'No video selected'}
                  </span>
                )}

                <button
                  onClick={() => mutation.mutate()}
                  disabled={!canSubmit}
                  className="px-5 py-2 rounded-xl bg-primary text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-dark transition-colors flex items-center gap-2"
                >
                  {(mutation.isPending || trimProgress !== null) && <Loader2 className="w-4 h-4 animate-spin" />}
                  {trimProgress !== null
                    ? 'Trimming…'
                    : mutation.isPending
                      ? 'Sharing…'
                      : 'Share Reel'}
                </button>
              </div>

              {/* Custom thumb styling for the dual-handle slider — Tailwind alone
                  can't reach into the native range thumb. */}
              <style jsx>{`
                .cc-trim-thumb::-webkit-slider-thumb {
                  -webkit-appearance: none;
                  appearance: none;
                  pointer-events: auto;
                  width: 18px;
                  height: 18px;
                  border-radius: 9999px;
                  background: var(--color-primary, #16a34a);
                  border: 2px solid #fff;
                  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
                  cursor: grab;
                }
                .cc-trim-thumb::-webkit-slider-thumb:active { cursor: grabbing; }
                .cc-trim-thumb::-moz-range-thumb {
                  pointer-events: auto;
                  width: 18px;
                  height: 18px;
                  border-radius: 9999px;
                  background: var(--color-primary, #16a34a);
                  border: 2px solid #fff;
                  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
                  cursor: grab;
                }
                .cc-trim-thumb { z-index: 2; }
                .cc-trim-thumb::-webkit-slider-runnable-track { background: transparent; }
                .cc-trim-thumb::-moz-range-track { background: transparent; }
              `}</style>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ClientPortal>
  );
}
