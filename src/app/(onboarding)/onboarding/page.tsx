'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { BadgeCheck, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery } from '@tanstack/react-query';

import Logo from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { onboardingSchema, type UpdateProfileInput } from '@/lib/validators';
import { onboardMe } from '@/lib/api/users';
import { followUser } from '@/lib/api/users';
import { getSuggestions } from '@/lib/api/discover';
import { useAuthStore } from '@/store/auth.store';
import { getInitials } from '@/lib/utils';
import LevelBadge from '@/components/profile/LevelBadge';

type Step = 'profile' | 'suggestions';

export default function OnboardingPage() {
  const router = useRouter();
  const { updateUser } = useAuthStore();
  const [step, setStep] = useState<Step>('profile');
  const [followed, setFollowed] = useState<Set<string>>(new Set());

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
    onSuccess: (user) => {
      updateUser(user);
      setStep('suggestions');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Setup failed. Please try again.');
    },
  });

  const suggestionsQuery = useQuery({
    queryKey: ['onboarding-suggestions'],
    queryFn: () => getSuggestions(8),
    enabled: step === 'suggestions',
    staleTime: Infinity,
  });

  const followMutation = useMutation({
    mutationFn: (userId: string) => followUser(userId),
    onSuccess: (_, userId) => {
      setFollowed((prev) => new Set(prev).add(userId));
    },
    onError: () => toast.error('Could not follow user'),
  });

  const finishOnboarding = () => router.replace('/feed');

  if (step === 'suggestions') {
    const suggestions = suggestionsQuery.data ?? [];

    return (
      <div className="flex flex-col flex-1 px-5 pt-10 pb-8">
        <div className="flex justify-center mb-6">
          <Logo size="md" />
        </div>

        <div className="space-y-1 mb-6">
          <h1 className="text-2xl font-bold text-foreground">Follow corpers near you</h1>
          <p className="text-sm text-foreground-muted">
            Connect with corps members in your state to build your feed.
          </p>
        </div>

        {suggestionsQuery.isLoading ? (
          <div className="space-y-3 flex-1">
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
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <UserPlus className="w-10 h-10 text-foreground-muted mx-auto mb-3" />
              <p className="text-sm text-foreground-muted">No suggestions yet — explore corpers after you join!</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 space-y-2 overflow-y-auto">
            {suggestions.map((user) => {
              const isFollowing = followed.has(user.id);
              const initials = getInitials(user.firstName, user.lastName);
              return (
                <div key={user.id} className="flex items-center gap-3 p-3 bg-surface border border-border rounded-xl">
                  <div className="w-11 h-11 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {user.profilePicture ? (
                      <Image src={user.profilePicture} alt={initials} width={44} height={44} className="object-cover w-full h-full" />
                    ) : (
                      <span className="font-bold text-primary text-sm uppercase">{initials}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      {user.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-info flex-shrink-0" />}
                    </div>
                    <LevelBadge level={user.level} size="sm" />
                  </div>
                  <button
                    onClick={() => !isFollowing && followMutation.mutate(user.id)}
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
          </div>
        )}

        <div className="space-y-3 pt-4 mt-4 border-t border-border">
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
