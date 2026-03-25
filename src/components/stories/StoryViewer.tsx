'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { X, Trash2, Eye, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { viewStory, deleteStory } from '@/lib/api/stories';
import { queryKeys } from '@/lib/query-keys';
import { formatRelativeTime, getInitials } from '@/lib/utils';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import ClientPortal from '@/components/ui/ClientPortal';
import StoryProgress from './StoryProgress';
import type { StoryGroup, Story } from '@/types/models';

const IMAGE_DURATION = 5000; // ms
const TICK_MS = 50;          // progress bar update interval

interface StoryViewerProps {
  groups: StoryGroup[];
  initialGroupIndex: number;
  currentUserId: string;
  onClose: () => void;
  onAddStory?: () => void;
}

export default function StoryViewer({
  groups,
  initialGroupIndex,
  currentUserId,
  onClose,
  onAddStory,
}: StoryViewerProps) {
  const queryClient = useQueryClient();
  const [groupIdx, setGroupIdx] = useState(initialGroupIndex);
  const [storyIdx, setStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const viewedRef = useRef<Set<string>>(new Set());

  useBodyScrollLock(true);

  const group = groups[groupIdx];
  const story: Story | undefined = group?.stories[storyIdx];
  const isOwnStory = group?.author.id === currentUserId;
  const isVideo = story?.mediaType?.startsWith('video') || story?.mediaUrl?.match(/\.(mp4|webm|mov|ogg)$/i) !== null;

  // ── Mark as viewed ──────────────────────────────────────────────────────────
  const viewMutation = useMutation({
    mutationFn: viewStory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.stories() }),
  });

  const markViewed = useCallback((s: Story) => {
    if (s && !viewedRef.current.has(s.id)) {
      viewedRef.current.add(s.id);
      viewMutation.mutate(s.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Delete ───────────────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: deleteStory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stories() });
      toast.success('Story deleted');
      // If this was the last story in the group, close; otherwise advance
      if (group.stories.length <= 1) {
        onClose();
      } else {
        const nextIdx = Math.min(storyIdx, group.stories.length - 2);
        setStoryIdx(nextIdx);
        setProgress(0);
      }
    },
    onError: () => toast.error('Failed to delete story'),
  });

  // ── Navigation ───────────────────────────────────────────────────────────────
  const goToNextStory = useCallback(() => {
    const nextStory = storyIdx + 1;
    if (nextStory < group.stories.length) {
      setStoryIdx(nextStory);
      setProgress(0);
    } else {
      // Advance to next group
      const nextGroup = groupIdx + 1;
      if (nextGroup < groups.length) {
        setGroupIdx(nextGroup);
        setStoryIdx(0);
        setProgress(0);
      } else {
        onClose();
      }
    }
  }, [storyIdx, groupIdx, group?.stories.length, groups.length, onClose]);

  const goToPrevStory = useCallback(() => {
    if (storyIdx > 0) {
      setStoryIdx(storyIdx - 1);
      setProgress(0);
    } else if (groupIdx > 0) {
      const prevGroup = groupIdx - 1;
      setGroupIdx(prevGroup);
      setStoryIdx(groups[prevGroup].stories.length - 1);
      setProgress(0);
    }
  }, [storyIdx, groupIdx, groups]);

  // ── Auto-advance timer (images only) ─────────────────────────────────────────
  useEffect(() => {
    if (!story || isVideo) return;
    if (paused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const step = TICK_MS / IMAGE_DURATION;
    timerRef.current = setInterval(() => {
      setProgress((p) => {
        if (p + step >= 1) {
          clearInterval(timerRef.current!);
          goToNextStory();
          return 1;
        }
        return p + step;
      });
    }, TICK_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [story, storyIdx, groupIdx, paused, isVideo, goToNextStory]);

  // ── Mark viewed on story change ───────────────────────────────────────────────
  useEffect(() => {
    if (story && !isOwnStory) markViewed(story);
    setDeleteConfirm(false);
  }, [story, isOwnStory, markViewed]);

  // ── Keyboard navigation ───────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goToNextStory();
      if (e.key === 'ArrowLeft') goToPrevStory();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, goToNextStory, goToPrevStory]);

  if (!group || !story) return null;

  const author = group.author;
  const initials = getInitials(author.firstName, author.lastName);

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 3) {
      goToPrevStory();
    } else if (x > (rect.width * 2) / 3) {
      goToNextStory();
    }
  };

  return (
    <ClientPortal>
      <div
        className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
        role="dialog"
        aria-modal="true"
        aria-label={`${author.firstName}'s story`}
      >
        {/* Story media */}
        <div
          className="relative w-full h-full max-w-[480px] mx-auto"
          onPointerDown={() => setPaused(true)}
          onPointerUp={() => setPaused(false)}
          onPointerLeave={() => setPaused(false)}
          onClick={handleTap}
        >
          {isVideo ? (
            <video
              ref={videoRef}
              src={story.mediaUrl}
              className="w-full h-full object-contain"
              autoPlay
              playsInline
              muted={false}
              onEnded={goToNextStory}
              onTimeUpdate={(e) => {
                const v = e.currentTarget;
                if (v.duration) setProgress(v.currentTime / v.duration);
              }}
            />
          ) : (
            <div className="relative w-full h-full">
              <Image
                src={story.mediaUrl}
                alt={story.caption ?? `Story by ${author.firstName}`}
                fill
                className="object-contain"
                sizes="480px"
                quality={95}
                priority
              />
            </div>
          )}

          {/* Gradient overlay — top */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

          {/* Gradient overlay — bottom */}
          {story.caption && (
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
          )}

          {/* Progress bars */}
          <div className="absolute top-3 inset-x-0 pointer-events-none">
            <StoryProgress
              count={group.stories.length}
              activeIndex={storyIdx}
              progress={progress}
            />
          </div>

          {/* Header bar */}
          <div className="absolute top-6 inset-x-0 flex items-center gap-3 px-3 pointer-events-none">
            {/* Avatar */}
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white bg-surface-alt flex-shrink-0">
              {author.profilePicture ? (
                <Image src={author.profilePicture} alt={initials} width={36} height={36} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/20">
                  <span className="text-xs font-bold text-white uppercase">{initials}</span>
                </div>
              )}
            </div>
            {/* Name + time */}
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm leading-tight truncate">
                {author.firstName} {author.lastName}
              </p>
              <p className="text-white/70 text-xs">{formatRelativeTime(story.createdAt)}</p>
            </div>
            {/* View count for own stories */}
            {isOwnStory && story.viewCount !== undefined && story.viewCount > 0 && (
              <div className="pointer-events-auto flex items-center gap-1 text-white/80 text-xs">
                <Eye className="w-3.5 h-3.5" />
                <span>{story.viewCount}</span>
              </div>
            )}
          </div>

          {/* Close + delete buttons — pointer-events-auto to capture clicks */}
          <div className="absolute top-6 right-3 flex items-center gap-2 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
            {isOwnStory && !deleteConfirm && (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="p-2 rounded-full bg-black/40 text-white"
                aria-label="Delete story"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {deleteConfirm && (
              <button
                onClick={() => deleteMutation.mutate(story.id)}
                disabled={deleteMutation.isPending}
                className="px-3 py-1.5 rounded-full bg-error text-white text-xs font-semibold"
              >
                {deleteMutation.isPending ? 'Deleting…' : 'Confirm delete'}
              </button>
            )}
            {deleteConfirm && (
              <button
                onClick={() => setDeleteConfirm(false)}
                className="p-2 rounded-full bg-black/40 text-white"
                aria-label="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {!deleteConfirm && (
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-black/40 text-white"
                aria-label="Close story viewer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Caption */}
          {story.caption && (
            <div className="absolute bottom-8 inset-x-4 pointer-events-none">
              <p className="text-white text-sm leading-relaxed text-center drop-shadow">{story.caption}</p>
            </div>
          )}

          {/* Side navigation arrows (desktop) */}
          <button
            onClick={(e) => { e.stopPropagation(); goToPrevStory(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 hidden sm:flex p-2 rounded-full bg-black/40 text-white pointer-events-auto"
            aria-label="Previous story"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goToNextStory(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:flex p-2 rounded-full bg-black/40 text-white pointer-events-auto"
            aria-label="Next story"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* "Add story" CTA shown when viewing own stories group */}
          {isOwnStory && onAddStory && (
            <div className="absolute bottom-6 inset-x-0 flex justify-center pointer-events-auto" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={onAddStory}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white text-sm font-semibold shadow-lg"
              >
                <Plus className="w-4 h-4" />
                Add to story
              </button>
            </div>
          )}
        </div>
      </div>
    </ClientPortal>
  );
}
