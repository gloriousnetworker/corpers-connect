'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import OtpInput from '@/components/auth/OtpInput';
import { registerVerifySchema, type RegisterVerifyInput } from '@/lib/validators';
import { registerVerify } from '@/lib/api/auth';
import { useUIStore } from '@/store/ui.store';
import { useAuthStore } from '@/store/auth.store';

export default function RegisterConfirmPage() {
  const router = useRouter();
  const { registration, clearRegistration } = useUIStore();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    if (!registration.otpToken) {
      router.replace('/register');
    }
  }, [registration.otpToken, router]);

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterVerifyInput>({
    resolver: zodResolver(registerVerifySchema),
    defaultValues: { otpToken: registration.otpToken, otp: '' },
  });

  const otp = watch('otp', '');

  const mutation = useMutation({
    mutationFn: (data: RegisterVerifyInput) => registerVerify(data),
    onSuccess: (res) => {
      setAuth(res.user, res.accessToken, res.refreshToken);
      clearRegistration();
      router.replace('/register/verify');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Invalid OTP. Please try again.');
    },
  });

  const onSubmit = handleSubmit((data) => mutation.mutate(data));

  return (
    <div className="flex flex-col flex-1 px-5 pt-10 pb-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-foreground-muted mb-8 touch-manipulation"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="space-y-1 mb-3">
        <h1 className="text-2xl font-bold text-foreground">Verify your email</h1>
        <p className="text-sm text-foreground-muted">
          We sent a 6-digit code to{' '}
          <span className="font-medium text-foreground">{registration.maskedEmail}</span>
        </p>
      </div>

      {/* Steps indicator */}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map((step) => (
          <div
            key={step}
            className={`h-1.5 flex-1 rounded-full ${step <= 2 ? 'bg-primary' : 'bg-surface-alt'}`}
          />
        ))}
      </div>

      <form onSubmit={onSubmit} className="space-y-6 flex-1">
        <OtpInput
          value={otp}
          onChange={(val) => setValue('otp', val)}
          error={!!errors.otp}
        />

        {errors.otp && (
          <p className="text-center text-sm text-danger">{errors.otp.message}</p>
        )}

        <Button
          type="submit"
          fullWidth
          isLoading={mutation.isPending}
          disabled={otp.length < 6}
        >
          Verify Email
        </Button>

        <p className="text-center text-sm text-foreground-muted">
          Didn&apos;t receive a code?{' '}
          <button type="button" className="text-primary font-medium touch-manipulation">
            Resend
          </button>
        </p>
      </form>
    </div>
  );
}
