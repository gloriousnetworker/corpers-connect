'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import OtpInput from '@/components/auth/OtpInput';
import PasswordInput from '@/components/auth/PasswordInput';
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validators';
import { resetPassword } from '@/lib/api/auth';
import { useUIStore } from '@/store/ui.store';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { passwordReset, clearPasswordReset } = useUIStore();
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!passwordReset.otpToken) {
      router.replace('/forgot-password');
    }
  }, [passwordReset.otpToken, router]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { otpToken: passwordReset.otpToken, otp: '' },
  });

  const otp = watch('otp', '');
  const newPassword = watch('newPassword', '');

  const mutation = useMutation({
    mutationFn: (data: ResetPasswordInput) => resetPassword(data),
    onSuccess: () => {
      clearPasswordReset();
      setDone(true);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Reset failed. Please try again.');
    },
  });

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 px-5 text-center">
        <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8 text-success" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Password Reset</h1>
        <p className="text-sm text-foreground-muted mb-8">
          Your password has been reset successfully.
        </p>
        <Button fullWidth onClick={() => router.push('/login')}>
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col px-5 pt-10 pb-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-foreground-muted mb-8 touch-manipulation"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="space-y-1 mb-4">
        <h1 className="text-2xl font-bold text-foreground">Reset password</h1>
        <p className="text-sm text-foreground-muted">
          Enter the code sent to{' '}
          <span className="font-medium text-foreground">{passwordReset.maskedEmail}</span> and your new
          password.
        </p>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5 mt-4">
        <div>
          <p className="text-sm font-medium text-foreground mb-3">Verification code</p>
          <OtpInput
            value={otp}
            onChange={(val) => setValue('otp', val)}
            error={!!errors.otp}
          />
          {errors.otp && (
            <p className="text-center text-sm text-danger mt-2">{errors.otp.message}</p>
          )}
        </div>

        <PasswordInput
          label="New Password"
          placeholder="Min 8 chars, uppercase, number, symbol"
          showStrength
          value={newPassword}
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />

        <PasswordInput
          label="Confirm New Password"
          placeholder="Repeat your new password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button
          type="submit"
          fullWidth
          isLoading={mutation.isPending}
          disabled={otp.length < 6}
        >
          Reset Password
        </Button>
      </form>
    </div>
  );
}
