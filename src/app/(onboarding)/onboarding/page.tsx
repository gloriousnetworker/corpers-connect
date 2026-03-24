'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';

import Logo from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { onboardingSchema, type UpdateProfileInput } from '@/lib/validators';
import { onboardMe } from '@/lib/api/users';
import { useAuthStore } from '@/store/auth.store';

export default function OnboardingPage() {
  const router = useRouter();
  const { updateUser } = useAuthStore();

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

  const mutation = useMutation({
    mutationFn: (data: UpdateProfileInput) =>
      onboardMe({ ...data, corperTagLabel: data.corperTagLabel ?? undefined }),
    onSuccess: (user) => {
      updateUser(user);
      router.replace('/feed');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Setup failed. Please try again.');
    },
  });

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

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5 flex-1">
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
          <Button type="submit" fullWidth isLoading={mutation.isPending}>
            Get Started
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
