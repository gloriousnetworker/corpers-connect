'use client';

import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Upload, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { applyToOpportunity } from '@/lib/api/opportunities';
import type { Opportunity } from '@/types/models';

interface ApplyModalProps {
  opportunity: Opportunity;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ApplyModal({ opportunity, onClose, onSuccess }: ApplyModalProps) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      applyToOpportunity(opportunity.id, coverLetter || undefined, cvFile ?? undefined),
    onSuccess: () => {
      toast.success('Application submitted!', {
        description: `You've applied to ${opportunity.title} at ${opportunity.companyName}.`,
      });
      qc.invalidateQueries({ queryKey: ['opportunities'] });
      qc.invalidateQueries({ queryKey: ['my-applications'] });
      onSuccess?.();
      onClose();
    },
    onError: (err: Error) => {
      if (err.message?.includes('already')) {
        toast.error('You\'ve already applied to this opportunity.');
      } else {
        toast.error(err.message ?? 'Failed to submit application');
      }
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      toast.error('CV must be under 5 MB');
      return;
    }
    setCvFile(f);
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-x-4 bottom-4 top-auto z-50 bg-surface rounded-2xl border border-border shadow-2xl max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-surface flex items-center justify-between px-5 pt-5 pb-3 border-b border-border">
          <div>
            <h2 className="font-bold text-foreground text-base">Apply for Position</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {opportunity.title} · {opportunity.companyName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Cover letter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">
              Cover Letter
              <span className="text-muted-foreground font-normal ml-1">(optional)</span>
            </label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Tell the recruiter why you're a great fit…"
              rows={5}
              maxLength={5000}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none text-sm"
            />
            <p className="text-xs text-muted-foreground text-right">{coverLetter.length}/5000</p>
          </div>

          {/* CV upload */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">
              CV / Resume
              <span className="text-muted-foreground font-normal ml-1">(optional, max 5 MB)</span>
            </label>
            <button
              onClick={() => fileRef.current?.click()}
              className={[
                'flex items-center gap-3 p-4 rounded-xl border-2 border-dashed transition-colors text-left',
                cvFile
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50 hover:bg-muted',
              ].join(' ')}
            >
              {cvFile ? (
                <>
                  <FileText size={22} className="flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{cvFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(cvFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <span className="ml-auto text-xs underline flex-shrink-0">Change</span>
                </>
              ) : (
                <>
                  <Upload size={22} className="flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">Upload CV</p>
                    <p className="text-xs">PDF, DOC, DOCX — max 5 MB</p>
                  </div>
                </>
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Tips */}
          <div className="p-3 rounded-xl bg-muted/50 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">Tips for a strong application:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Highlight relevant skills and experience</li>
              <li>Mention your NYSC state and batch</li>
              <li>Keep cover letter under 300 words</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-surface px-5 py-4 border-t border-border">
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {mutation.isPending && <Loader2 size={18} className="animate-spin" />}
            {mutation.isPending ? 'Submitting…' : 'Submit Application'}
          </button>
        </div>
      </div>
    </>
  );
}
