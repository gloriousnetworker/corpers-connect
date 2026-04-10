'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { BadgeCheck, Camera, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getInitials, formatCount, getAvatarUrl } from '@/lib/utils';
import { uploadAvatar, uploadBanner } from '@/lib/api/users';
import { useAuthStore } from '@/store/auth.store';
import LevelBadge from './LevelBadge';
import CorperTagBadge from './CorperTagBadge';
import type { User } from '@/types/models';

interface ProfileHeaderProps {
  user: User;
  isOwnProfile?: boolean;
  onEditClick?: () => void;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
  actionSlot?: React.ReactNode;
}

const isVideoUrl = (url?: string | null) =>
  !!url && /\.(mp4|webm|mov|ogg)/i.test(url);

const isVideoMime = (mime: string) => mime.startsWith('video/');

export default function ProfileHeader({
  user,
  isOwnProfile = false,
  onEditClick,
  onFollowersClick,
  onFollowingClick,
  actionSlot,
}: ProfileHeaderProps) {
  const initials = getInitials(user.firstName, user.lastName);
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Local display URL — drives what's shown in the banner at all times.
  // Starts as null (falls back to user.bannerImage from props).
  // Set to an object URL on file pick for instant preview.
  // Set to the real Cloudinary URL on success — never cleared to null,
  // so there's no gap between object URL being revoked and prop update arriving.
  const [localBannerUrl, setLocalBannerUrl] = useState<string | null>(null);
  const [localBannerIsVideo, setLocalBannerIsVideo] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  const revokeObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };
  useEffect(() => () => revokeObjectUrl(), []);

  const bannerMutation = useMutation({
    mutationFn: (file: File) => uploadBanner(file),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      queryClient.setQueryData<User>(['me'], (old) =>
        old ? { ...old, bannerImage: updatedUser.bannerImage } : old
      );
      // Switch from object URL to the real Cloudinary URL — no blank gap
      revokeObjectUrl();
      if (updatedUser.bannerImage) {
        setLocalBannerUrl(updatedUser.bannerImage);
        setLocalBannerIsVideo(isVideoUrl(updatedUser.bannerImage));
      }
      toast.success('Banner updated');
    },
    onError: () => {
      // Revert preview on error
      revokeObjectUrl();
      setLocalBannerUrl(user.bannerImage ?? null);
      setLocalBannerIsVideo(isVideoUrl(user.bannerImage));
      toast.error('Failed to update banner');
    },
  });

  const avatarMutation = useMutation({
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      queryClient.setQueryData<User>(['me'], (old) =>
        old ? { ...old, profilePicture: updatedUser.profilePicture } : old
      );
      toast.success('Profile photo updated');
    },
    onError: () => toast.error('Failed to update photo'),
  });

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Show local object URL immediately — video plays before Cloudinary responds
    revokeObjectUrl();
    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;
    setLocalBannerUrl(objectUrl);
    setLocalBannerIsVideo(isVideoMime(file.type));
    bannerMutation.mutate(file);
    e.target.value = '';
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    avatarMutation.mutate(file);
    e.target.value = '';
  };

  // localBannerUrl takes precedence; falls back to the prop
  const bannerUrl = localBannerUrl ?? user.bannerImage;
  const isVideo = localBannerUrl ? localBannerIsVideo : isVideoUrl(user.bannerImage);

  return (
    <div className="bg-surface">
      {/* ── Banner ─────────────────────────────────────────────────────────── */}
      <div
        className={`relative h-36 overflow-hidden bg-gradient-to-br from-primary/60 via-primary/40 to-primary/10 ${isOwnProfile && !bannerMutation.isPending ? 'cursor-pointer' : ''}`}
        onClick={isOwnProfile ? () => bannerInputRef.current?.click() : undefined}
        role={isOwnProfile ? 'button' : undefined}
        aria-label={isOwnProfile ? 'Change banner' : undefined}
      >
        {bannerUrl ? (
          isVideo ? (
            <video
              key={bannerUrl}
              src={bannerUrl}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <Image
              src={bannerUrl}
              alt="Profile banner"
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
          )
        ) : null}

        {/* Gradient overlay */}
        {bannerUrl && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
        )}

        {/* Loading overlay */}
        {bannerMutation.isPending && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        )}

        {/* Hidden file input */}
        {isOwnProfile && (
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*,video/mp4,video/webm,video/quicktime"
            className="hidden"
            onChange={handleBannerChange}
          />
        )}
      </div>

      <div className="px-4 pb-4">
        {/* Avatar row */}
        <div className="flex items-end justify-between -mt-12 mb-3">
          <div className="relative">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-surface border-4 border-surface flex items-center justify-center flex-shrink-0">
              {user.profilePicture ? (
                <Image
                  src={getAvatarUrl(user.profilePicture, 200)}
                  alt={initials}
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="font-bold text-primary text-2xl uppercase">{initials}</span>
              )}
            </div>

            {/* Avatar upload button — own profile only */}
            {isOwnProfile && (
              <>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarMutation.isPending}
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center border-2 border-surface hover:bg-primary-dark transition-colors"
                  aria-label="Change profile photo"
                >
                  {avatarMutation.isPending ? (
                    <Loader2 className="w-3 h-3 text-white animate-spin" />
                  ) : (
                    <Camera className="w-3 h-3 text-white" />
                  )}
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </>
            )}
          </div>

          {/* Action button */}
          {isOwnProfile ? (
            <button
              onClick={onEditClick}
              className="relative z-10 px-4 py-1.5 rounded-full border border-border bg-surface text-sm font-semibold text-foreground hover:bg-surface-alt transition-colors"
            >
              Edit Profile
            </button>
          ) : (
            <div className="flex items-center gap-2">{actionSlot}</div>
          )}
        </div>

        {/* Name + badges */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold text-foreground leading-tight">
              {user.firstName} {user.lastName}
            </h1>
            {user.isVerified && (
              <BadgeCheck className="w-4 h-4 text-info flex-shrink-0" aria-label="Verified" />
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <LevelBadge level={user.level} size="sm" />
            {user.corperTag && (
              <CorperTagBadge label={user.corperTagLabel} servingState={user.servingState} />
            )}
          </div>

          <p className="text-xs text-foreground-muted">
            {user.stateCode} · Batch {user.batch} · {user.servingState}
          </p>

          {user.bio && (
            <p className="text-sm text-foreground leading-relaxed">{user.bio}</p>
          )}
        </div>

        {/* Stats row */}
        <div className="flex gap-5 mt-4">
          <StatChip label="Posts" value={user.postsCount ?? 0} />
          <button onClick={onFollowersClick} className="text-left">
            <StatChip label="Followers" value={user.followersCount ?? 0} clickable />
          </button>
          <button onClick={onFollowingClick} className="text-left">
            <StatChip label="Following" value={user.followingCount ?? 0} clickable />
          </button>
        </div>
      </div>
    </div>
  );
}

function StatChip({ label, value, clickable }: { label: string; value: number; clickable?: boolean }) {
  return (
    <div className={clickable ? 'hover:opacity-70 transition-opacity' : ''}>
      <p className="text-base font-bold text-foreground leading-none">{formatCount(value)}</p>
      <p className="text-xs text-foreground-muted mt-0.5">{label}</p>
    </div>
  );
}
