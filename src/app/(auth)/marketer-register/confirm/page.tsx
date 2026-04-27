'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, IdCard } from 'lucide-react';

import { Button } from '@/components/ui/button';
import OtpInput from '@/components/auth/OtpInput';
import {
  marketerRegisterVerifySchema,
  type MarketerRegisterVerifyInput,
} from '@/lib/validators';
import { registerMarketerVerify } from '@/lib/api/auth';
import { useAuthStore } from '@/store/auth.store';

function MarketerRegisterConfirmInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const maskedEmail = searchParams.get('maskedEmail') ?? '';
  const { setAuth } = useAuthStore();
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    // Bounce back to the form if someone lands here without an in-flight
    // registration (e.g. refresh after success).
    if (!email && !verified) {
      router.replace('/marketer-register');
    }
  }, [email, verified, router]);

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MarketerRegisterVerifyInput>({
    resolver: zodResolver(marketerRegisterVerifySchema),
    defaultValues: { email, otp: '' },
  });

  const otp = watch('otp', '');

  const mutation = useMutation({
    mutationFn: (data: MarketerRegisterVerifyInput) => registerMarketerVerify(data),
    onSuccess: (res) => {
      setVerified(true);
      setAuth(res.user, res.accessToken);
      // Marketers don't go through the corper onboarding step — drop them
      // straight into the app where the pending banner will brief them.
      router.replace('/');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Invalid OTP. Please try again.');
    },
  });

  const onSubmit = handleSubmit((data) => mutation.mutate(data));

  if (!email && !verified) return null;

  return (
    <div className="flex flex-col px-5 pt-10 pb-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-foreground-muted mb-8 touch-manipulation"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
          <IdCard className="h-6 w-6 text-amber-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Verify your email</h1>
          <p className="text-sm text-foreground-muted">
            We sent a 6-digit code to{' '}
            <span className="font-medium text-foreground">{maskedEmail}</span>
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6 mt-6">
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
          Verify & Create Account
        </Button>

        <p className="text-center text-sm text-foreground-muted">
          Didn&apos;t receive a code?{' '}
          <button
            type="button"
            onClick={() => router.replace('/marketer-register')}
            className="text-primary font-medium touch-manipulation"
          >
            Start over
          </button>
        </p>
      </form>
    </div>
  );
}

// useSearchParams() must be wrapped in <Suspense> in Next.js App Router.
export default function MarketerRegisterConfirmPage() {
  return (
    <Suspense fallback={null}>
      <MarketerRegisterConfirmInner />
    </Suspense>
  );
}
