'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Mail, Phone, MapPin, Building2, BadgeCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { registerInitiate } from '@/lib/api/auth';
import { useUIStore } from '@/store/ui.store';

export default function RegisterDetailsPage() {
  const router = useRouter();
  const { registration, setRegistration } = useUIStore();
  const { stateCode, password, nyscData } = registration;

  useEffect(() => {
    if (!stateCode || !nyscData) {
      router.replace('/register');
    }
  }, [stateCode, nyscData, router]);

  const mutation = useMutation({
    mutationFn: () => registerInitiate({ stateCode, password, confirmPassword: password }),
    onSuccess: (res) => {
      setRegistration({ maskedEmail: res.maskedEmail, otpToken: res.maskedEmail });
      router.push('/register/confirm');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Registration failed. Please try again.');
    },
  });

  if (!nyscData) return null;

  return (
    <div className="flex flex-col flex-1 px-5 pt-10 pb-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-foreground-muted mb-8 touch-manipulation"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="space-y-1 mb-6">
        <h1 className="text-2xl font-bold text-foreground">Confirm your details</h1>
        <p className="text-sm text-foreground-muted">
          Please verify that these details match your NYSC records
        </p>
      </div>

      {/* Steps indicator */}
      <div className="flex gap-2 mb-7">
        {[1, 2, 3].map((step) => (
          <div
            key={step}
            className={`h-1.5 flex-1 rounded-full ${step <= 2 ? 'bg-primary' : 'bg-surface-alt'}`}
          />
        ))}
      </div>

      {/* Details card */}
      <div className="bg-surface-alt rounded-2xl p-4 space-y-4 mb-6">
        <div className="flex items-start gap-3">
          <BadgeCheck className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-foreground-muted uppercase tracking-wide font-medium">Full Name</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">
              {nyscData.firstName} {nyscData.lastName}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Mail className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-foreground-muted uppercase tracking-wide font-medium">Email</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">{nyscData.email}</p>
          </div>
        </div>

        {nyscData.phone && (
          <div className="flex items-start gap-3">
            <Phone className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-foreground-muted uppercase tracking-wide font-medium">Phone</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">{nyscData.phone}</p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3">
          <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-foreground-muted uppercase tracking-wide font-medium">Serving State</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">{nyscData.servingState}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Building2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-foreground-muted uppercase tracking-wide font-medium">State Code</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">{stateCode}</p>
          </div>
        </div>
      </div>

      {/* Email notice */}
      <div className="bg-primary/8 border border-primary/20 rounded-xl px-4 py-3 mb-8">
        <p className="text-sm text-foreground-muted">
          A verification code will be sent to{' '}
          <span className="font-semibold text-foreground">{nyscData.email}</span>
        </p>
      </div>

      <Button
        fullWidth
        isLoading={mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        Confirm & Send Code
      </Button>

      <p className="text-center text-xs text-foreground-muted mt-4">
        Not you?{' '}
        <button
          type="button"
          onClick={() => router.replace('/register')}
          className="text-primary font-medium touch-manipulation"
        >
          Go back and re-enter your state code
        </button>
      </p>
    </div>
  );
}
