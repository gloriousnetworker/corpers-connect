'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { reportPost } from '@/lib/api/posts';

interface ReportModalProps {
  postId: string;
  open: boolean;
  onClose: () => void;
}

const REPORT_REASONS = [
  'Spam or misleading',
  'Harassment or bullying',
  'Hate speech or discrimination',
  'Violence or dangerous content',
  'Nudity or sexual content',
  'Misinformation',
  'Other',
];

export default function ReportModal({ postId, open, onClose }: ReportModalProps) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');

  const mutation = useMutation({
    mutationFn: () => reportPost(postId, { reason, details: details.trim() || undefined }),
    onSuccess: () => {
      toast.success('Report submitted. Thank you!');
      onClose();
      setReason('');
      setDetails('');
    },
    onError: () => toast.error('Failed to submit report'),
  });

  return (
    <AnimatePresence>
      {open && (
        /*
         * Single overlay handles backdrop + centering via flexbox.
         * Avoids the Framer Motion CSS-transform conflict that occurs when combining
         * Tailwind's `top-1/2 -translate-y-1/2` (CSS transform) with Framer Motion
         * animations (which overwrite the transform property entirely).
         */
        <motion.div
          key="report-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            key="report-modal"
            initial={{ scale: 0.97, y: 10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.97, y: 10, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-sm bg-surface rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: 'calc(100dvh - 2rem)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
              <h3 className="font-semibold text-foreground">Report Post</h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-surface-alt transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-foreground-secondary" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-y-none p-4 space-y-3 min-h-0">
              <p className="text-sm text-foreground-secondary">Why are you reporting this post?</p>

              <div className="space-y-2">
                {REPORT_REASONS.map((r) => (
                  <label
                    key={r}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-surface-alt cursor-pointer transition-colors"
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r}
                      checked={reason === r}
                      onChange={() => setReason(r)}
                      className="accent-primary"
                    />
                    <span className="text-sm text-foreground">{r}</span>
                  </label>
                ))}
              </div>

              {reason === 'Other' && (
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Please describe the issue..."
                  rows={3}
                  maxLength={500}
                  className="w-full bg-surface-alt rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted outline-none focus:ring-2 focus:ring-primary/20 resize-none border border-transparent focus:border-primary/30 transition-all"
                />
              )}
            </div>

            <div className="flex-shrink-0 p-4 border-t border-border">
              <button
                onClick={() => mutation.mutate()}
                disabled={!reason || mutation.isPending}
                className="w-full py-3 rounded-xl bg-danger text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-danger/90 transition-colors"
              >
                {mutation.isPending ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
