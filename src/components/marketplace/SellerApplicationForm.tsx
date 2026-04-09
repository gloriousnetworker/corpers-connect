'use client';

import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Upload, FileText, Loader2, ShieldCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import { applyAsSeller } from '@/lib/api/marketplace';
import { useMarketplaceStore } from '@/store/marketplace.store';
import Image from 'next/image';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function SellerApplicationForm() {
  const qc = useQueryClient();
  const { goBack, setView } = useMarketplaceStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const [businessName, setBusinessName] = useState('');
  const [whatTheySell, setWhatTheySell] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      applyAsSeller({
        idDoc: file!,
        businessName: businessName.trim(),
        businessDescription: businessDescription.trim(),
        whatTheySell: whatTheySell.trim(),
      }),
    onSuccess: () => {
      toast.success('Application submitted!', {
        description: 'We will review it within 24-48 hours.',
      });
      qc.invalidateQueries({ queryKey: ['marketplace', 'my-application'] });
      setView('application-status');
    },
    onError: (err: Error) => toast.error(err.message ?? 'Submission failed'),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ACCEPTED_TYPES.includes(f.type)) {
      toast.error('Only JPG, PNG, and WebP images are allowed');
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      toast.error('File must be under 10 MB');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const clearFile = () => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const isValid =
    businessName.trim().length > 0 &&
    whatTheySell.trim().length > 0 &&
    businessDescription.trim().length >= 10 &&
    !!file;

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={goBack} className="text-foreground hover:text-primary transition-colors">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-bold text-foreground text-lg flex-1">Apply to be a Mami Marketer</h1>
      </div>

      <div className="px-4 py-6 space-y-6 flex-1">
        {/* Subtext */}
        <p className="text-sm text-muted-foreground">
          Set up your shop and start selling to fellow corps members
        </p>

        {/* Info banner */}
        <div className="flex gap-3 p-4 rounded-xl bg-primary/8 border border-primary/20">
          <ShieldCheck size={22} className="text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">Verified seller badge</p>
            <p className="text-xs text-muted-foreground mt-1">
              Approved sellers get a badge and higher visibility in Mami Market.
            </p>
          </div>
        </div>

        {/* Business Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Business Name <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value.slice(0, 100))}
            placeholder="Your business or shop name"
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-foreground placeholder:text-foreground-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
            style={{ fontSize: '16px' }}
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground text-right">{businessName.length}/100</p>
        </div>

        {/* What do you sell? */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            What do you sell? <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={whatTheySell}
            onChange={(e) => setWhatTheySell(e.target.value.slice(0, 200))}
            placeholder="e.g., Food, Electronics, Clothing..."
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-foreground placeholder:text-foreground-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
            style={{ fontSize: '16px' }}
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground text-right">{whatTheySell.length}/200</p>
        </div>

        {/* Business Description */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Business Description <span className="text-destructive">*</span>
          </label>
          <textarea
            value={businessDescription}
            onChange={(e) => setBusinessDescription(e.target.value.slice(0, 1000))}
            placeholder="Tell buyers about your business..."
            rows={4}
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-foreground placeholder:text-foreground-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none transition-colors"
            style={{ fontSize: '16px' }}
            maxLength={1000}
          />
          <div className="flex justify-between">
            {businessDescription.length > 0 && businessDescription.trim().length < 10 && (
              <p className="text-xs text-destructive">Minimum 10 characters</p>
            )}
            <p className="text-xs text-muted-foreground ml-auto">{businessDescription.length}/1000</p>
          </div>
        </div>

        {/* ID Document Upload */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Valid ID Document <span className="text-destructive">*</span>
          </label>
          <p className="text-xs text-muted-foreground mb-2">
            NYSC Call-up letter, national ID, driver&apos;s license, or international passport. JPG, PNG, or WebP (max 10 MB).
          </p>

          {preview && file ? (
            <div className="relative w-full rounded-xl border border-border overflow-hidden">
              <Image
                src={preview}
                alt="ID preview"
                width={400}
                height={300}
                className="w-full h-auto max-h-60 object-contain bg-muted"
              />
              <div className="flex items-center justify-between p-3 bg-surface-alt">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  onClick={clearFile}
                  className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-3 py-8 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary/50 hover:bg-muted transition-colors"
            >
              <Upload size={32} />
              <div className="text-center">
                <p className="text-sm font-semibold">Tap to upload</p>
                <p className="text-xs text-muted-foreground">JPG, PNG, WebP -- max 10 MB</p>
              </div>
            </button>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Submit */}
      <div className="sticky bottom-0 bg-surface border-t border-border px-4 py-4">
        <button
          onClick={() => mutation.mutate()}
          disabled={!isValid || mutation.isPending}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {mutation.isPending && <Loader2 size={18} className="animate-spin" />}
          {mutation.isPending ? 'Submitting...' : 'Submit Application'}
        </button>
      </div>
    </div>
  );
}
