'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, User, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';

export default function RegisterVerifyPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace('/register');
    }
  }, [isAuthenticated, user, router]);

  if (!user) return null;

  return (
    <div className="flex flex-col min-h-dvh px-5 pt-10 pb-8">
      {/* Steps indicator */}
      <div className="flex gap-2 mb-10">
        {[1, 2, 3].map((step) => (
          <div key={step} className="h-1.5 flex-1 rounded-full bg-primary" />
        ))}
      </div>

      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8 text-success" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">You&apos;re in! 🎉</h1>
        <p className="text-sm text-foreground-muted mt-1 text-center">
          Your NYSC identity has been verified
        </p>
      </div>

      {/* User info card */}
      <div className="bg-surface-alt rounded-2xl p-4 space-y-3 mb-8">
        <p className="text-xs text-foreground-muted font-semibold uppercase tracking-wide">
          Welcome to Corpers Connect
        </p>
        <div className="flex items-center gap-3">
          <User className="h-4 w-4 text-primary flex-shrink-0" />
          <span className="text-sm text-foreground font-medium">
            {user.firstName} {user.lastName}
          </span>
        </div>
        {user.servingState && (
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="text-sm text-foreground">{user.servingState}</span>
          </div>
        )}
      </div>

      <Button fullWidth onClick={() => router.replace('/onboarding')}>
        Set Up My Profile
      </Button>
    </div>
  );
}
