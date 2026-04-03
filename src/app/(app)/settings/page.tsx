'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  Lock, Shield, Trash2, ChevronRight, Eye, EyeOff, ArrowLeft,
  MonitorSmartphone, LogOut, Bell, Palette, UserX, Smartphone, Globe,
} from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  changePassword, initiate2FA, confirm2FA, disable2FA,
  getSessions, revokeSession, revokeAllSessions, logout,
} from '@/lib/api/auth';
import { deleteAccount, getBlockedUsers, unblockUser, initiateEmailChange, verifyEmailChange } from '@/lib/api/users';
import { getMe } from '@/lib/api/users';
import { useAuthStore } from '@/store/auth.store';
import { queryKeys } from '@/lib/query-keys';
import { getInitials } from '@/lib/utils';
import type { Session } from '@/types/models';

// ── Notification preference keys & labels ─────────────────────────────────────

const NOTIF_PREFS_KEY = 'cc_notif_prefs';

const NOTIF_TYPES = [
  { key: 'FOLLOW', label: 'New follower', description: 'When someone follows you' },
  { key: 'POST_LIKE', label: 'Post likes', description: 'When someone likes your post' },
  { key: 'POST_COMMENT', label: 'Post comments', description: 'When someone comments on your post' },
  { key: 'MENTION', label: 'Mentions', description: 'When someone mentions you' },
  { key: 'DM_RECEIVED', label: 'Direct messages', description: 'When you receive a DM' },
  { key: 'MARKET_INQUIRY', label: 'Market inquiries', description: 'When someone messages about your listing' },
] as const;

type NotifKey = (typeof NOTIF_TYPES)[number]['key'];
type NotifPrefs = Record<NotifKey, boolean>;

function loadNotifPrefs(): NotifPrefs {
  try {
    const raw = localStorage.getItem(NOTIF_PREFS_KEY);
    if (raw) return { ...defaultNotifPrefs(), ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return defaultNotifPrefs();
}

function defaultNotifPrefs(): NotifPrefs {
  return Object.fromEntries(NOTIF_TYPES.map((t) => [t.key, true])) as NotifPrefs;
}

function saveNotifPrefs(prefs: NotifPrefs) {
  try {
    localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(prefs));
  } catch { /* ignore */ }
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function SectionLabel({ children, danger }: { children: React.ReactNode; danger?: boolean }) {
  return (
    <p className={`text-xs font-semibold uppercase tracking-wide px-1 mb-3 ${danger ? 'text-danger/70' : 'text-foreground-muted'}`}>
      {children}
    </p>
  );
}

function ToggleSwitch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-primary' : 'bg-border'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  );
}

// ── Change Password ────────────────────────────────────────────────────────────

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
    onError: (err: Error) => {
      toast.error(err.message ?? 'Failed to change password');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw.length < 8) return toast.error('Password must be at least 8 characters');
    if (!/[A-Z]/.test(newPw)) return toast.error('Password must contain an uppercase letter');
    if (!/\d/.test(newPw)) return toast.error('Password must contain a number');
    if (newPw !== confirmPw) return toast.error('Passwords do not match');
    mutation.mutate();
  };

  return (
    <div data-testid="change-password-section" className="bg-surface border border-border rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-4 hover:bg-surface-alt transition-colors"
      >
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Lock className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-foreground">Change Password</p>
          <p className="text-xs text-foreground-muted mt-0.5">Update your account password</p>
        </div>
        <ChevronRight className={`w-4 h-4 text-foreground-muted transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="px-4 pb-4 pt-4 space-y-3 border-t border-border">
          {/* Current password */}
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

          {/* New password */}
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              placeholder="New password (min 8 chars, 1 upper, 1 digit)"
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
            className="w-full h-11 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {mutation.isPending ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      )}
    </div>
  );
}

// ── Change Email ───────────────────────────────────────────────────────────────

function ChangeEmailSection() {
  const [open, setOpen] = useState(false);
  // step: 'form' → user enters new email + current password
  //       'otp'  → user enters OTP sent to new email
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [newEmail, setNewEmail] = useState('');
  const [currentPw, setCurrentPw] = useState('');
  const [otp, setOtp] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const { clearAuth } = useAuthStore();
  const router = useRouter();

  const initiateMutation = useMutation({
    mutationFn: () => initiateEmailChange(newEmail, currentPw),
    onSuccess: (data) => {
      setMaskedEmail(data.maskedEmail);
      setStep('otp');
      toast.success('Verification code sent');
    },
    onError: (err: Error) => toast.error(err.message ?? 'Failed to send code'),
  });

  const verifyMutation = useMutation({
    mutationFn: () => verifyEmailChange(otp),
    onSuccess: () => {
      toast.success('Email updated — please log in again');
      clearAuth();
      router.replace('/login');
    },
    onError: (err: Error) => toast.error(err.message ?? 'Invalid code'),
  });

  const handleClose = () => {
    setOpen(false);
    setStep('form');
    setNewEmail(''); setCurrentPw(''); setOtp('');
  };

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <button
        onClick={() => { if (open) handleClose(); else setOpen(true); }}
        className="w-full flex items-center gap-3 px-4 py-4 hover:bg-surface-alt transition-colors"
      >
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Globe className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-foreground">Change Email</p>
          <p className="text-xs text-foreground-muted mt-0.5">Update your account email address</p>
        </div>
        <ChevronRight className={`w-4 h-4 text-foreground-muted transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && step === 'form' && (
        <form
          onSubmit={(e) => { e.preventDefault(); initiateMutation.mutate(); }}
          className="px-4 pb-4 pt-4 space-y-3 border-t border-border"
        >
          <input
            type="email"
            placeholder="New email address"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
            autoComplete="email"
            className="form-input"
          />
          <input
            type="password"
            placeholder="Current password"
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
            required
            autoComplete="current-password"
            className="form-input"
          />
          <button
            type="submit"
            disabled={initiateMutation.isPending}
            className="w-full h-11 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {initiateMutation.isPending ? 'Sending code…' : 'Send Verification Code'}
          </button>
        </form>
      )}

      {open && step === 'otp' && (
        <form
          onSubmit={(e) => { e.preventDefault(); verifyMutation.mutate(); }}
          className="px-4 pb-4 pt-4 space-y-3 border-t border-border"
        >
          <p className="text-xs text-foreground-muted">
            Enter the 6-digit code sent to <span className="font-medium text-foreground">{maskedEmail}</span>
          </p>
          <input
            type="text"
            inputMode="numeric"
            placeholder="6-digit code"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            required
            className="form-input text-center tracking-widest text-lg"
          />
          <button
            type="submit"
            disabled={verifyMutation.isPending || otp.length < 6}
            className="w-full h-11 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {verifyMutation.isPending ? 'Verifying…' : 'Verify & Update Email'}
          </button>
          <button
            type="button"
            onClick={() => setStep('form')}
            className="w-full text-xs text-foreground-muted underline"
          >
            Use a different email
          </button>
        </form>
      )}
    </div>
  );
}

// ── Two-Factor Authentication ──────────────────────────────────────────────────

function TwoFASection({ twoFactorEnabled }: { twoFactorEnabled: boolean }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [phase, setPhase] = useState<'idle' | 'setup' | 'disable'>('idle');
  const [showSecret, setShowSecret] = useState(false);

  const initMutation = useMutation({
    mutationFn: initiate2FA,
    onSuccess: (data) => {
      setQrUrl(data.qrCodeUrl);
      setSecret(data.secret ?? null);
      setPhase('setup');
    },
    onError: (err: Error) => toast.error(err.message ?? 'Failed to initiate 2FA setup'),
  });

  const confirmMutation = useMutation({
    mutationFn: () => confirm2FA(totpCode),
    onSuccess: () => {
      toast.success('2FA enabled successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.me() });
      setPhase('idle');
      setTotpCode('');
      setSecret(null);
      setQrUrl(null);
      setOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Invalid code. Try again.');
    },
  });

  const disableMutation = useMutation({
    mutationFn: () => disable2FA(disableCode),
    onSuccess: () => {
      toast.success('2FA disabled');
      queryClient.invalidateQueries({ queryKey: queryKeys.me() });
      setPhase('idle');
      setDisableCode('');
      setOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Invalid code. Try again.');
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
    <div data-testid="twofa-section" className="bg-surface border border-border rounded-2xl overflow-hidden">
      <button
        onClick={handleToggle}
        className="w-full flex items-center gap-3 px-4 py-4 hover:bg-surface-alt transition-colors"
      >
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Shield className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-foreground">Two-Factor Authentication</p>
          <p className="text-xs mt-0.5">
            <span className={twoFactorEnabled ? 'text-success font-medium' : 'text-foreground-muted'}>
              {twoFactorEnabled ? 'Enabled' : 'Not enabled'}
            </span>
          </p>
        </div>
        <ChevronRight className={`w-4 h-4 text-foreground-muted transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <div className="px-4 pb-4 pt-4 border-t border-border space-y-3">
          {/* Setup flow */}
          {phase === 'setup' && !twoFactorEnabled && (
            <>
              <p className="text-xs text-foreground-secondary leading-relaxed">
                Scan this QR code with Google Authenticator, Authy, or any TOTP app, then enter the 6-digit code to activate.
              </p>
              {initMutation.isPending && (
                <div className="flex justify-center py-6">
                  <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              )}
              {qrUrl && (
                <div className="space-y-3">
                  <div className="flex justify-center py-2">
                    {/* Use plain img — next/image blocks data: URLs and unknown QR hosts */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrUrl}
                      alt="2FA QR code"
                      width={180}
                      height={180}
                      className="rounded-xl border border-border"
                    />
                  </div>
                  {secret && (
                    <div className="bg-surface-alt border border-border rounded-xl p-3 space-y-1">
                      <p className="text-xs text-foreground-muted font-medium">
                        Can&apos;t scan? Enter this key manually:
                      </p>
                      <div className="flex items-center gap-2">
                        <p className={`font-mono text-sm font-bold tracking-wider flex-1 select-all break-all ${showSecret ? 'text-foreground' : 'blur-sm select-none'}`}>
                          {secret}
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowSecret((v) => !v)}
                          className="text-xs text-primary flex-shrink-0"
                        >
                          {showSecret ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <input
                type="text"
                inputMode="numeric"
                placeholder="Enter 6-digit code"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="form-input text-center tracking-widest font-mono"
              />
              <button
                onClick={() => confirmMutation.mutate()}
                disabled={totpCode.length !== 6 || confirmMutation.isPending || initMutation.isPending}
                className="w-full h-11 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {confirmMutation.isPending ? 'Verifying…' : 'Enable 2FA'}
              </button>
            </>
          )}

          {/* Disable flow */}
          {phase === 'disable' && twoFactorEnabled && (
            <>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-xl p-3">
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                  Disabling 2FA reduces your account security. Enter your authenticator code to confirm.
                </p>
              </div>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Enter 6-digit code"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="form-input text-center tracking-widest font-mono"
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

// ── Active Sessions ────────────────────────────────────────────────────────────

function SessionsSection() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: sessions, isLoading } = useQuery({
    queryKey: queryKeys.sessions(),
    queryFn: getSessions,
    enabled: open,
    staleTime: 30_000,
  });

  const revokeMutation = useMutation({
    mutationFn: (sessionId: string) => revokeSession(sessionId),
    onSuccess: () => {
      toast.success('Session revoked');
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions() });
    },
    onError: () => toast.error('Failed to revoke session'),
  });

  const revokeAllMutation = useMutation({
    mutationFn: revokeAllSessions,
    onSuccess: () => {
      toast.success('All other sessions revoked');
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions() });
    },
    onError: () => toast.error('Failed to revoke sessions'),
  });

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

  const otherSessions = sessions?.filter((s) => !s.isCurrent) ?? [];

  return (
    <div data-testid="sessions-section" className="bg-surface border border-border rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-4 hover:bg-surface-alt transition-colors"
      >
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <MonitorSmartphone className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-foreground">Active Sessions</p>
          <p className="text-xs text-foreground-muted mt-0.5">Manage devices where you're logged in</p>
        </div>
        <ChevronRight className={`w-4 h-4 text-foreground-muted transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <div className="px-4 pb-4 pt-4 border-t border-border space-y-3">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-14 bg-surface-alt rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !sessions?.length ? (
            <p className="text-xs text-foreground-muted text-center py-4">No sessions found</p>
          ) : (
            <div className="space-y-2">
              {sessions.map((session: Session) => (
                <div
                  key={session.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border ${session.isCurrent ? 'border-primary/30 bg-primary/5' : 'border-border bg-surface-alt'}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center flex-shrink-0 mt-0.5">
                    {session.deviceInfo?.toLowerCase().includes('mobile') ? (
                      <Smartphone className="w-4 h-4 text-foreground-muted" />
                    ) : (
                      <Globe className="w-4 h-4 text-foreground-muted" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-foreground truncate">
                        {session.deviceInfo ?? 'Unknown device'}
                      </p>
                      {session.isCurrent && (
                        <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                          This device
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-foreground-muted mt-0.5">
                      {session.ipAddress ? `${session.ipAddress} · ` : ''}
                      Active since {formatDate(session.createdAt)}
                    </p>
                  </div>
                  {!session.isCurrent && (
                    <button
                      onClick={() => revokeMutation.mutate(session.id)}
                      disabled={revokeMutation.isPending}
                      className="text-[11px] font-semibold text-danger hover:underline flex-shrink-0 disabled:opacity-50"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {otherSessions.length > 1 && (
            <button
              onClick={() => revokeAllMutation.mutate()}
              disabled={revokeAllMutation.isPending}
              className="w-full h-10 border border-danger/40 text-danger text-sm font-semibold rounded-xl hover:bg-danger/5 disabled:opacity-50 transition-colors"
            >
              {revokeAllMutation.isPending ? 'Revoking…' : 'Revoke All Other Sessions'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Block List ─────────────────────────────────────────────────────────────────

function BlockListSection() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: blocked, isLoading } = useQuery({
    queryKey: queryKeys.blockedUsers(),
    queryFn: getBlockedUsers,
    enabled: open,
    staleTime: 60_000,
  });

  const unblockMutation = useMutation({
    mutationFn: (userId: string) => unblockUser(userId),
    onSuccess: () => {
      toast.success('User unblocked');
      queryClient.invalidateQueries({ queryKey: queryKeys.blockedUsers() });
    },
    onError: () => toast.error('Failed to unblock user'),
  });

  return (
    <div data-testid="block-list-section" className="bg-surface border border-border rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-4 hover:bg-surface-alt transition-colors"
      >
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <UserX className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-foreground">Blocked Users</p>
          <p className="text-xs text-foreground-muted mt-0.5">Manage users you've blocked</p>
        </div>
        <ChevronRight className={`w-4 h-4 text-foreground-muted transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <div className="px-4 pb-4 pt-4 border-t border-border">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-12 bg-surface-alt rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !blocked?.length ? (
            <p className="text-xs text-foreground-muted text-center py-4">You haven't blocked anyone</p>
          ) : (
            <div className="space-y-2">
              {blocked.map((user) => {
                const initials = getInitials(user.firstName, user.lastName);
                return (
                  <div key={user.id} className="flex items-center gap-3 py-2">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {user.profilePicture ? (
                        <Image
                          src={user.profilePicture}
                          alt={initials}
                          width={36}
                          height={36}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <span className="text-xs font-bold text-primary uppercase">{initials}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-foreground-muted truncate">{user.servingState}</p>
                    </div>
                    <button
                      onClick={() => unblockMutation.mutate(user.id)}
                      disabled={unblockMutation.isPending}
                      className="text-xs font-semibold text-primary border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-primary/5 disabled:opacity-50 transition-colors"
                    >
                      Unblock
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Notification Preferences ──────────────────────────────────────────────────

function NotificationPrefsSection() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<NotifPrefs>(defaultNotifPrefs);

  useEffect(() => {
    if (open) setPrefs(loadNotifPrefs());
  }, [open]);

  const handleChange = (key: NotifKey, value: boolean) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    saveNotifPrefs(updated);
  };

  return (
    <div data-testid="notif-prefs-section" className="bg-surface border border-border rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-4 hover:bg-surface-alt transition-colors"
      >
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Bell className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-foreground">Notification Preferences</p>
          <p className="text-xs text-foreground-muted mt-0.5">Choose what alerts you receive</p>
        </div>
        <ChevronRight className={`w-4 h-4 text-foreground-muted transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <div className="px-4 pb-4 pt-4 border-t border-border space-y-0 divide-y divide-border/50">
          {NOTIF_TYPES.map((type) => (
            <div key={type.key} className="flex items-center gap-3 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{type.label}</p>
                <p className="text-xs text-foreground-muted mt-0.5">{type.description}</p>
              </div>
              <ToggleSwitch
                checked={prefs[type.key]}
                onChange={(v) => handleChange(type.key, v)}
                label={`Toggle ${type.label}`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Appearance ────────────────────────────────────────────────────────────────

function AppearanceSection() {
  const { theme, setTheme } = useTheme();

  const options: { value: string; label: string }[] = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
  ];

  return (
    <div data-testid="appearance-section" className="bg-surface border border-border rounded-2xl p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Palette className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Appearance</p>
          <p className="text-xs text-foreground-muted mt-0.5">Choose your preferred theme</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
              theme === opt.value
                ? 'bg-primary text-white border-primary'
                : 'bg-surface-alt text-foreground border-border hover:border-primary/40'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Delete Account ─────────────────────────────────────────────────────────────

function DeleteAccountSection() {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      toast.success('Account deleted');
      clearAuth();
      router.replace('/login');
    },
    onError: () => toast.error('Failed to delete account. Please try again.'),
  });

  return (
    <div data-testid="delete-account-section" className="bg-surface border border-danger/30 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-4 hover:bg-danger/5 transition-colors"
      >
        <div className="w-9 h-9 rounded-xl bg-danger/10 flex items-center justify-center flex-shrink-0">
          <Trash2 className="w-4 h-4 text-danger" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-danger">Delete Account</p>
          <p className="text-xs text-foreground-muted mt-0.5">Permanently deactivate your account</p>
        </div>
        <ChevronRight className={`w-4 h-4 text-danger/60 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <div className="px-4 pb-4 pt-4 border-t border-danger/20 space-y-3">
          <div className="bg-danger/5 border border-danger/20 rounded-xl p-3">
            <p className="text-xs text-danger font-semibold mb-1">This action is irreversible</p>
            <p className="text-xs text-foreground-secondary leading-relaxed">
              Your profile, posts, messages, and all data will be permanently removed. This cannot be undone.
            </p>
          </div>
          <p className="text-xs text-foreground-secondary">
            Type <span className="font-mono font-bold text-foreground">DELETE</span> to confirm:
          </p>
          <input
            type="text"
            placeholder="DELETE"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="form-input"
            autoComplete="off"
          />
          <button
            onClick={() => mutation.mutate()}
            disabled={confirmText !== 'DELETE' || mutation.isPending}
            className="w-full h-11 bg-danger text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            {mutation.isPending ? 'Deleting…' : 'Delete My Account'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Logout Button ─────────────────────────────────────────────────────────────

function LogoutButton() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      clearAuth();
      router.replace('/login');
    },
    onError: () => {
      // Even if server logout fails, clear local auth state
      clearAuth();
      router.replace('/login');
    },
  });

  return (
    <button
      data-testid="logout-button"
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      className="w-full flex items-center gap-3 px-4 py-4 bg-surface border border-border rounded-2xl hover:bg-danger/5 transition-colors disabled:opacity-50"
    >
      <div className="w-9 h-9 rounded-xl bg-danger/10 flex items-center justify-center flex-shrink-0">
        <LogOut className="w-4 h-4 text-danger" />
      </div>
      <span className="text-sm font-medium text-danger">
        {mutation.isPending ? 'Signing out…' : 'Sign Out'}
      </span>
    </button>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AccountSettingsPage() {
  const router = useRouter();
  const { data: me, isLoading } = useQuery({
    queryKey: queryKeys.me(),
    queryFn: getMe,
    staleTime: 30_000,
  });

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border flex-shrink-0 bg-surface sticky top-0 z-10">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-surface-alt transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground">Settings</h1>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex-1 px-4 py-6 space-y-6 max-w-lg mx-auto w-full">

          {/* ── Security ── */}
          <div>
            <SectionLabel>Security</SectionLabel>
            <div className="space-y-3">
              <ChangePasswordSection />
              <ChangeEmailSection />
              <TwoFASection twoFactorEnabled={me?.twoFactorEnabled ?? false} />
              <SessionsSection />
            </div>
          </div>

          {/* ── Privacy ── */}
          <div>
            <SectionLabel>Privacy</SectionLabel>
            <BlockListSection />
          </div>

          {/* ── Notifications ── */}
          <div>
            <SectionLabel>Notifications</SectionLabel>
            <NotificationPrefsSection />
          </div>

          {/* ── Appearance ── */}
          <div>
            <SectionLabel>Appearance</SectionLabel>
            <AppearanceSection />
          </div>

          {/* ── Account ── */}
          <div>
            <SectionLabel>Account</SectionLabel>
            <div className="space-y-3">
              <LogoutButton />
            </div>
          </div>

          {/* ── Danger Zone ── */}
          <div>
            <SectionLabel danger>Danger Zone</SectionLabel>
            <DeleteAccountSection />
          </div>

        </div>
      )}
    </div>
  );
}
