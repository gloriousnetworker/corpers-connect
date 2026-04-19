'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validators';
import { forgotPassword } from '@/lib/api/auth';
import { useUIStore } from '@/store/ui.store';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { setPasswordReset } = useUIStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: ForgotPasswordInput) => forgotPassword(data.identifier),
    onSuccess: (res) => {
      setPasswordReset({
        email: res.otpToken,
        otpToken: res.otpToken,
        maskedEmail: res.maskedEmail,
      });
      router.push('/reset-password');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Could not send reset email. Please try again.');
    },
  });

  return (
    <div className="flex flex-col px-5 pt-10 pb-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-foreground-muted mb-8 touch-manipulation"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="space-y-1 mb-8">
        <h1 className="text-2xl font-bold text-foreground">Forgot password</h1>
        <p className="text-sm text-foreground-muted">
          Enter your email address or state code and we&apos;ll send a reset code to your registered email.
        </p>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <Input
          label="Email or State Code"
          type="text"
          placeholder="your@email.com or AB/23A/1234"
          autoComplete="email"
          autoCapitalize="none"
          error={errors.identifier?.message}
          {...register('identifier')}
        />

        <Button
          type="submit"
          fullWidth
          isLoading={mutation.isPending}
        >
          Send Reset Code
        </Button>
      </form>

      <p className="text-center text-sm text-foreground-muted mt-8">
        Remembered it?{' '}
        <Link href="/login" className="text-primary font-semibold touch-manipulation">
          Sign in
        </Link>
      </p>
    </div>
  );
}
