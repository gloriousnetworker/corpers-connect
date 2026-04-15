'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { X, ImagePlus, Loader2, Trash2, Sparkles, Lock, Globe, Users as UsersIcon, Tag } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { upsertCampDay, deleteCampDay } from '@/lib/api/camp-experience';
import { uploadToCloudinary } from '@/lib/api/posts';
import { queryKeys } from '@/lib/query-keys';
import { getOptimisedUrl } from '@/lib/utils';
import type { CampDayEntry, CampMood, CampDayVisibility } from '@/types/models';
import TagUsersPicker from './TagUsersPicker';
import TaggedUserChip from './TaggedUserChip';

interface CampDayEditorProps {
  dayNumber: number;
  userId: string;
  existing: CampDayEntry | null;
  readOnly?: boolean;
  onClose: () => void;
}

const MOODS: { value: CampMood; emoji: string; label: string }[] = [
  { value: 'HAPPY', emoji: '😊', label: 'Happy' },
  { value: 'TIRED', emoji: '😴', label: 'Tired' },
  { value: 'EXCITED', emoji: '🤩', label: 'Excited' },
  { value: 'HOMESICK', emoji: '🥺', label: 'Homesick' },
  { value: 'GRATEFUL', emoji: '🙏', label: 'Grateful' },
  { value: 'FUNNY', emoji: '😂', label: 'Funny' },
  { value: 'PROUD', emoji: '😎', label: 'Proud' },
  { value: 'STRESSED', emoji: '😰', label: 'Stressed' },
  { value: 'BORED', emoji: '😐', label: 'Bored' },
  { value: 'INSPIRED', emoji: '✨', label: 'Inspired' },
];

const VISIBILITY_OPTIONS: { value: CampDayVisibility; label: string; icon: typeof Lock }[] = [
  { value: 'PRIVATE', label: 'Only me', icon: Lock },
  { value: 'FRIENDS', label: 'Friends', icon: UsersIcon },
  { value: 'PUBLIC', label: 'Everyone', icon: Globe },
];

export default function CampDayEditor({
  dayNumber,
  userId,
  existing,
  readOnly = false,
  onClose,
}: CampDayEditorProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(existing?.title ?? '');
  const [story, setStory] = useState(existing?.story ?? '');
  const [mood, setMood] = useState<CampMood | null>(existing?.mood ?? null);
  const [mediaUrls, setMediaUrls] = useState<string[]>(existing?.mediaUrls ?? []);
  const [taggedUserIds, setTaggedUserIds] = useState<string[]>(existing?.taggedUserIds ?? []);
  const [taggedUsers, setTaggedUsers] = useState(existing?.taggedUsers ?? []);
  const [isHighlight, setIsHighlight] = useState(existing?.isHighlight ?? false);
  const [visibility, setVisibility] = useState<CampDayVisibility>(existing?.visibility ?? 'FRIENDS');
  const [campName, setCampName] = useState(existing?.campName ?? '');
  const [uploading, setUploading] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);

  const saveMutation = useMutation({
    mutationFn: () =>
      upsertCampDay({
        dayNumber,
        title: title.trim() || undefined,
        story: story.trim() || undefined,
        mood: mood ?? undefined,
        mediaUrls,
        taggedUserIds,
        isHighlight,
        visibility,
        campName: campName.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myCamp() });
      queryClient.invalidateQueries({ queryKey: queryKeys.userCamp(userId) });
      toast.success(existing ? 'Day updated' : `Day ${dayNumber} saved!`);
      onClose();
    },
    onError: () => toast.error('Could not save. Please try again.'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCampDay(dayNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myCamp() });
      queryClient.invalidateQueries({ queryKey: queryKeys.userCamp(userId) });
      toast.success('Day deleted');
      onClose();
    },
    onError: () => toast.error('Could not delete'),
  });

  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    if (mediaUrls.length + files.length > 10) {
      toast.error('Maximum 10 photos per day');
      return;
    }
    setUploading(true);
    try {
      const urls = await Promise.all(files.map(uploadToCloudinary));
      setMediaUrls((prev) => [...prev, ...urls]);
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeMedia = (idx: number) => {
    setMediaUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const canSave = !!(title.trim() || story.trim() || mediaUrls.length > 0);

  return (
    <div className="fixed inset-0 z-[150] bg-black/60 flex items-end sm:items-center justify-center">
      <div className="bg-surface w-full max-w-lg max-h-[95vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-surface border-b border-border px-4 py-3 flex items-center justify-between z-10">
          <div>
            <h2 className="text-base font-bold text-foreground">Day {dayNumber}</h2>
            <p className="text-[11px] text-foreground-muted">
              {readOnly ? 'Camp memory' : 'Document this day of camp'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!readOnly && existing && (
              <button
                onClick={() => {
                  if (confirm('Delete this day entry?')) deleteMutation.mutate();
                }}
                disabled={deleteMutation.isPending}
                className="p-2 rounded-full text-danger hover:bg-danger/10"
                aria-label="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-surface-alt"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Highlight of Day ${dayNumber}…`}
              readOnly={readOnly}
              maxLength={140}
              className="w-full mt-1 px-3 py-2 bg-surface-alt rounded-lg text-sm text-foreground placeholder:text-foreground-muted outline-none focus:ring-2 focus:ring-primary/30"
              style={{ fontSize: '16px' }}
            />
          </div>

          {/* Story */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
              Story
            </label>
            <textarea
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="What happened today? Drills, drama, food, friends…"
              readOnly={readOnly}
              rows={5}
              maxLength={5000}
              className="w-full mt-1 px-3 py-2 bg-surface-alt rounded-lg text-sm text-foreground placeholder:text-foreground-muted outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              style={{ fontSize: '16px' }}
            />
          </div>

          {/* Media */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
                Photos ({mediaUrls.length}/10)
              </label>
              {!readOnly && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || mediaUrls.length >= 10}
                  className="flex items-center gap-1 text-xs font-semibold text-primary disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ImagePlus className="w-3.5 h-3.5" />
                  )}
                  Add
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFilePick}
              className="hidden"
            />
            {mediaUrls.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {mediaUrls.map((url, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden">
                    <Image
                      src={getOptimisedUrl(url, 240)}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="120px"
                    />
                    {!readOnly && (
                      <button
                        onClick={() => removeMedia(idx)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white"
                        aria-label="Remove"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-foreground-muted italic">No photos yet</p>
            )}
          </div>

          {/* Mood */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
              Mood
            </label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => !readOnly && setMood(mood === m.value ? null : m.value)}
                  disabled={readOnly}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition ${
                    mood === m.value
                      ? 'bg-primary text-white'
                      : 'bg-surface-alt text-foreground-secondary hover:bg-surface-alt/70'
                  }`}
                >
                  <span>{m.emoji}</span>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tagged friends */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
                Tagged friends ({taggedUsers.length})
              </label>
              {!readOnly && (
                <button
                  onClick={() => setShowTagPicker(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-primary"
                >
                  <Tag className="w-3.5 h-3.5" />
                  Tag
                </button>
              )}
            </div>
            {taggedUsers.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {taggedUsers.map((u) => (
                  <TaggedUserChip
                    key={u.id}
                    user={u}
                    onRemove={
                      readOnly
                        ? undefined
                        : () => {
                            setTaggedUsers((prev) => prev.filter((x) => x.id !== u.id));
                            setTaggedUserIds((prev) => prev.filter((id) => id !== u.id));
                          }
                    }
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-foreground-muted italic">No tags yet</p>
            )}
          </div>

          {/* Camp name */}
          {!readOnly && (
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
                Camp name (optional)
              </label>
              <input
                type="text"
                value={campName}
                onChange={(e) => setCampName(e.target.value)}
                placeholder="e.g. NYSC Orientation Camp Lokoja"
                maxLength={100}
                className="w-full mt-1 px-3 py-2 bg-surface-alt rounded-lg text-sm text-foreground placeholder:text-foreground-muted outline-none focus:ring-2 focus:ring-primary/30"
                style={{ fontSize: '16px' }}
              />
            </div>
          )}

          {/* Highlight + Visibility (own only) */}
          {!readOnly && (
            <>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isHighlight}
                  onChange={(e) => setIsHighlight(e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-sm text-foreground">Mark as a top memory</span>
              </label>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
                  Who can see this
                </label>
                <div className="mt-1.5 flex gap-1.5">
                  {VISIBILITY_OPTIONS.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setVisibility(value)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition ${
                        visibility === value
                          ? 'bg-primary text-white'
                          : 'bg-surface-alt text-foreground-secondary'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer — save button */}
        {!readOnly && (
          <div className="sticky bottom-0 bg-surface border-t border-border p-3">
            <button
              onClick={() => saveMutation.mutate()}
              disabled={!canSave || saveMutation.isPending || uploading}
              className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50 shadow"
            >
              {saveMutation.isPending ? 'Saving…' : existing ? 'Update Day' : 'Save Day'}
            </button>
          </div>
        )}
      </div>

      {/* Tag picker */}
      {showTagPicker && (
        <TagUsersPicker
          selectedIds={taggedUserIds}
          selectedUsers={taggedUsers}
          onConfirm={(ids, users) => {
            setTaggedUserIds(ids);
            setTaggedUsers(users);
            setShowTagPicker(false);
          }}
          onClose={() => setShowTagPicker(false)}
        />
      )}
    </div>
  );
}
