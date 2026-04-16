'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Upload, FileText, ImagePlus, Loader2, X, Info } from 'lucide-react';
import { toast } from 'sonner';
import { publishBook } from '@/lib/api/books';
import { queryKeys } from '@/lib/query-keys';
import { useLibraryStore } from '@/store/library.store';
import type { BookGenre } from '@/types/models';

const GENRES: { value: BookGenre; label: string }[] = [
  { value: 'FICTION', label: 'Fiction' },
  { value: 'NON_FICTION', label: 'Non-Fiction' },
  { value: 'RELIGIOUS', label: 'Religious' },
  { value: 'SELF_HELP', label: 'Self-Help' },
  { value: 'BUSINESS', label: 'Business' },
  { value: 'BIOGRAPHY', label: 'Biography' },
  { value: 'POETRY', label: 'Poetry' },
  { value: 'ACADEMIC', label: 'Academic' },
  { value: 'CHILDREN', label: "Children's" },
  { value: 'HEALTH', label: 'Health' },
  { value: 'TECHNOLOGY', label: 'Technology' },
  { value: 'HISTORY', label: 'History' },
  { value: 'OTHER', label: 'Other' },
];

export default function PublishBook() {
  const queryClient = useQueryClient();
  const goBack = useLibraryStore((s) => s.goBack);
  const setView = useLibraryStore((s) => s.setView);

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [aboutTheAuthor, setAboutTheAuthor] = useState('');
  const [genre, setGenre] = useState<BookGenre>('OTHER');
  const [priceNaira, setPriceNaira] = useState('');
  const [previewPages, setPreviewPages] = useState('10');
  const [tagsText, setTagsText] = useState('');

  const [cover, setCover] = useState<File | null>(null);
  const [backCover, setBackCover] = useState<File | null>(null);
  const [pdf, setPdf] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [backCoverPreview, setBackCoverPreview] = useState<string | null>(null);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const backCoverInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const mutation = useMutation({
    mutationFn: () => {
      const priceKobo = Math.round(Number(priceNaira || '0') * 100);
      const tags = tagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 10);
      return publishBook({
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        description: description.trim(),
        aboutTheAuthor: aboutTheAuthor.trim() || undefined,
        genre,
        tags,
        priceKobo,
        previewPages: Number(previewPages) || 10,
        status: 'PUBLISHED',
        cover: cover!,
        pdf: pdf!,
        backCover: backCover ?? undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myPublished() });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast.success('Book published! 🎉');
      setView('my-published');
    },
    onError: (err: Error) => toast.error(err.message || 'Publishing failed'),
  });

  const handleCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCover(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleBackCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBackCover(file);
    setBackCoverPreview(URL.createObjectURL(file));
  };

  const handlePdf = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      toast.error('PDF must be under 100 MB');
      return;
    }
    setPdf(file);
  };

  const priceKoboPreview = Math.round(Number(priceNaira || '0') * 100);
  const authorPayoutNaira = (priceKoboPreview * 0.85) / 100;

  const canSubmit =
    !!cover &&
    !!pdf &&
    title.trim().length >= 2 &&
    description.trim().length >= 20 &&
    !mutation.isPending;

  return (
    <div className="max-w-[680px] mx-auto">
      <div className="sticky top-0 z-20 bg-surface/95 backdrop-blur-sm border-b border-border px-3 py-2 flex items-center gap-2">
        <button onClick={goBack} className="p-2 rounded-full hover:bg-surface-alt" aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <p className="text-sm font-bold text-foreground">Publish a book</p>
      </div>

      <div className="p-4 space-y-5">
        {/* Covers */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wide text-foreground-muted">
            Covers
          </label>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <CoverPicker
              label="Front cover *"
              preview={coverPreview}
              onPick={() => coverInputRef.current?.click()}
              onClear={() => {
                setCover(null);
                setCoverPreview(null);
              }}
            />
            <CoverPicker
              label="Back cover (optional)"
              preview={backCoverPreview}
              onPick={() => backCoverInputRef.current?.click()}
              onClear={() => {
                setBackCover(null);
                setBackCoverPreview(null);
              }}
            />
          </div>
          <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCover} />
          <input ref={backCoverInputRef} type="file" accept="image/*" className="hidden" onChange={handleBackCover} />
        </div>

        {/* PDF */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wide text-foreground-muted">
            Book PDF *
          </label>
          <button
            onClick={() => pdfInputRef.current?.click()}
            className={`mt-2 w-full flex items-center gap-3 p-3 rounded-xl border-2 border-dashed transition ${
              pdf ? 'border-primary bg-primary/5' : 'border-border hover:bg-surface-alt'
            }`}
          >
            <FileText className={`w-5 h-5 ${pdf ? 'text-primary' : 'text-foreground-muted'}`} />
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {pdf ? pdf.name : 'Tap to upload PDF'}
              </p>
              <p className="text-[11px] text-foreground-muted">
                {pdf ? `${(pdf.size / 1024 / 1024).toFixed(1)} MB` : 'Max 100 MB'}
              </p>
            </div>
            <Upload className="w-4 h-4 text-foreground-muted" />
          </button>
          <input ref={pdfInputRef} type="file" accept="application/pdf" className="hidden" onChange={handlePdf} />
        </div>

        {/* Title + subtitle */}
        <Field label="Title *">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            placeholder="e.g. Blinded by Religion"
            className="input"
          />
        </Field>

        <Field label="Subtitle (optional)">
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            maxLength={200}
            placeholder='e.g. "Finding God Beyond the 11th"'
            className="input"
          />
        </Field>

        {/* Genre */}
        <Field label="Genre">
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value as BookGenre)}
            className="input"
          >
            {GENRES.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </Field>

        {/* Description */}
        <Field label="Description *">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            maxLength={5000}
            placeholder="What's this book about? What will readers learn or experience?"
            className="input resize-none"
          />
          <p className="text-[10px] text-foreground-muted mt-1">{description.length}/5000</p>
        </Field>

        {/* About author */}
        <Field label="About the author (optional)">
          <textarea
            value={aboutTheAuthor}
            onChange={(e) => setAboutTheAuthor(e.target.value)}
            rows={3}
            maxLength={3000}
            placeholder="Tell readers about yourself…"
            className="input resize-none"
          />
        </Field>

        {/* Tags */}
        <Field label="Tags (comma-separated, optional)">
          <input
            type="text"
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            placeholder="faith, doubt, spiritual growth"
            className="input"
          />
        </Field>

        {/* Price + preview */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Price (₦) — 0 for free">
            <input
              type="number"
              min="0"
              step="100"
              value={priceNaira}
              onChange={(e) => setPriceNaira(e.target.value)}
              placeholder="2000"
              className="input"
            />
          </Field>
          <Field label="Free preview pages">
            <input
              type="number"
              min="0"
              max="50"
              value={previewPages}
              onChange={(e) => setPreviewPages(e.target.value)}
              className="input"
            />
          </Field>
        </div>

        {/* Earnings estimate */}
        {priceKoboPreview > 0 && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20">
            <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-xs text-foreground-secondary">
              You&apos;ll earn{' '}
              <span className="font-bold text-primary">
                ₦{authorPayoutNaira.toLocaleString()} per sale
              </span>{' '}
              (85%). Platform takes 15% to keep the servers running.
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={() => mutation.mutate()}
          disabled={!canSubmit}
          className="w-full py-3 rounded-xl bg-primary text-white text-sm font-bold shadow disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Publishing…
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Publish book
            </>
          )}
        </button>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          padding: 10px 12px;
          background: var(--surface-alt, #f3f4f6);
          border-radius: 10px;
          font-size: 14px;
          color: var(--foreground, #111);
          outline: none;
        }
        .input:focus {
          box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 30%, transparent);
        }
        .input::placeholder {
          color: var(--foreground-muted, #999);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-bold uppercase tracking-wide text-foreground-muted">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function CoverPicker({
  label,
  preview,
  onPick,
  onClear,
}: {
  label: string;
  preview: string | null;
  onPick: () => void;
  onClear: () => void;
}) {
  return (
    <div>
      <p className="text-[10px] text-foreground-muted mb-1">{label}</p>
      <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-surface-alt border-2 border-dashed border-border">
        {preview ? (
          <>
            <Image src={preview} alt="" fill className="object-cover" sizes="160px" />
            <button
              onClick={onClear}
              className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white"
              aria-label="Remove"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <button onClick={onPick} className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <ImagePlus className="w-5 h-5 text-foreground-muted" />
            <span className="text-[10px] text-foreground-muted font-semibold">Tap to add</span>
          </button>
        )}
      </div>
    </div>
  );
}
