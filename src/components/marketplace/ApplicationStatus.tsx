'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Clock, CheckCircle2, XCircle, ShieldCheck, ShieldOff,
  Send, ChevronDown, ChevronUp, FileText, MessageSquare, User, Loader2,
  Paperclip, X as XIcon, ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getMyApplication, getMySellerProfile, submitSellerAppeal,
  getMyAppeals, getAppealMessages, replyToAppeal,
} from '@/lib/api/marketplace';
import { useMarketplaceStore } from '@/store/marketplace.store';
import { SellerApplicationStatus, SellerStatus } from '@/types/enums';
import type { SellerAppeal, AppealMessage } from '@/types/models';

const APPEAL_REASONS = [
  { value: 'error',          label: 'This was done in error — I did not violate any policy' },
  { value: 'corrected',      label: 'I have corrected the issue that led to the suspension' },
  { value: 'misunderstanding', label: 'There was a misunderstanding about my listing or conduct' },
  { value: 'other',          label: 'Other reason' },
] as const;

type AppealReason = typeof APPEAL_REASONS[number]['value'];

// ── Relative time helper ──────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Message bubble ────────────────────────────────────────────────────────────

function AttachmentChip({
  url, name, isAdmin,
}: { url: string; name: string | null; isAdmin: boolean }) {
  const isImage = /\.(jpe?g|png|webp|gif)(\?|$)/i.test(url);
  return isImage ? (
    <a href={url} target="_blank" rel="noreferrer" className="block mt-1.5">
      <img
        src={url}
        alt={name ?? 'attachment'}
        className="max-w-[180px] rounded-xl border border-white/20 object-cover"
      />
    </a>
  ) : (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={`mt-1.5 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-opacity hover:opacity-80 ${
        isAdmin
          ? 'bg-white/10 border-white/30 text-white'
          : 'bg-surface border-border text-foreground'
      }`}
    >
      <FileText size={13} className="flex-shrink-0" />
      <span className="truncate max-w-[150px]">{name ?? 'Attachment'}</span>
      <ExternalLink size={11} className="flex-shrink-0 opacity-70" />
    </a>
  );
}

function MessageBubble({ msg }: { msg: AppealMessage }) {
  const isAdmin = msg.senderType === 'ADMIN';
  return (
    <div className={`flex gap-2 ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
        isAdmin ? 'bg-primary/10' : 'bg-muted'
      }`}>
        <User size={14} className={isAdmin ? 'text-primary' : 'text-muted-foreground'} />
      </div>

      <div className={`max-w-[78%] space-y-0.5 flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
        <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isAdmin
            ? 'bg-primary text-white rounded-tr-sm'
            : 'bg-muted/60 text-foreground rounded-tl-sm'
        }`}>
          {msg.content}
          {msg.attachmentUrl && (
            <AttachmentChip url={msg.attachmentUrl} name={msg.attachmentName} isAdmin={isAdmin} />
          )}
        </div>
        <div className={`flex items-center gap-1.5 ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
          {isAdmin && msg.admin && (
            <span className="text-[10px] text-muted-foreground">
              {msg.admin.firstName} · {msg.admin.department ?? 'Admin Team'}
            </span>
          )}
          <span className="text-[10px] text-muted-foreground">{relativeTime(msg.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Appeal thread (inline) ────────────────────────────────────────────────────

function AppealThreadInline({
  appeal,
  onCollapse,
}: {
  appeal: SellerAppeal;
  onCollapse?: () => void;
}) {
  const qc = useQueryClient();
  const [replyMsg, setReplyMsg]           = useState('');
  const [attachment, setAttachment]       = useState<File | null>(null);
  const [attachPreview, setAttachPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isPending = appeal.status === 'PENDING';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    setAttachment(file);
    if (file.type.startsWith('image/')) {
      setAttachPreview(URL.createObjectURL(file));
    } else {
      setAttachPreview(null);
    }
    // reset so same file can be re-selected
    e.target.value = '';
  };

  const clearAttachment = () => {
    setAttachment(null);
    setAttachPreview(null);
  };

  // Poll for new messages using dedicated endpoint
  const { data: messages = [], isLoading } = useQuery<AppealMessage[]>({
    queryKey: ['marketplace', 'appeal-messages', appeal.id],
    queryFn: () => getAppealMessages(appeal.id),
    initialData: appeal.messages ?? [],
    refetchInterval: isPending ? 15_000 : false,
    staleTime: 0,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const replyMutation = useMutation({
    mutationFn: ({ content, file }: { content: string; file: File | null }) =>
      replyToAppeal(appeal.id, content, file ?? undefined),
    onSuccess: () => {
      setReplyMsg('');
      clearAttachment();
      qc.invalidateQueries({ queryKey: ['marketplace', 'appeal-messages', appeal.id] });
      qc.invalidateQueries({ queryKey: ['marketplace', 'my-appeals'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to send message'),
  });

  const handleSend = () => {
    if (!replyMsg.trim() && !attachment) return;
    replyMutation.mutate({ content: replyMsg.trim() || '(see attachment)', file: attachment });
  };

  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-surface text-left">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div>
          <p className="text-sm font-semibold text-foreground">Appeal Thread</p>
          <p className="text-xs text-muted-foreground">
            {new Date(appeal.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
            &nbsp;·&nbsp;
            <span className={`font-medium ${
              appeal.status === 'PENDING' ? 'text-amber-600' :
              appeal.status === 'ACCEPTED' ? 'text-emerald-600' : 'text-red-600'
            }`}>{appeal.status}</span>
          </p>
        </div>
        {onCollapse && (
          <button
            onClick={onCollapse}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-surface-alt"
          >
            <ChevronUp size={16} />
          </button>
        )}
      </div>

      {/* Original appeal */}
      <div className="px-4 py-3 bg-amber-50 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-900/30">
        <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Your original appeal:</p>
        <p className="text-sm text-amber-900 dark:text-amber-200 whitespace-pre-wrap leading-relaxed">
          {appeal.message}
        </p>
      </div>

      {/* Messages */}
      <div className="px-4 py-4 space-y-3 max-h-72 overflow-y-auto">
        {isLoading && messages.length === 0 && (
          <div className="flex justify-center py-4">
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
          </div>
        )}
        {messages.length === 0 && !isLoading && (
          <p className="text-xs text-muted-foreground text-center py-2">
            No messages yet. Our team will respond shortly.
          </p>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Reply input — only for pending appeals */}
      {isPending && (
        <div className="px-4 py-3 border-t border-border space-y-2">
          {/* Attachment preview */}
          {attachment && (
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/40 rounded-xl border border-border">
              {attachPreview ? (
                <img src={attachPreview} alt="preview" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{attachment.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {(attachment.size / 1024).toFixed(0)} KB
                </p>
              </div>
              <button onClick={clearAttachment} className="p-1 rounded-full hover:bg-muted text-muted-foreground">
                <XIcon size={14} />
              </button>
            </div>
          )}

          <div className="flex gap-2 items-end">
            {/* Attach file button */}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="p-2.5 rounded-xl border border-border text-muted-foreground hover:bg-surface-alt hover:text-primary transition-colors flex-shrink-0"
              title="Attach document or image"
            >
              <Paperclip size={16} />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              className="hidden"
              onChange={handleFileChange}
            />

            <textarea
              value={replyMsg}
              onChange={(e) => setReplyMsg(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              rows={2}
              placeholder="Reply to the admin… attach a document if requested"
              className="flex-1 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none bg-surface"
            />
            <button
              onClick={handleSend}
              disabled={replyMutation.isPending || (!replyMsg.trim() && !attachment)}
              className="p-2.5 rounded-xl bg-primary text-white disabled:opacity-50 flex-shrink-0"
            >
              {replyMutation.isPending
                ? <Loader2 size={16} className="animate-spin" />
                : <Send size={16} />}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground px-1">
            Accepts images, PDF, DOC, DOCX — max 10 MB
          </p>
        </div>
      )}

      {/* Final response banner for closed appeals */}
      {!isPending && appeal.adminResponse && (
        <div className={`px-4 py-3 border-t ${
          appeal.status === 'ACCEPTED'
            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30'
            : 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30'
        }`}>
          <p className={`text-xs font-semibold mb-1 ${
            appeal.status === 'ACCEPTED' ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'
          }`}>
            {appeal.status === 'ACCEPTED' ? 'Appeal Accepted' : 'Appeal Rejected'} — Admin Decision:
          </p>
          <p className="text-sm text-foreground">{appeal.adminResponse}</p>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ApplicationStatus() {
  const { goBack, setView } = useMarketplaceStore();
  const qc = useQueryClient();

  const [showAppealForm, setShowAppealForm]   = useState(false);
  const [showPastAppeals, setShowPastAppeals] = useState(false);
  const [expandedAppealId, setExpandedAppealId] = useState<string | null>(null);

  const [appealReason, setAppealReason]         = useState<AppealReason | ''>('');
  const [appealExplanation, setAppealExplanation] = useState('');
  const [appealSteps, setAppealSteps]           = useState('');

  const { data: application, isLoading } = useQuery({
    queryKey: ['marketplace', 'my-application'],
    queryFn: getMyApplication,
  });

  const { data: sellerProfile } = useQuery({
    queryKey: ['marketplace', 'my-seller-profile'],
    queryFn: getMySellerProfile,
    enabled: application?.status === SellerApplicationStatus.APPROVED,
  });

  const isDeactivated = application?.status === SellerApplicationStatus.APPROVED
    && sellerProfile?.sellerStatus === SellerStatus.DEACTIVATED;

  const { data: appeals } = useQuery({
    queryKey: ['marketplace', 'my-appeals'],
    queryFn: getMyAppeals,
    enabled: isDeactivated,
    refetchInterval: isDeactivated ? 30_000 : false,
  });

  const appealMutation = useMutation({
    mutationFn: submitSellerAppeal,
    onSuccess: () => {
      toast.success('Appeal submitted. We will review it shortly.');
      setAppealReason('');
      setAppealExplanation('');
      setAppealSteps('');
      setShowAppealForm(false);
      qc.invalidateQueries({ queryKey: ['marketplace', 'my-appeals'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to submit appeal'),
  });

  const pendingAppeal = appeals?.find((a) => a.status === 'PENDING') ?? null;
  const closedAppeals = appeals?.filter((a) => a.status !== 'PENDING') ?? [];

  function buildAppealMessage() {
    const reasonLabel = APPEAL_REASONS.find((r) => r.value === appealReason)?.label ?? '';
    let msg = `Reason: ${reasonLabel}\n\nExplanation:\n${appealExplanation.trim()}`;
    if (appealSteps.trim()) msg += `\n\nSteps taken / Evidence:\n${appealSteps.trim()}`;
    return msg;
  }

  const canSubmitAppeal =
    appealReason !== '' &&
    appealExplanation.trim().length >= 20 &&
    !appealMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-full">
        <div className="sticky top-0 z-10 bg-surface border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={goBack}><ArrowLeft size={22} /></button>
          <h1 className="font-bold text-foreground text-lg">Seller Application</h1>
        </div>
        <div className="flex flex-col items-center justify-center flex-1 gap-3">
          <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
          <div className="h-4 bg-muted rounded w-48 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="flex flex-col min-h-full">
        <div className="sticky top-0 z-10 bg-surface border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={goBack}><ArrowLeft size={22} /></button>
          <h1 className="font-bold text-foreground text-lg">Seller Application</h1>
        </div>
        <div className="flex flex-col items-center justify-center flex-1 px-6 text-center gap-4">
          <ShieldCheck size={52} className="text-muted-foreground/30" />
          <div>
            <p className="font-semibold text-foreground">No application found</p>
            <p className="text-sm text-muted-foreground mt-1">Apply to become a verified seller in Mami Market.</p>
          </div>
          <button
            onClick={() => setView('seller-apply')}
            className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Apply Now
          </button>
        </div>
      </div>
    );
  }

  const isPending  = application.status === SellerApplicationStatus.PENDING;
  const isApproved = application.status === SellerApplicationStatus.APPROVED;
  const isRejected = application.status === SellerApplicationStatus.REJECTED;

  return (
    <div className="flex flex-col min-h-full">
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={goBack} className="text-foreground hover:text-primary">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-bold text-foreground text-lg flex-1">Seller Application</h1>
      </div>

      <div className="flex flex-col items-center flex-1 px-6 py-10 text-center gap-5">
        {/* Status icon */}
        <div className={[
          'w-20 h-20 rounded-full flex items-center justify-center',
          isPending                     ? 'bg-amber-100  dark:bg-amber-900/30'   : '',
          isDeactivated                 ? 'bg-red-100    dark:bg-red-900/30'     : '',
          isApproved && !isDeactivated  ? 'bg-emerald-100 dark:bg-emerald-900/30' : '',
          isRejected                    ? 'bg-red-100    dark:bg-red-900/30'     : '',
        ].join(' ')}>
          {isPending                    && <Clock        size={40} className="text-amber-500" />}
          {isDeactivated                && <ShieldOff    size={40} className="text-red-500" />}
          {isApproved && !isDeactivated && <CheckCircle2 size={40} className="text-emerald-500" />}
          {isRejected                   && <XCircle      size={40} className="text-red-500" />}
        </div>

        {/* Status text */}
        {isPending && (
          <div>
            <p className="text-xl font-bold text-foreground">Under Review</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-[280px]">
              Your application is being reviewed. We'll notify you within 24–48 hours.
            </p>
          </div>
        )}

        {isApproved && !isDeactivated && (
          <div>
            <p className="text-xl font-bold text-foreground">Application Approved!</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-[280px]">
              Congratulations! You're now a verified seller on Mami Market.
            </p>
          </div>
        )}

        {isDeactivated && (
          <div className="w-full max-w-xs">
            <p className="text-xl font-bold text-red-600 dark:text-red-400">Account Suspended</p>
            <p className="text-sm text-muted-foreground mt-2">
              Your Mami Market seller account has been temporarily suspended. You cannot create listings or sell until your account is reinstated.
            </p>
            {sellerProfile?.deactivationReason && (
              <div className="mt-3 px-4 py-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-left">
                <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">Reason:</p>
                <p className="text-sm text-red-700 dark:text-red-300">{sellerProfile.deactivationReason}</p>
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-3">
              You can still browse and buy items. To restore your selling access, submit an appeal below.
            </p>
          </div>
        )}

        {isRejected && (
          <div>
            <p className="text-xl font-bold text-foreground">Application Rejected</p>
            {application.reviewNote && (
              <p className="text-sm text-muted-foreground mt-2 max-w-[280px]">
                Reason: {application.reviewNote}
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-1 max-w-[280px]">
              You may reapply with a clearer document.
            </p>
          </div>
        )}

        {/* Metadata */}
        <div className="w-full max-w-xs rounded-xl border border-border bg-muted/30 p-4 text-left space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Submitted</span>
            <span className="font-medium text-foreground">
              {new Date(application.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
          {application.reviewedAt && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Reviewed</span>
              <span className="font-medium text-foreground">
                {new Date(application.reviewedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <span className={[
              'font-semibold',
              isPending                    ? 'text-amber-500'   : '',
              isDeactivated                ? 'text-red-500'     : '',
              isApproved && !isDeactivated ? 'text-emerald-500' : '',
              isRejected                   ? 'text-red-500'     : '',
            ].join(' ')}>
              {isDeactivated ? 'SUSPENDED' : application.status}
            </span>
          </div>
        </div>

        {/* ── Appeal section (deactivated sellers) ── */}
        {isDeactivated && (
          <div className="w-full max-w-xs space-y-4">

            {/* Active pending appeal — show thread */}
            {pendingAppeal && (
              <AppealThreadInline appeal={pendingAppeal} />
            )}

            {/* No pending appeal — show submit form or button */}
            {!pendingAppeal && (
              <>
                {!showAppealForm ? (
                  <button
                    onClick={() => setShowAppealForm(true)}
                    className="w-full py-2.5 rounded-full border-2 border-primary text-primary text-sm font-semibold hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
                  >
                    <FileText size={15} /> Submit an Appeal
                  </button>
                ) : (
                  <div className="text-left space-y-4 border border-border rounded-2xl p-4 bg-surface">
                    <div>
                      <p className="text-sm font-bold text-foreground">Appeal Form</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Fill in the form below. Our team will review and respond within 24–48 hours.
                      </p>
                    </div>

                    {/* Reason select */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Reason for appeal <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={appealReason}
                        onChange={(e) => setAppealReason(e.target.value as AppealReason)}
                        className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-surface text-foreground"
                      >
                        <option value="" disabled>Select a reason…</option>
                        {APPEAL_REASONS.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Explanation */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Your explanation <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={appealExplanation}
                        onChange={(e) => setAppealExplanation(e.target.value)}
                        rows={4}
                        placeholder="Clearly explain why you believe your account should be reinstated. Be honest and specific."
                        className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none bg-surface"
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {appealExplanation.trim().length}/20 min
                      </p>
                    </div>

                    {/* Steps taken (optional) */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Steps taken or supporting evidence <span className="text-muted-foreground font-normal">(optional)</span>
                      </label>
                      <textarea
                        value={appealSteps}
                        onChange={(e) => setAppealSteps(e.target.value)}
                        rows={3}
                        placeholder="e.g. 'I have removed the listing in question', 'I have read the community guidelines'…"
                        className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none bg-surface"
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => {
                          setShowAppealForm(false);
                          setAppealReason('');
                          setAppealExplanation('');
                          setAppealSteps('');
                        }}
                        className="flex-1 py-2 rounded-full border border-border text-sm font-medium text-muted-foreground hover:bg-surface-alt"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => { if (canSubmitAppeal) appealMutation.mutate(buildAppealMessage()); }}
                        disabled={!canSubmitAppeal}
                        className="flex-1 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        {appealMutation.isPending ? 'Sending…' : <><Send size={14} /> Submit Appeal</>}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Past (closed) appeals accordion */}
            {closedAppeals.length > 0 && (
              <div className="border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowPastAppeals((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-surface-alt"
                >
                  <span className="flex items-center gap-2">
                    <MessageSquare size={15} />
                    Past Appeals ({closedAppeals.length})
                  </span>
                  {showPastAppeals ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showPastAppeals && (
                  <div className="divide-y divide-border px-4 py-3 space-y-4">
                    {closedAppeals.map((appeal) => (
                      <div key={appeal.id} className="pt-3 first:pt-0">
                        {expandedAppealId === appeal.id ? (
                          <AppealThreadInline
                            appeal={appeal}
                            onCollapse={() => setExpandedAppealId(null)}
                          />
                        ) : (
                          <button
                            onClick={() => setExpandedAppealId(appeal.id)}
                            className="w-full text-left space-y-2 hover:opacity-80 transition-opacity"
                          >
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                appeal.status === 'ACCEPTED'
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              }`}>
                                {appeal.status}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(appeal.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">{appeal.message}</p>
                            <p className="text-xs text-primary font-medium">View thread →</p>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Action buttons ── */}
        {isRejected && (
          <button
            onClick={() => setView('seller-apply')}
            className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Reapply
          </button>
        )}

        {isApproved && !isDeactivated && (
          <button
            onClick={() => setView('create')}
            className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Create a listing
          </button>
        )}
      </div>
    </div>
  );
}
