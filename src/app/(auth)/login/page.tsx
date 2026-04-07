'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';

import Logo from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PasswordInput from '@/components/auth/PasswordInput';
import { loginSchema, type LoginInput } from '@/lib/validators';
import { login } from '@/lib/api/auth';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import type { LoginResponse, LoginWith2FAResponse } from '@/types/api';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/feed';
  const { setAuth } = useAuthStore();
  const { setTwoFAChallenge } = useUIStore();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: LoginInput) => login(data),
    onSuccess: (res: LoginResponse | LoginWith2FAResponse) => {
      if ('requiresTwoFactor' in res && res.requiresTwoFactor) {
        const twoFARes = res as LoginWith2FAResponse;
        setTwoFAChallenge({
          challengeToken: twoFARes.challengeToken,
          userId: twoFARes.userId,
        });
        router.push('/2fa');
        return;
      }
      const fullRes = res as LoginResponse;
      setAuth(fullRes.user, fullRes.accessToken);
      router.replace(next);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Invalid credentials');
    },
  });

  return (
    <div className="flex flex-col px-5 pt-8 md:pt-6 pb-8">
      <div className="flex justify-center mb-6 md:mb-4">
        <Logo size="md" />
      </div>

      <div className="space-y-1 mb-5 md:mb-4">
        <h1 className="text-2xl md:text-xl font-bold text-foreground">Welcome back</h1>
        <p className="text-sm text-foreground-muted">Sign in to your Corpers Connect account</p>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <Input
          label="Email or State Code"
          placeholder="e.g. user@email.com or AB/23A/1234"
          autoComplete="username"
          autoCapitalize="none"
          error={errors.identifier?.message}
          {...register('identifier')}
        />

        <PasswordInput
          label="Password"
          placeholder="Enter your password"
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm text-primary font-medium touch-manipulation"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          fullWidth
          isLoading={mutation.isPending}
          className="mt-2"
        >
          Sign In
        </Button>
      </form>

      <p className="text-center text-sm text-foreground-muted mt-8">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-primary font-semibold touch-manipulation">
          Register
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
