'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { X, Camera, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateMe, uploadAvatar } from '@/lib/api/users';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/auth.store';
import { getInitials, getAvatarUrl } from '@/lib/utils';
import ClientPortal from '@/components/ui/ClientPortal';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

interface EditProfileModalProps {
  onClose: () => void;
}

export default function EditProfileModal({ onClose }: EditProfileModalProps) {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const queryClient = useQueryClient();
  useBodyScrollLock(true);

  const [bio, setBio] = useState(user?.bio ?? '');
  const [corperTag, setCorperTag] = useState(user?.corperTag ?? false);
  const [corperTagLabel, setCorperTagLabel] = useState(user?.corperTagLabel ?? '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const updateMutation = useMutation({
    mutationFn: async () => {
      let updatedUser = user!;
      // Upload avatar first if selected
      if (avatarFile) {
        updatedUser = await uploadAvatar(avatarFile);
      }
      // Update profile fields
      updatedUser = await updateMe({
        bio: bio.trim() || undefined,
        corperTag,
        corperTagLabel: corperTag ? (corperTagLabel.trim() || null) : null,
      });
      return updatedUser;
    },
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: queryKeys.me() });
      toast.success('Profile updated!');
      onClose();
    },
    onError: () => toast.error('Failed to update profile'),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const initials = getInitials(user?.firstName ?? '', user?.lastName ?? '');
  const displayAvatar = avatarPreview ?? user?.profilePicture;

  return (
    <ClientPortal>
      <div
        className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <div
          className="w-full sm:max-w-md bg-surface rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col"
          style={{ maxHeight: '90dvh' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
            <h3 className="font-semibold text-foreground">Edit Profile</h3>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-surface-alt transition-colors">
              <X className="w-4 h-4 text-foreground-secondary" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
                  {displayAvatar ? (
                    <Image src={getAvatarUrl(displayAvatar, 160)} alt={initials} width={80} height={80} className="object-cover w-full h-full" />
                  ) : (
                    <span className="font-bold text-primary text-xl uppercase">{initials}</span>
                  )}
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-md"
                >
                  <Camera className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <p className="text-xs text-foreground-muted">Tap the camera to change photo</p>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Bio <span className="text-foreground-muted font-normal">({bio.length}/160)</span>
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 160))}
                placeholder="Tell your fellow corpers about yourself…"
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface-alt text-sm text-foreground placeholder:text-foreground-muted outline-none focus:border-primary resize-none"
                style={{ fontSize: '16px' }}
              />
            </div>

            {/* Corper tag */}
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Corper Tag</p>
                  <p className="text-xs text-foreground-muted">Show your serving state on your profile</p>
                </div>
                <button
                  onClick={() => setCorperTag(!corperTag)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${corperTag ? 'bg-primary' : 'bg-surface-alt border border-border'}`}
                >
                  <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${corperTag ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
              {corperTag && (
                <input
                  type="text"
                  value={corperTagLabel}
                  onChange={(e) => setCorperTagLabel(e.target.value)}
                  placeholder={`e.g. Serving in ${user?.servingState ?? 'Lagos'}`}
                  className="mt-2 w-full px-3 py-2 rounded-xl border border-border bg-surface-alt text-sm text-foreground placeholder:text-foreground-muted outline-none focus:border-primary"
                  style={{ fontSize: '16px' }}
                />
              )}
            </div>
          </div>

          {/* Save */}
          <div className="p-4 border-t border-border flex-shrink-0">
            <button
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
              className="w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </ClientPortal>
  );
}
