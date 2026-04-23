'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { BadgeCheck, UserPlus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery } from '@tanstack/react-query';

import Logo from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { onboardingSchema, type UpdateProfileInput } from '@/lib/validators';
import { onboardMe } from '@/lib/api/users';
import { followUser } from '@/lib/api/users';
import { getCorpersInState, getSuggestions, type DiscoverUser } from '@/lib/api/discover';
import { useAuthStore } from '@/store/auth.store';
import { getInitials } from '@/lib/utils';
import LevelBadge from '@/components/profile/LevelBadge';

type Step = 'profile' | 'suggestions';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const [step, setStep] = useState<Step>('profile');
  const [followed, setFollowed] = useState<Set<string>>(new Set());
  const [discoverMore, setDiscoverMore] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { bio: '', corperTag: false },
  });

  const bio = watch('bio', '');
  const bioLength = bio?.length ?? 0;

  const profileMutation = useMutation({
    mutationFn: (data: UpdateProfileInput) =>
      onboardMe({ ...data, corperTagLabel: data.corperTagLabel ?? undefined }),
    onSuccess: (u) => {
      updateUser(u);
      setStep('suggestions');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Setup failed. Please try again.');
    },
  });

  // Primary list: strictly the user's serving state — keeps onboarding
  // focused on people they'll actually run into at camp / PPA.
  const stateQuery = useQuery({
    queryKey: ['onboarding-state-corpers'],
    queryFn: () => getCorpersInState(undefined, 15),
    enabled: step === 'suggestions',
    staleTime: Infinity,
  });

  // Secondary list: backend's broader suggestions (pads with other states).
  // Only fetched when the user taps "Discover more corpers".
  const moreQuery = useQuery({
    queryKey: ['onboarding-global-suggestions'],
    queryFn: () => getSuggestions(20),
    enabled: step === 'suggestions' && discoverMore,
    staleTime: Infinity,
  });

  // Merge + de-dupe: same-state first, then "discover more" padding.
  const suggestions = useMemo<DiscoverUser[]>(() => {
    const stateList = stateQuery.data?.items ?? [];
    if (!discoverMore) return stateList;
    const stateIds = new Set(stateList.map((u) => u.id));
    const extras = (moreQuery.data ?? []).filter((u) => !stateIds.has(u.id));
    return [...stateList, ...extras];
  }, [stateQuery.data, moreQuery.data, discoverMore]);

  const stateLabel = stateQuery.data?.state ?? user?.servingState ?? 'your state';
  const isLoadingPrimary = stateQuery.isLoading;
  const isLoadingMore = discoverMore && moreQuery.isLoading;

  const followMutation = useMutation({
    mutationFn: (userId: string) => followUser(userId),
    onSuccess: (_, userId) => {
      setFollowed((prev) => new Set(prev).add(userId));
    },
    onError: () => toast.error('Could not follow user'),
  });

  const finishOnboarding = () => router.replace('/feed');

  // ── SUGGESTIONS STEP ────────────────────────────────────────────────────
  if (step === 'suggestions') {
    return (
      // Fill the viewport and cap at 100dvh so the inner scroll area has
      // real bounds. Without a bounded height the flex-1 list + footer
      // collide and the list gets clipped.
      <div className="flex flex-col flex-1 min-h-0 h-[100dvh] px-5 pt-10">
        {/* Header — doesn't scroll */}
        <div className="flex-shrink-0">
          <div className="flex justify-center mb-6">
            <Logo size="md" />
          </div>

          <div className="space-y-1 mb-6">
            <h1 className="text-2xl font-bold text-foreground">
              Follow corpers in {stateLabel}
            </h1>
            <p className="text-sm text-foreground-muted">
              Start with corps members serving near you. You can discover more any time.
            </p>
          </div>
        </div>

        {/* Scrollable list — flex-1 + min-h-0 lets it shrink + scroll */}
        <div className="flex-1 min-h-0 overflow-y-auto -mx-5 px-5 pb-2">
          {isLoadingPrimary ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-surface-alt rounded-xl animate-pulse">
                  <div className="w-11 h-11 rounded-full bg-border flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-border rounded w-1/3" />
                    <div className="h-2.5 bg-border rounded w-1/4" />
                  </div>
                  <div className="h-8 w-16 bg-border rounded-full" />
                </div>
              ))}
            </div>
          ) : suggestions.length === 0 ? (
            <div className="py-10 text-center">
              <UserPlus className="w-10 h-10 text-foreground-muted mx-auto mb-3" />
              <p className="text-sm text-foreground-muted">
                No corpers from {stateLabel} yet — try "Discover more corpers" below.
              </p>
              {!discoverMore && (
                <button
                  onClick={() => setDiscoverMore(true)}
                  className="mt-4 text-sm font-semibold text-primary"
                >
                  Discover more corpers →
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {suggestions.map((u) => {
                const isFollowing = followed.has(u.id);
                const initials = getInitials(u.firstName, u.lastName);
                return (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 p-3 bg-surface border border-border rounded-xl"
                  >
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {u.profilePicture ? (
                        <Image
                          src={u.profilePicture}
                          alt={initials}
                          width={44}
                          height={44}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <span className="font-bold text-primary text-sm uppercase">{initials}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {u.firstName} {u.lastName}
                        </p>
                        {u.isVerified && (
                          <BadgeCheck className="w-3.5 h-3.5 text-info flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <LevelBadge level={u.level} size="sm" />
                        {u.servingState && (
                          <span className="text-[10px] text-foreground-muted">
                            {u.servingState}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => !isFollowing && followMutation.mutate(u.id)}
                      disabled={isFollowing}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                        isFollowing
                          ? 'bg-surface-alt text-foreground-muted border border-border'
                          : 'bg-primary text-white hover:bg-primary-dark'
                      }`}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                  </div>
                );
              })}

              {/* "Discover more" — toggles the broader global list */}
              {!discoverMore ? (
                <button
                  onClick={() => setDiscoverMore(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 mt-2 rounded-xl border border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">
                    Discover more corpers
                  </span>
                </button>
              ) : isLoadingMore ? (
                <p className="text-xs text-foreground-muted text-center py-3">
                  Loading more…
                </p>
              ) : null}
            </div>
          )}
        </div>

        {/* Sticky footer — flex-shrink-0 so the list claims space correctly */}
        <div className="flex-shrink-0 space-y-3 py-4 border-t border-border bg-surface">
          <Button fullWidth onClick={finishOnboarding}>
            {followed.size > 0 ? `Finish (${followed.size} followed)` : 'Finish'}
          </Button>
          <Button type="button" variant="ghost" fullWidth onClick={finishOnboarding}>
            Skip for now
          </Button>
        </div>
      </div>
    );
  }

  // ── PROFILE STEP ────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col flex-1 px-5 pt-12 pb-8">
      <div className="flex justify-center mb-8">
        <Logo size="md" />
      </div>

      <div className="space-y-1 mb-8">
        <h1 className="text-2xl font-bold text-foreground">Set up your profile</h1>
        <p className="text-sm text-foreground-muted">
          Tell the community a bit about yourself. You can always update this later.
        </p>
      </div>

      <form onSubmit={handleSubmit((d) => profileMutation.mutate(d))} className="space-y-5 flex-1">
        <div className="space-y-1.5">
          <Input
            label="Bio (optional)"
            placeholder="Serving in Lagos state, Batch B Stream 2..."
            error={errors.bio?.message}
            {...register('bio')}
          />
          <p className="text-xs text-foreground-muted text-right">{bioLength}/160</p>
        </div>

        <div className="flex items-center justify-between p-4 bg-surface-alt rounded-xl">
          <div>
            <p className="text-sm font-medium text-foreground">Show Corper Tag</p>
            <p className="text-xs text-foreground-muted mt-0.5">
              Display your NYSC batch on your profile
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              {...register('corperTag')}
            />
            <div className="w-11 h-6 bg-surface border-2 border-border rounded-full peer peer-checked:bg-primary peer-checked:border-primary transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-5 after:h-5 after:rounded-full after:bg-white after:shadow after:transition-all peer-checked:after:translate-x-5" />
          </label>
        </div>

        <div className="space-y-3 pt-2">
          <Button type="submit" fullWidth isLoading={profileMutation.isPending}>
            Next: Follow Corpers
          </Button>

          <Button
            type="button"
            variant="ghost"
            fullWidth
            onClick={() => router.replace('/feed')}
          >
            Skip for now
          </Button>
        </div>
      </form>
    </div>
  );
}
