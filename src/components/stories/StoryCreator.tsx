'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { X, Upload, ImageIcon, Video, Camera } from 'lucide-react';
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

  // Variables passed to mutate() so the mutation doesn't close over stale state
  const mutation = useMutation({
    mutationFn: ({ file, cap }: { file: File; cap?: string }) =>
      createStory(file, cap),
    onMutate: () => toast.loading('Uploading your story…'),
    onSuccess: (_data, _vars, toastId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stories() });
      toast.success('Your story is live!', { id: toastId });
    },
    onError: (_err, _vars, toastId) => {
      toast.error('Story upload failed. Please try again.', { id: toastId });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File must be under 50 MB');
      return;
    }

    const videoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg'];
    const fileIsVideo =
      videoTypes.includes(file.type) || file.name.match(/\.(mp4|webm|mov|ogg)$/i) !== null;

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setSelectedFile(file);
    setIsVideo(fileIsVideo);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleClose = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
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
    // Capture values before handleClose() clears them
    const vars = { file: selectedFile, cap: caption || undefined };
    handleClose(); // dismiss modal immediately — user is free to browse
    mutation.mutate(vars); // upload runs in background
  };

  if (!open) return null;

  return (
    <ClientPortal>
      <div
        className="fixed inset-0 z-[9000] bg-black flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Create story"
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-3 absolute top-0 inset-x-0 z-10 bg-gradient-to-b from-black/70 to-transparent">
          <h2 className="font-semibold text-white text-base">New Story</h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* ── Media preview ── */}
        <div className="flex-1 relative bg-black w-full h-full">
          {previewUrl ? (
            isVideo ? (
              <video
                key={previewUrl}
                src={previewUrl}
                className="w-full h-full object-contain"
                controls
                playsInline
                autoPlay
                loop
              />
            ) : (
              <Image
                src={previewUrl}
                alt="Story preview"
                fill
                className="object-contain"
                sizes="100vw"
                quality={95}
              />
            )
          ) : (
            /* ── Empty picker ── */
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white/60 hover:text-white/90 transition-colors"
            >
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
                <Camera className="w-9 h-9" />
              </div>
              <div className="flex gap-6 mt-2">
                <div className="flex flex-col items-center gap-1 text-white/70">
                  <ImageIcon className="w-6 h-6" />
                  <span className="text-xs">Photo</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-white/70">
                  <Video className="w-6 h-6" />
                  <span className="text-xs">Video</span>
                </div>
              </div>
              <p className="text-sm font-medium mt-1">Tap to select from gallery</p>
              <p className="text-xs opacity-50">Images &amp; Videos · Max 50 MB</p>
            </button>
          )}

          {previewUrl && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-4 left-4 px-4 py-2 rounded-full bg-black/60 text-white text-sm font-medium border border-white/20 backdrop-blur-sm"
            >
              Change
            </button>
          )}
        </div>

        {/* ── Bottom controls ── */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-4 pt-8 pb-6 flex flex-col gap-3">
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a caption…"
            maxLength={200}
            className="w-full bg-white/15 border border-white/25 rounded-2xl px-4 py-3 text-white placeholder:text-white/50 outline-none focus:border-white/50 backdrop-blur-sm"
            style={{ fontSize: '16px' }}
          />

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 py-3 rounded-2xl border border-white/30 text-white text-sm font-medium hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedFile}
              className="flex-1 py-3 rounded-2xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Post Story
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
