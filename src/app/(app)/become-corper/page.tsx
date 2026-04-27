'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft, GraduationCap, Camera, Info, Clock, CheckCircle2, AlertCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/auth.store';
import {
  getMyCorperUpgrade,
  requestCorperUpgrade,
  getMe,
} from '@/lib/api/users';
import {
  requestCorperUpgradeSchema,
  type RequestCorperUpgradeInput,
} from '@/lib/validators';
import { ACCEPTED_IMAGE_TYPES, MAX_MEDIA_SIZE_MB } from '@/lib/constants';
import { AccountType, MarketerStatus, CorperUpgradeStatus } from '@/types/enums';

export default function BecomeCorperPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  const isMarketer        = user?.accountType === AccountType.MARKETER;
  const isApprovedMarketer = isMarketer && user?.marketerStatus === MarketerStatus.APPROVED;

  // Authoritative status comes from the API — auth-store user might be stale.
  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ['users', 'me', 'corper-upgrade'],
    queryFn: getMyCorperUpgrade,
    enabled: !!user && isMarketer,
    staleTime: 30_000,
  });

  const upgradeStatus = status?.corperUpgradeStatus ?? user?.corperUpgradeStatus ?? null;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestCorperUpgradeInput>({
    resolver: zodResolver(requestCorperUpgradeSchema),
  });

  const [docFile, setDocFile] = useState<File | null>(null);
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const [docError, setDocError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDocPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(f.type)) {
      setDocError('Please pick a JPG, PNG, or WEBP image.');
      return;
    }
    const sizeLimit = MAX_MEDIA_SIZE_MB * 1024 * 1024;
    if (f.size > sizeLimit) {
      setDocError(`File is too large (max ${MAX_MEDIA_SIZE_MB} MB).`);
      return;
    }
    setDocError('');
    if (docPreview) URL.revokeObjectURL(docPreview);
    setDocFile(f);
    setDocPreview(URL.createObjectURL(f));
  };

  const mutation = useMutation({
    mutationFn: (data: RequestCorperUpgradeInput) => {
      if (!docFile) throw new Error('Please upload your NYSC document.');
      return requestCorperUpgrade({ stateCode: data.stateCode, document: docFile });
    },
    onSuccess: async () => {
      toast.success("Upgrade submitted — we'll email you within 24-48h.");
      // Refresh both the upgrade-status query and the auth store so the
      // banner / nav reflects the new pending state on the next render.
      await queryClient.invalidateQueries({ queryKey: ['users', 'me', 'corper-upgrade'] });
      try {
        const fresh = await getMe();
        setUser(fresh);
      } catch { /* non-fatal */ }
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Could not submit upgrade. Please try again.', { duration: 8000 });
    },
  });

  const onSubmit = handleSubmit((data) => {
    if (!docFile) {
      setDocError('Please upload your NYSC posting letter or ID card.');
      return;
    }
    mutation.mutate(data);
  });

  // ── Gate: page only useful for approved marketers ─────────────────────────
  if (!user) {
    return null;
  }

  if (!isMarketer) {
    return (
      <Centered>
        <div className="space-y-3 text-center">
          <GraduationCap className="h-10 w-10 text-primary mx-auto" />
          <h1 className="text-xl font-bold text-foreground">You're already a Corper</h1>
          <p className="text-sm text-foreground-muted">
            This upgrade flow is for Mami Marketers who want to add Corper privileges.
          </p>
          <Button onClick={() => router.replace('/')}>Back to Corpers Connect</Button>
        </div>
      </Centered>
    );
  }

  if (!isApprovedMarketer) {
    return (
      <Centered>
        <div className="space-y-3 text-center">
          <Clock className="h-10 w-10 text-amber-700 mx-auto" />
          <h1 className="text-xl font-bold text-foreground">Marketer verification pending</h1>
          <p className="text-sm text-foreground-muted">
            You can request a Corper upgrade once your Marketer account is approved.
          </p>
          <Button onClick={() => router.replace('/')}>Back</Button>
        </div>
      </Centered>
    );
  }

  // Already submitted an upgrade — show the status, not the form.
  if (upgradeStatus === CorperUpgradeStatus.PENDING) {
    return (
      <Centered>
        <div className="space-y-3 text-center max-w-sm">
          <Clock className="h-10 w-10 text-amber-700 mx-auto" />
          <h1 className="text-xl font-bold text-foreground">Reviewing your request</h1>
          <p className="text-sm text-foreground-muted">
            Your Corper upgrade is in our review queue. We'll email you within
            24-48 hours. Your Mami Marketer account remains fully active in the
            meantime.
          </p>
          {status?.corperUpgradeRequestedStateCode && (
            <p className="text-xs text-foreground-muted">
              Submitted state code:{' '}
              <span className="font-mono font-semibold text-foreground">
                {status.corperUpgradeRequestedStateCode}
              </span>
            </p>
          )}
          <Button onClick={() => router.replace('/')}>Back to Corpers Connect</Button>
        </div>
      </Centered>
    );
  }

  if (upgradeStatus === CorperUpgradeStatus.APPROVED) {
    return (
      <Centered>
        <div className="space-y-3 text-center max-w-sm">
          <CheckCircle2 className="h-10 w-10 text-success mx-auto" />
          <h1 className="text-xl font-bold text-foreground">You're a Corper!</h1>
          <p className="text-sm text-foreground-muted">
            Your account has been upgraded. Posts, stories, reels, and the Corper
            community are unlocked.
          </p>
          <Button onClick={() => router.replace('/')}>Go to feed</Button>
        </div>
      </Centered>
    );
  }

  if (upgradeStatus === CorperUpgradeStatus.REJECTED) {
    return (
      <Centered>
        <div className="space-y-4 text-center max-w-sm w-full">
          <AlertCircle className="h-10 w-10 text-error mx-auto" />
          <h1 className="text-xl font-bold text-foreground">Upgrade not approved</h1>
          {status?.corperUpgradeRejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-left">
              <p className="text-xs font-semibold text-red-900 uppercase tracking-wide">
                Reason
              </p>
              <p className="text-sm text-red-900/90 mt-1">
                {status.corperUpgradeRejectionReason}
              </p>
            </div>
          )}
          <p className="text-sm text-foreground-muted">
            You can re-submit with a clearer NYSC document below.
          </p>
          <RequestForm
            onSubmit={onSubmit}
            register={register}
            errors={errors}
            docPreview={docPreview}
            docError={docError}
            handleDocPick={handleDocPick}
            fileInputRef={fileInputRef}
            removeDoc={() => {
              if (docPreview) URL.revokeObjectURL(docPreview);
              setDocFile(null);
              setDocPreview(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            isPending={mutation.isPending}
          />
        </div>
      </Centered>
    );
  }

  // Default: no prior request — show the form.
  return (
    <div className="max-w-lg mx-auto px-5 py-8">
      <Link
        href="/"
        className="flex items-center gap-1.5 text-sm text-foreground-muted mb-6 touch-manipulation"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <GraduationCap className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Become a Corper</h1>
          <p className="text-sm text-foreground-muted">
            Add Corper privileges to your Mami Marketer account
          </p>
        </div>
      </div>

      <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 mt-2">
        <Info className="h-4 w-4 text-amber-700 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-900 leading-relaxed">
          To upgrade, submit your NYSC state code and a clear photo of your
          posting letter or ID card. Your Mami Market shop stays untouched — this
          just unlocks posts, stories, reels and the corper community.
        </p>
      </div>

      {statusLoading ? (
        <div className="text-center text-sm text-foreground-muted py-6">Checking status…</div>
      ) : (
        <RequestForm
          onSubmit={onSubmit}
          register={register}
          errors={errors}
          docPreview={docPreview}
          docError={docError}
          handleDocPick={handleDocPick}
          fileInputRef={fileInputRef}
          removeDoc={() => {
            if (docPreview) URL.revokeObjectURL(docPreview);
            setDocFile(null);
            setDocPreview(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}
          isPending={mutation.isPending}
        />
      )}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-5 py-8">
      {children}
    </div>
  );
}

interface FormProps {
  onSubmit: (e: React.FormEvent) => void;
  register: ReturnType<typeof useForm<RequestCorperUpgradeInput>>['register'];
  errors: ReturnType<typeof useForm<RequestCorperUpgradeInput>>['formState']['errors'];
  docPreview: string | null;
  docError: string;
  handleDocPick: (e: React.ChangeEvent<HTMLInputElement>) => void;
  // useRef gives RefObject<T | null>; typing as LegacyRef avoids the strict
  // mode mismatch on the underlying <input ref={...}> assignment.
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  removeDoc: () => void;
  isPending: boolean;
}

function RequestForm({
  onSubmit, register, errors, docPreview, docError,
  handleDocPick, fileInputRef, removeDoc, isPending,
}: FormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 text-left" noValidate>
      <Input
        label="NYSC State Code"
        placeholder="e.g. LA/24A/1234"
        autoCapitalize="characters"
        autoCorrect="off"
        hint="Format: XX/YYX/NNNN (as on your call-up letter)"
        error={errors.stateCode?.message}
        {...register('stateCode')}
      />

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          NYSC Posting Letter / ID Card
        </label>
        {docPreview ? (
          <div className="space-y-2">
            <div className="relative w-full rounded-xl overflow-hidden bg-surface-alt border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={docPreview}
                alt="NYSC document preview"
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
                onClick={removeDoc}
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
          onChange={handleDocPick}
        />
        {docError && <p className="mt-1.5 text-sm text-error">{docError}</p>}
      </div>

      <Button
        type="submit"
        fullWidth
        isLoading={isPending}
        className="mt-2"
      >
        Submit Upgrade Request
      </Button>
    </form>
  );
}
