'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';

import Logo from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PasswordInput from '@/components/auth/PasswordInput';
import { registerInitiateSchema, type RegisterInitiateInput } from '@/lib/validators';
import { registerInitiate } from '@/lib/api/auth';
import { useUIStore } from '@/store/ui.store';

export default function RegisterPage() {
  const router = useRouter();
  const { setRegistration } = useUIStore();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterInitiateInput>({
    resolver: zodResolver(registerInitiateSchema),
  });

  const password = watch('password', '');

  const mutation = useMutation({
    mutationFn: (data: RegisterInitiateInput) => registerInitiate(data),
    onSuccess: (res, vars) => {
      setRegistration({
        stateCode: vars.stateCode,
        password: vars.password,
        otpToken: res.otpToken,
        maskedEmail: res.maskedEmail,
      });
      router.push('/register/confirm');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Registration failed. Please try again.');
    },
  });

  return (
    <div className="flex flex-col flex-1 px-5 pt-10 pb-8">
      <div className="flex justify-center mb-8">
        <Logo size="md" />
      </div>

      <div className="space-y-1 mb-6">
        <h1 className="text-2xl font-bold text-foreground">Create account</h1>
        <p className="text-sm text-foreground-muted">
          Use your NYSC State Code to get started
        </p>
      </div>

      {/* Steps indicator */}
      <div className="flex gap-2 mb-7">
        {[1, 2, 3].map((step) => (
          <div
            key={step}
            className={`h-1.5 flex-1 rounded-full ${step === 1 ? 'bg-primary' : 'bg-surface-alt'}`}
          />
        ))}
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4 flex-1">
        <Input
          label="NYSC State Code"
          placeholder="e.g. AB/23A/1234"
          autoCapitalize="characters"
          autoCorrect="off"
          hint="Format: XX/YYX/NNNN (as on your call-up letter)"
          error={errors.stateCode?.message}
          {...register('stateCode')}
        />

        <PasswordInput
          label="Create Password"
          placeholder="Min 8 chars, uppercase, number, symbol"
          showStrength
          value={password}
          error={errors.password?.message}
          {...register('password')}
        />

        <PasswordInput
          label="Confirm Password"
          placeholder="Repeat your password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button
          type="submit"
          fullWidth
          isLoading={mutation.isPending}
          className="mt-2"
        >
          Continue
        </Button>
      </form>

      <p className="text-center text-sm text-foreground-muted mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-primary font-semibold touch-manipulation">
          Sign in
        </Link>
      </p>
    </div>
  );
}
