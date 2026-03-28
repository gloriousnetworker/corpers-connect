'use client';

import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Upload, FileText, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { applyAsSeller } from '@/lib/api/marketplace';
import { useMarketplaceStore } from '@/store/marketplace.store';

export default function SellerApplicationForm() {
  const qc = useQueryClient();
  const { goBack, setView } = useMarketplaceStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [agreed, setAgreed] = useState(false);

  const mutation = useMutation({
    mutationFn: () => applyAsSeller(file!),
    onSuccess: () => {
      toast.success('Application submitted!', { description: 'We will review it within 24–48 hours.' });
      qc.invalidateQueries({ queryKey: ['marketplace', 'my-application'] });
      setView('application-status');
    },
    onError: (err: Error) => toast.error(err.message ?? 'Submission failed'),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5 MB');
      return;
    }
    setFile(f);
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={goBack} className="text-foreground hover:text-primary">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-bold text-foreground text-lg flex-1">Become a Seller</h1>
      </div>

      <div className="px-4 py-6 space-y-6 flex-1">
        {/* Info banner */}
        <div className="flex gap-3 p-4 rounded-xl bg-primary/8 border border-primary/20">
          <ShieldCheck size={22} className="text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">Verified seller badge</p>
            <p className="text-xs text-muted-foreground mt-1">
              Upload a valid ID to get approved as a seller. Approved sellers get a badge and
              higher visibility in Mami Market.
            </p>
          </div>
        </div>

        {/* Requirements */}
        <div>
          <h2 className="font-semibold text-foreground mb-3">Requirements</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {[
              'Valid NYSC Call-up letter or ID card',
              'National ID, driver\'s license, or international passport',
              'Image must be clear and legible (max 5 MB)',
            ].map((req, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">✓</span>
                {req}
              </li>
            ))}
          </ul>
        </div>

        {/* Upload */}
        <div>
          <h2 className="font-semibold text-foreground mb-3">Upload ID Document</h2>
          <button
            onClick={() => fileRef.current?.click()}
            className={[
              'w-full flex flex-col items-center justify-center gap-3 py-8 rounded-xl border-2 border-dashed transition-colors',
              file
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/50 hover:bg-muted',
            ].join(' ')}
          >
            {file ? (
              <>
                <FileText size={32} />
                <div className="text-center">
                  <p className="text-sm font-semibold">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <span className="text-xs underline">Change file</span>
              </>
            ) : (
              <>
                <Upload size={32} />
                <div className="text-center">
                  <p className="text-sm font-semibold">Tap to upload</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, PDF — max 5 MB</p>
                </div>
              </>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Agreement */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="w-5 h-5 rounded border-border mt-0.5 accent-primary cursor-pointer"
          />
          <span className="text-sm text-muted-foreground leading-relaxed">
            I confirm that the submitted document is genuine and belongs to me. I agree to the
            Corpers Connect marketplace terms of service.
          </span>
        </label>
      </div>

      {/* Submit */}
      <div className="sticky bottom-0 bg-surface border-t border-border px-4 py-4">
        <button
          onClick={() => mutation.mutate()}
          disabled={!file || !agreed || mutation.isPending}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {mutation.isPending && <Loader2 size={18} className="animate-spin" />}
          {mutation.isPending ? 'Submitting…' : 'Submit Application'}
        </button>
      </div>
    </div>
  );
}
