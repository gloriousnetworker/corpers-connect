'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, IdCard, Camera, Info } from 'lucide-react';

import Logo from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PasswordInput from '@/components/auth/PasswordInput';
import {
  marketerRegisterInitiateSchema,
  type MarketerRegisterInitiateInput,
} from '@/lib/validators';
import { registerMarketerInitiate } from '@/lib/api/auth';
import { ACCEPTED_IMAGE_TYPES, MAX_MEDIA_SIZE_MB } from '@/lib/constants';

export default function MarketerRegisterPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<MarketerRegisterInitiateInput>({
    resolver: zodResolver(marketerRegisterInitiateSchema),
  });

  const password = watch('password', '');

  const [ninFile, setNinFile] = useState<File | null>(null);
  const [ninPreview, setNinPreview] = useState<string | null>(null);
  const [ninError, setNinError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNinPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(f.type)) {
      setNinError('Please pick a JPG, PNG, or WEBP image.');
      return;
    }
    const sizeLimit = MAX_MEDIA_SIZE_MB * 1024 * 1024;
    if (f.size > sizeLimit) {
      setNinError(`File is too large (max ${MAX_MEDIA_SIZE_MB} MB).`);
      return;
    }
    setNinError('');
    if (ninPreview) URL.revokeObjectURL(ninPreview);
    setNinFile(f);
    setNinPreview(URL.createObjectURL(f));
  };

  const mutation = useMutation({
    mutationFn: (data: MarketerRegisterInitiateInput) => {
      if (!ninFile) throw new Error('Please upload a photo of your NIN.');
      return registerMarketerInitiate({ ...data, ninDocument: ninFile });
    },
    onSuccess: (res) => {
      toast.success(`Verification code sent to ${res.maskedEmail}`);
      const params = new URLSearchParams({
        email: res.email,
        maskedEmail: res.maskedEmail,
      });
      router.push(`/marketer-register/confirm?${params.toString()}`);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Registration failed. Please try again.', { duration: 8000 });
    },
  });

  const onSubmit = handleSubmit((data) => {
    if (!ninFile) {
      setNinError('Please upload a photo of your NIN.');
      return;
    }
    mutation.mutate(data);
  });

  return (
    <div className="flex flex-col px-5 pt-8 pb-8">
      <div className="flex justify-center mb-5">
        <Logo size="md" />
      </div>

      <Link
        href="/welcome"
        className="flex items-center gap-1.5 text-sm text-foreground-muted mb-4 touch-manipulation"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
          <IdCard className="h-6 w-6 text-amber-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sign up as a Mami Marketer</h1>
          <p className="text-sm text-foreground-muted">
            For Nigerians who want to do business on Mami Market
          </p>
        </div>
      </div>

      {/* Notice */}
      <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 mt-4">
        <Info className="h-4 w-4 text-amber-700 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-900 leading-relaxed">
          You'll be able to browse Corpers Connect right away, but listing on
          the marketplace is unlocked once we verify your NIN (usually 24–48h).
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First name"
            placeholder="Adaeze"
            autoCapitalize="words"
            error={errors.firstName?.message}
            {...register('firstName')}
          />
          <Input
            label="Last name"
            placeholder="Okafor"
            autoCapitalize="words"
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>

        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoCapitalize="none"
          autoCorrect="off"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Phone number"
          type="tel"
          placeholder="08012345678"
          error={errors.phone?.message}
          {...register('phone')}
        />

        <Input
          label="NIN"
          placeholder="11-digit NIN"
          inputMode="numeric"
          maxLength={11}
          hint="Your National Identification Number"
          error={errors.nin?.message}
          {...register('nin')}
        />

        {/* NIN photo */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Upload a photo of your NIN slip / card
          </label>
          {ninPreview ? (
            <div className="space-y-2">
              <div className="relative w-full rounded-xl overflow-hidden bg-surface-alt border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ninPreview}
                  alt="NIN preview"
                  className="w-full max-h-[280px] object-contain"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-2 rounded-lg border border-border text-sm font-medium text-foreground-secondary hover:bg-surface-alt transition-colors"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (ninPreview) URL.revokeObjectURL(ninPreview);
                    setNinFile(null);
                    setNinPreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="flex-1 py-2 rounded-lg border border-error/40 text-sm font-medium text-error hover:bg-error/5 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed border-border bg-surface-alt hover:border-primary/60 hover:bg-primary/5 transition-colors"
            >
              <Camera className="h-5 w-5 text-foreground-secondary" />
              <span className="text-sm font-medium text-foreground-secondary">
                Tap to upload (JPG/PNG, max {MAX_MEDIA_SIZE_MB} MB)
              </span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(',')}
            className="hidden"
            onChange={handleNinPick}
          />
          {ninError && (
            <p className="mt-1.5 text-sm text-error">{ninError}</p>
          )}
        </div>

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
          Create Marketer Account
        </Button>
      </form>

      <p className="text-center text-sm text-foreground-muted mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-primary font-semibold touch-manipulation">
          Sign in
        </Link>
      </p>

      <p className="text-center text-sm text-foreground-muted mt-3">
        Are you a corper instead?{' '}
        <Link href="/register" className="text-primary font-semibold touch-manipulation">
          Sign up with NYSC code
        </Link>
      </p>
    </div>
  );
}
