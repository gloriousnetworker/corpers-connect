'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { X, Upload, ImageIcon, Video } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createStory } from '@/lib/api/stories';
import { queryKeys } from '@/lib/query-keys';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import ClientPortal from '@/components/ui/ClientPortal';

interface StoryCreatorProps {
  open: boolean;
  onClose: () => void;
}

export default function StoryCreator({ open, onClose }: StoryCreatorProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [caption, setCaption] = useState('');

  useBodyScrollLock(open);

  const mutation = useMutation({
    mutationFn: () => createStory(selectedFile!, caption || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stories() });
      toast.success('Story posted!');
      handleClose();
    },
    onError: () => toast.error('Failed to post story. Please try again.'),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (50 MB max)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File must be under 50 MB');
      return;
    }

    const videoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg'];
    const fileIsVideo = videoTypes.includes(file.type) || file.name.match(/\.(mp4|webm|mov|ogg)$/i) !== null;

    setSelectedFile(file);
    setIsVideo(fileIsVideo);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsVideo(false);
    setCaption('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  const handleSubmit = () => {
    if (!selectedFile) {
      toast.error('Please select a photo or video first');
      return;
    }
    mutation.mutate();
  };

  if (!open) return null;

  return (
    <ClientPortal>
      <div
        className="fixed inset-0 z-[9000] bg-black/85 flex flex-col items-center justify-center"
        onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        role="dialog"
        aria-modal="true"
        aria-label="Create story"
      >
        <div className="relative w-full max-w-sm mx-4 bg-surface rounded-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="font-semibold text-foreground text-base">New Story</h2>
            <button onClick={handleClose} className="p-1 rounded-full hover:bg-surface-alt transition-colors" aria-label="Close">
              <X className="w-5 h-5 text-foreground-secondary" />
            </button>
          </div>

          {/* Preview area */}
          <div className="relative bg-black aspect-[9/16] max-h-[60vh] flex items-center justify-center">
            {previewUrl ? (
              isVideo ? (
                <video
                  src={previewUrl}
                  className="w-full h-full object-contain"
                  controls
                  playsInline
                />
              ) : (
                <Image
                  src={previewUrl}
                  alt="Story preview"
                  fill
                  className="object-contain"
                  sizes="384px"
                  quality={95}
                />
              )
            ) : (
              /* Empty picker */
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-3 text-white/60 hover:text-white/90 transition-colors p-8"
              >
                <div className="flex gap-4">
                  <ImageIcon className="w-10 h-10" />
                  <Video className="w-10 h-10" />
                </div>
                <span className="text-sm font-medium">Tap to select photo or video</span>
                <span className="text-xs opacity-60">Max 50 MB · Images & Videos</span>
              </button>
            )}

            {/* Change media button (shown when file selected) */}
            {previewUrl && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-3 left-3 px-3 py-1.5 rounded-full bg-black/60 text-white text-xs font-medium"
              >
                Change
              </button>
            )}
          </div>

          {/* Caption */}
          <div className="px-4 py-3 border-t border-border">
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption…"
              maxLength={200}
              className="w-full bg-surface-alt rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted outline-none focus:ring-2 focus:ring-primary/50"
              style={{ fontSize: '16px' }}
            />
          </div>

          {/* Action buttons */}
          <div className="px-4 pb-4 flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 py-2.5 rounded-xl border border-border text-foreground-secondary text-sm font-medium hover:bg-surface-alt transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedFile || mutation.isPending}
              className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {mutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Posting…
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Post Story
                </>
              )}
            </button>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </ClientPortal>
  );
}
