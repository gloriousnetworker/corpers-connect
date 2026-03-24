'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import OtpInput from '@/components/auth/OtpInput';
import { twoFAChallengeSchema, type TwoFAChallengeInput } from '@/lib/validators';
import { twoFAChallenge } from '@/lib/api/auth';
import { useUIStore } from '@/store/ui.store';
import { useAuthStore } from '@/store/auth.store';

export default function TwoFAPage() {
  const router = useRouter();
  const { twoFAChallenge: challengeData, setTwoFAChallenge } = useUIStore();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    if (!challengeData) {
      router.replace('/login');
    }
  }, [challengeData, router]);

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TwoFAChallengeInput>({
    resolver: zodResolver(twoFAChallengeSchema),
    defaultValues: {
      challengeToken: challengeData?.challengeToken ?? '',
      totpCode: '',
    },
  });

  const totpCode = watch('totpCode', '');

  const mutation = useMutation({
    mutationFn: (data: TwoFAChallengeInput) => twoFAChallenge(data),
    onSuccess: (res) => {
      setAuth(res.user, res.accessToken, res.refreshToken);
      setTwoFAChallenge(null);
      router.replace('/feed');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Invalid code. Please try again.');
    },
  });

  if (!challengeData) return null;

  return (
    <div className="flex flex-col flex-1 px-5 pt-10 pb-8">
      <button
        onClick={() => {
          setTwoFAChallenge(null);
          router.push('/login');
        }}
        className="flex items-center gap-1.5 text-sm text-foreground-muted mb-8 touch-manipulation"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Sign In
      </button>

      <div className="flex flex-col items-center mb-8">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <ShieldCheck className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Two-Factor Auth</h1>
        <p className="text-sm text-foreground-muted mt-1 text-center">
          Enter the 6-digit code from your authenticator app
        </p>
      </div>

      <form
        onSubmit={handleSubmit((d) => mutation.mutate(d))}
        className="space-y-6 flex-1"
      >
        <OtpInput
          value={totpCode}
          onChange={(val) => setValue('totpCode', val)}
          error={!!errors.totpCode}
        />

        {errors.totpCode && (
          <p className="text-center text-sm text-danger">{errors.totpCode.message}</p>
        )}

        <Button
          type="submit"
          fullWidth
          isLoading={mutation.isPending}
          disabled={totpCode.length < 6}
        >
          Verify
        </Button>
      </form>
    </div>
  );
}
