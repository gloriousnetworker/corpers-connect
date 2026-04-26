'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Film, Globe, Users, Lock, MapPin, Loader2 } from 'lucide-react';
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

const VISIBILITY_OPTIONS = [
  { value: PostVisibility.PUBLIC, label: 'Public', icon: Globe },
  { value: PostVisibility.STATE, label: 'My State', icon: MapPin },
  { value: PostVisibility.FRIENDS, label: 'Friends', icon: Users },
  { value: PostVisibility.ONLY_ME, label: 'Only Me', icon: Lock },
] as const;

export default function CreateReelModal() {
  const open = useUIStore((s) => s.createReelOpen);
  const setOpen = useUIStore((s) => s.setCreateReelOpen);
  const currentUser = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState<PostVisibility>(PostVisibility.PUBLIC);

  const fileInputRef = useRef<HTMLInputElement>(null);
  useBodyScrollLock(open);

  const reset = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setCaption('');
    setVisibility(PostVisibility.PUBLIC);
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
    mutationFn: () => {
      if (!file) throw new Error('Pick a video first.');
      return createReel({ file, caption: caption.trim() || undefined, visibility });
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
  }, [previewUrl]);

  const userInitials = currentUser
    ? getInitials(currentUser.firstName, currentUser.lastName)
    : 'C';

  const canSubmit = !!file && !mutation.isPending;
  const selectedVisibility = VISIBILITY_OPTIONS.find((o) => o.value === visibility)!;
  const VisIcon = selectedVisibility.icon;

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
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-full aspect-[9/16] max-h-[420px] rounded-xl overflow-hidden bg-black/90 border-2 border-dashed border-border hover:border-primary/60 transition-colors flex items-center justify-center"
                >
                  {previewUrl ? (
                    <>
                      <video
                        src={previewUrl}
                        className="absolute inset-0 w-full h-full object-contain"
                        muted
                        autoPlay
                        loop
                        playsInline
                      />
                      <div className="absolute bottom-2 right-2 bg-black/60 rounded-md px-2 py-1">
                        <span className="text-white text-[11px] font-semibold">Tap to change</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 px-6 text-center">
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                        <Film className="w-6 h-6 text-primary" />
                      </div>
                      <span className="text-sm font-semibold text-foreground">Pick a video</span>
                      <span className="text-xs text-foreground-muted">
                        Up to {MAX_MEDIA_SIZE_MB} MB. Portrait videos look best.
                      </span>
                    </div>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_VIDEO_TYPES.join(',')}
                  className="hidden"
                  onChange={handleFileChange}
                />

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
                  <span className="text-xs text-foreground-muted">
                    {file ? file.name : 'No video selected'}
                  </span>
                )}

                <button
                  onClick={() => mutation.mutate()}
                  disabled={!canSubmit}
                  className="px-5 py-2 rounded-xl bg-primary text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-dark transition-colors flex items-center gap-2"
                >
                  {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {mutation.isPending ? 'Sharing…' : 'Share Reel'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ClientPortal>
  );
}
