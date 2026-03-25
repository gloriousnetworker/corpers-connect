'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image as ImageIcon, Globe, Users, Lock, MapPin, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Image from 'next/image';
import { createPost, updatePost, uploadToCloudinary } from '@/lib/api/posts';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { getInitials } from '@/lib/utils';
import {
  MAX_POST_LENGTH,
  MAX_MEDIA_PER_POST,
  ACCEPTED_IMAGE_TYPES,
} from '@/lib/constants';
import { PostVisibility } from '@/types/enums';
import type { Post } from '@/types/models';
import ClientPortal from '@/components/ui/ClientPortal';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import EmojiPickerPopover from '@/components/ui/EmojiPickerPopover';
import { useEmojiInsertion } from '@/hooks/useEmojiInsertion';

interface CreatePostModalProps {
  editPost?: Post;
  onClose?: () => void;
}

const VISIBILITY_OPTIONS = [
  { value: PostVisibility.PUBLIC, label: 'Public', icon: Globe },
  { value: PostVisibility.STATE, label: 'My State', icon: MapPin },
  { value: PostVisibility.FRIENDS, label: 'Friends', icon: Users },
  { value: PostVisibility.ONLY_ME, label: 'Only Me', icon: Lock },
] as const;

export default function CreatePostModal({ editPost, onClose }: CreatePostModalProps) {
  const createPostOpen = useUIStore((s) => s.createPostOpen);
  const setCreatePostOpen = useUIStore((s) => s.setCreatePostOpen);
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);

  const isOpen = editPost ? true : createPostOpen;
  const close = () => {
    if (editPost) {
      onClose?.();
    } else {
      setCreatePostOpen(false);
    }
  };

  const [content, setContent] = useState(editPost?.content ?? '');
  const [visibility, setVisibility] = useState<PostVisibility>(
    editPost?.visibility ?? PostVisibility.PUBLIC
  );
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [existingMediaUrls, setExistingMediaUrls] = useState<string[]>(
    editPost?.mediaUrls ?? []
  );
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const insertEmoji = useEmojiInsertion(textareaRef, content, setContent);

  const userInitials = currentUser
    ? getInitials(currentUser.firstName, currentUser.lastName)
    : 'C';

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const valid = files.filter((f) => ACCEPTED_IMAGE_TYPES.includes(f.type));
    const remaining = MAX_MEDIA_PER_POST - existingMediaUrls.length - mediaFiles.length;
    const toAdd = valid.slice(0, remaining);

    if (toAdd.length < valid.length) {
      toast.warning(`Maximum ${MAX_MEDIA_PER_POST} images per post`);
    }

    setMediaFiles((prev) => [...prev, ...toAdd]);
    toAdd.forEach((f) => {
      const url = URL.createObjectURL(f);
      setMediaPreviews((prev) => [...prev, url]);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [existingMediaUrls.length, mediaFiles.length]);

  const removeNewMedia = (index: number) => {
    URL.revokeObjectURL(mediaPreviews[index]);
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingMedia = (index: number) => {
    setExistingMediaUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const mutation = useMutation({
    mutationFn: async () => {
      setUploading(true);
      let uploadedUrls: string[] = [];
      try {
        uploadedUrls = await Promise.all(mediaFiles.map(uploadToCloudinary));
      } catch {
        throw new Error('Image upload failed. Please try again.');
      } finally {
        setUploading(false);
      }

      const allMediaUrls = [...existingMediaUrls, ...uploadedUrls];

      if (editPost) {
        return updatePost(editPost.id, { content: content.trim() || undefined, visibility });
      }

      return createPost({
        content: content.trim() || undefined,
        mediaUrls: allMediaUrls,
        visibility,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feed() });
      toast.success(editPost ? 'Post updated!' : 'Post shared!');
      close();
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Something went wrong');
    },
  });

  const canSubmit =
    (content.trim().length > 0 || existingMediaUrls.length > 0 || mediaFiles.length > 0) &&
    content.length <= MAX_POST_LENGTH;

  const totalMedia = existingMediaUrls.length + mediaFiles.length;
  const selectedVisibility = VISIBILITY_OPTIONS.find((o) => o.value === visibility)!;
  const VisIcon = selectedVisibility.icon;

  useBodyScrollLock(isOpen);

  return (
    <ClientPortal>
    <AnimatePresence>
      {isOpen && (
        /*
         * Single overlay element handles BOTH the dark backdrop AND the flex centering.
         * This avoids the Framer Motion transform conflict: Tailwind's `top-1/2 -translate-y-1/2`
         * uses CSS `transform: translateY(-50%)` which Framer Motion overwrites with its own
         * scale/y animation transform, destroying the centering. Using flexbox centering on the
         * outer container + only scale/y animation on the inner content fixes this completely.
         */
        <motion.div
          key="create-post-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={close}
        >
          <motion.div
            key="create-post-modal"
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
              <h3 className="font-semibold text-foreground">
                {editPost ? 'Edit Post' : 'Create Post'}
              </h3>
              <button
                onClick={close}
                className="p-1.5 rounded-full hover:bg-surface-alt transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-foreground-secondary" />
              </button>
            </div>

            {/* Body — scrollable, grows to fill available space */}
            <div className="flex-1 overflow-y-auto overscroll-y-none p-4 space-y-4 min-h-0">
              {/* Author row */}
              <div className="flex items-center gap-3">
                {currentUser?.profilePicture ? (
                  <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={currentUser.profilePicture}
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

                  {/* Visibility selector */}
                  <div className="relative inline-block mt-1">
                    <select
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value as PostVisibility)}
                      className="text-xs font-medium text-foreground-secondary bg-surface-alt border border-border rounded-full px-2 py-0.5 pr-5 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
                      aria-label="Post visibility"
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

              {/* Text area */}
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`What's on your mind, ${currentUser?.firstName ?? 'Corper'}?`}
                rows={5}
                maxLength={MAX_POST_LENGTH}
                className="w-full bg-transparent text-foreground placeholder:text-foreground-muted text-base leading-relaxed resize-none outline-none"
                autoFocus
              />

              {/* Media previews */}
              {(existingMediaUrls.length > 0 || mediaPreviews.length > 0) && (
                <div className="grid grid-cols-3 gap-2">
                  {existingMediaUrls.map((url, i) => (
                    <div key={`existing-${i}`} className="relative aspect-square rounded-xl overflow-hidden bg-surface-alt">
                      <Image src={url} alt="" fill quality={90} className="object-cover" />
                      <button
                        onClick={() => removeExistingMedia(i)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                        aria-label="Remove image"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                  {mediaPreviews.map((url, i) => (
                    <div key={`new-${i}`} className="relative aspect-square rounded-xl overflow-hidden bg-surface-alt">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeNewMedia(i)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                        aria-label="Remove image"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer — always visible */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-border flex-shrink-0 gap-3">
              <div className="flex items-center gap-2">
                {/* Add photo button */}
                {!editPost && totalMedia < MAX_MEDIA_PER_POST && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-surface-alt transition-colors text-sm font-medium text-foreground-secondary"
                    aria-label="Add photo"
                  >
                    <ImageIcon className="w-4 h-4 text-info" />
                    <span>Photo</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES.join(',')}
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
                {/* Emoji picker */}
                <EmojiPickerPopover onEmojiSelect={insertEmoji} placement="above" />
              </div>

              <div className="flex items-center gap-3">
                {content.length > MAX_POST_LENGTH * 0.8 && (
                  <span
                    className={`text-xs ${
                      content.length > MAX_POST_LENGTH
                        ? 'text-danger font-medium'
                        : 'text-foreground-muted'
                    }`}
                  >
                    {MAX_POST_LENGTH - content.length}
                  </span>
                )}

                <button
                  onClick={() => mutation.mutate()}
                  disabled={!canSubmit || mutation.isPending || uploading}
                  className="px-5 py-2 rounded-xl bg-primary text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-dark transition-colors flex items-center gap-2"
                >
                  {(mutation.isPending || uploading) && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  {editPost ? 'Save' : 'Post'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </ClientPortal>
  );
}
