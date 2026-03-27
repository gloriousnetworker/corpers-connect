'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Lock, Shield, Trash2, ChevronRight, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { changePassword, initiate2FA, confirm2FA, disable2FA } from '@/lib/api/auth';
import { deleteAccount } from '@/lib/api/users';
import { getMe } from '@/lib/api/users';
import { useAuthStore } from '@/store/auth.store';
import { queryKeys } from '@/lib/query-keys';

// ── Change Password Section ────────────────────────────────────────────────────

function ChangePasswordSection() {
  const [open, setOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const mutation = useMutation({
    mutationFn: () => changePassword({ currentPassword: currentPw, newPassword: newPw }),
    onSuccess: () => {
      toast.success('Password changed successfully');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setOpen(false);
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? 'Failed to change password');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw.length < 8) return toast.error('New password must be at least 8 characters');
    if (newPw !== confirmPw) return toast.error('Passwords do not match');
    mutation.mutate();
  };

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-4 hover:bg-surface-alt active:bg-surface-alt transition-colors"
      >
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Lock className="w-4.5 h-4.5 text-primary" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-foreground">Change Password</p>
          <p className="text-xs text-foreground-muted mt-0.5">Update your account password</p>
        </div>
        <ChevronRight className={`w-4 h-4 text-foreground-muted transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="px-4 pb-4 space-y-3 border-t border-border pt-4">
          <div className="relative">
            <input
              type={showCurrent ? 'text' : 'password'}
              placeholder="Current password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              required
              className="form-input pr-10"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted"
              aria-label={showCurrent ? 'Hide password' : 'Show password'}
            >
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              placeholder="New password (min 8 chars)"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              required
              className="form-input pr-10"
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted"
              aria-label={showNew ? 'Hide password' : 'Show password'}
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            required
            className="form-input"
          />
          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full h-11 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark active:bg-primary-dark disabled:opacity-50 transition-colors"
          >
            {mutation.isPending ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      )}
    </div>
  );
}

// ── 2FA Section ────────────────────────────────────────────────────────────────

function TwoFASection({ twoFactorEnabled }: { twoFactorEnabled: boolean }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [phase, setPhase] = useState<'idle' | 'setup' | 'disable'>('idle');

  const initMutation = useMutation({
    mutationFn: initiate2FA,
    onSuccess: (data) => {
      setQrUrl(data.qrCodeUrl);
      setPhase('setup');
    },
    onError: () => toast.error('Failed to initiate 2FA setup'),
  });

  const confirmMutation = useMutation({
    mutationFn: () => confirm2FA(totpCode),
    onSuccess: () => {
      toast.success('2FA enabled successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.me() });
      setPhase('idle');
      setOpen(false);
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? 'Invalid code');
    },
  });

  const disableMutation = useMutation({
    mutationFn: () => disable2FA(disableCode),
    onSuccess: () => {
      toast.success('2FA disabled');
      queryClient.invalidateQueries({ queryKey: queryKeys.me() });
      setPhase('idle');
      setOpen(false);
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? 'Invalid code');
    },
  });

  const handleToggle = () => {
    if (!open) {
      setOpen(true);
      if (!twoFactorEnabled) {
        setPhase('setup');
        initMutation.mutate();
      } else {
        setPhase('disable');
      }
    } else {
      setOpen(false);
      setPhase('idle');
    }
  };

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <button
        onClick={handleToggle}
        className="w-full flex items-center gap-3 px-4 py-4 hover:bg-surface-alt active:bg-surface-alt transition-colors"
      >
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Shield className="w-4.5 h-4.5 text-primary" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-foreground">Two-Factor Authentication</p>
          <p className="text-xs mt-0.5">
            <span className={twoFactorEnabled ? 'text-success font-medium' : 'text-foreground-muted'}>
              {twoFactorEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </p>
        </div>
        <ChevronRight className={`w-4 h-4 text-foreground-muted transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-border pt-4 space-y-3">
          {/* Setup flow */}
          {phase === 'setup' && !twoFactorEnabled && (
            <>
              <p className="text-xs text-foreground-secondary">
                Scan this QR code with your authenticator app (e.g. Google Authenticator).
              </p>
              {initMutation.isPending && (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              )}
              {qrUrl && (
                <div className="flex justify-center py-2">
                  <Image src={qrUrl} alt="2FA QR code" width={180} height={180} className="rounded-xl border border-border" />
                </div>
              )}
              <input
                type="text"
                inputMode="numeric"
                placeholder="Enter 6-digit code"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="form-input text-center tracking-widest"
              />
              <button
                onClick={() => confirmMutation.mutate()}
                disabled={totpCode.length !== 6 || confirmMutation.isPending}
                className="w-full h-11 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark disabled:opacity-50 transition-colors"
              >
                {confirmMutation.isPending ? 'Verifying…' : 'Enable 2FA'}
              </button>
            </>
          )}

          {/* Disable flow */}
          {phase === 'disable' && twoFactorEnabled && (
            <>
              <p className="text-xs text-foreground-secondary">
                Enter your authenticator code to disable 2FA.
              </p>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Enter 6-digit code"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="form-input text-center tracking-widest"
              />
              <button
                onClick={() => disableMutation.mutate()}
                disabled={disableCode.length !== 6 || disableMutation.isPending}
                className="w-full h-11 bg-danger text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {disableMutation.isPending ? 'Disabling…' : 'Disable 2FA'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Delete Account Section ─────────────────────────────────────────────────────

function DeleteAccountSection() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState('');
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      toast.success('Account deleted');
      clearAuth();
      router.replace('/auth/login');
    },
    onError: () => toast.error('Failed to delete account'),
  });

  return (
    <div className="bg-surface border border-danger/30 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-4 hover:bg-danger/5 active:bg-danger/5 transition-colors"
      >
        <div className="w-9 h-9 rounded-xl bg-danger/10 flex items-center justify-center flex-shrink-0">
          <Trash2 className="w-4.5 h-4.5 text-danger" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-danger">Delete Account</p>
          <p className="text-xs text-foreground-muted mt-0.5">Permanently deactivate your account</p>
        </div>
        <ChevronRight className={`w-4 h-4 text-danger/60 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-danger/20 pt-4 space-y-3">
          <div className="bg-danger/5 border border-danger/20 rounded-xl p-3">
            <p className="text-xs text-danger font-medium mb-1">This action is irreversible</p>
            <p className="text-xs text-foreground-secondary leading-relaxed">
              Your account will be deactivated and your profile will no longer be visible to other users.
              All your posts, messages, and data will be removed.
            </p>
          </div>
          <p className="text-xs text-foreground-secondary">
            Type <span className="font-mono font-bold text-foreground">DELETE</span> to confirm:
          </p>
          <input
            type="text"
            placeholder="DELETE"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="form-input"
            autoComplete="off"
          />
          <button
            onClick={() => mutation.mutate()}
            disabled={confirm !== 'DELETE' || mutation.isPending}
            className="w-full h-11 bg-danger text-white text-sm font-semibold rounded-xl hover:opacity-90 active:opacity-90 disabled:opacity-40 transition-opacity"
          >
            {mutation.isPending ? 'Deleting…' : 'Delete My Account'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AccountSettingsPage() {
  const router = useRouter();
  const { data: me, isLoading } = useQuery({
    queryKey: queryKeys.me(),
    queryFn: getMe,
  });

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border flex-shrink-0 bg-surface">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-surface-alt transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground">Account Settings</h1>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex-1 px-4 py-6 space-y-4 max-w-lg mx-auto w-full">
          {/* Security section */}
          <div>
            <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wide px-1 mb-3">
              Security
            </p>
            <div className="space-y-3">
              <ChangePasswordSection />
              <TwoFASection twoFactorEnabled={me?.twoFactorEnabled ?? false} />
            </div>
          </div>

          {/* Danger zone */}
          <div>
            <p className="text-xs font-semibold text-danger/70 uppercase tracking-wide px-1 mb-3">
              Danger Zone
            </p>
            <DeleteAccountSection />
          </div>
        </div>
      )}
    </div>
  );
}
