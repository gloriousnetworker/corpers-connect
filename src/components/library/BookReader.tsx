'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { X, ChevronLeft, ChevronRight, Loader2, Lock, ShoppingCart, BookX } from 'lucide-react';
import { toast } from 'sonner';
import { getBook, getReadUrl, saveProgress, getProgress, initiateBookPurchase } from '@/lib/api/books';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/auth.store';
import { useLibraryStore } from '@/store/library.store';

// Dynamic import — react-pdf pulls in a worker that should only load client-side
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let PdfDocument: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let PdfPage: any = null;

interface BookReaderProps {
  bookId: string;
}

export default function BookReader({ bookId }: BookReaderProps) {
  const user = useAuthStore((s) => s.user);
  const goBack = useLibraryStore((s) => s.goBack);

  const [pdfReady, setPdfReady] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [width, setWidth] = useState<number>(720);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dynamic import of react-pdf (client-only to avoid SSR + worker issues)
  useEffect(() => {
    let mounted = true;
    (async () => {
      const pdfMod = await import('react-pdf');
      const { pdfjs, Document, Page } = pdfMod;
      // Use the unpkg CDN worker so we don't need to copy the worker file into /public.
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      if (!mounted) return;
      PdfDocument = Document;
      PdfPage = Page;
      setPdfReady(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const { data: book } = useQuery({
    queryKey: queryKeys.book(bookId),
    queryFn: () => getBook(bookId),
    staleTime: 60_000,
  });

  const { data: access } = useQuery({
    queryKey: queryKeys.bookRead(bookId),
    queryFn: () => getReadUrl(bookId),
    staleTime: 60_000,
  });

  const { data: savedProgress } = useQuery({
    queryKey: queryKeys.bookProgress(bookId),
    queryFn: () => getProgress(bookId),
    enabled: !!access?.fullAccess,
    staleTime: 0,
  });

  const progressMutation = useMutation({
    mutationFn: (page: number) => saveProgress(bookId, page),
  });

  const purchaseMutation = useMutation({
    mutationFn: () => initiateBookPurchase(bookId, window.location.origin + '/'),
    onSuccess: (d) => {
      window.location.href = d.authorizationUrl;
    },
    onError: () => toast.error('Could not start payment'),
  });

  // Restore last-read page
  useEffect(() => {
    if (savedProgress?.lastPage) setPageNumber(savedProgress.lastPage);
  }, [savedProgress?.lastPage]);

  // Measure container so pages render at the right width
  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const w = Math.min(containerRef.current.clientWidth - 16, 720);
        setWidth(w);
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Debounced progress save on every page change
  useEffect(() => {
    if (!access?.fullAccess) return;
    if (progressSaveRef.current) clearTimeout(progressSaveRef.current);
    progressSaveRef.current = setTimeout(() => {
      progressMutation.mutate(pageNumber);
    }, 1000);
    return () => {
      if (progressSaveRef.current) clearTimeout(progressSaveRef.current);
    };
  }, [pageNumber, access?.fullAccess, progressMutation]);

  const effectiveMaxPage =
    access && !access.fullAccess && access.previewPages
      ? Math.min(access.previewPages, numPages ?? access.previewPages)
      : numPages ?? 1;

  const nextPage = useCallback(() => {
    setPageNumber((p) => Math.min(p + 1, effectiveMaxPage));
  }, [effectiveMaxPage]);

  const prevPage = useCallback(() => {
    setPageNumber((p) => Math.max(p - 1, 1));
  }, []);

  const onDocumentLoadSuccess = ({ numPages: total }: { numPages: number }) => {
    setNumPages(total);
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-black/90 text-white border-b border-white/10 flex-shrink-0">
        <button
          onClick={goBack}
          className="p-2 rounded-full hover:bg-white/10"
          aria-label="Close reader"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="text-center min-w-0 flex-1 px-2">
          <p className="text-xs font-bold truncate">{book?.title ?? 'Loading…'}</p>
          {numPages && (
            <p className="text-[10px] text-white/60">
              Page {pageNumber} of {effectiveMaxPage}
              {access && !access.fullAccess && ' · Preview'}
            </p>
          )}
        </div>
        <div className="w-9" />
      </div>

      {/* PDF viewer */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto flex flex-col items-center bg-neutral-900 py-4 relative"
      >
        {!access || !pdfReady ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-white" />
          </div>
        ) : pdfError ? (
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
              <BookX className="w-8 h-8 text-white/60" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base">PDF not available yet</h3>
              <p className="text-white/60 text-sm mt-1 leading-relaxed">
                The author hasn't uploaded the full PDF for this book yet.
                Check back later or contact support if you've already purchased it.
              </p>
            </div>
            <button
              onClick={goBack}
              className="mt-2 px-5 py-2.5 rounded-xl bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition"
            >
              Go back
            </button>
          </div>
        ) : (
          <>
            {PdfDocument && (
              <PdfDocument
                file={access.url}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={() => setPdfError(true)}
                loading={
                  <div className="py-10 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  </div>
                }
                className="flex flex-col items-center"
              >
                <div className="relative">
                  <PdfPage
                    pageNumber={pageNumber}
                    width={width}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                  {/* Diagonal watermark — buyer's name + state code, deters screen-sharing */}
                  {user && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <span
                        className="text-black/[0.06] font-black uppercase whitespace-nowrap"
                        style={{
                          fontSize: '2.5rem',
                          transform: 'rotate(-30deg)',
                          letterSpacing: '0.2em',
                        }}
                      >
                        {user.firstName} {user.lastName} · {user.stateCode}
                      </span>
                    </div>
                  )}
                </div>
              </PdfDocument>
            )}

            {/* Preview-end lock screen */}
            {access && !access.fullAccess && pageNumber === effectiveMaxPage && numPages && (
              <div className="w-full max-w-md mt-4 mx-4 p-5 rounded-2xl bg-white/10 backdrop-blur border border-white/20 text-center">
                <Lock className="w-8 h-8 text-white/70 mx-auto mb-2" />
                <h3 className="text-white font-bold text-sm">End of preview</h3>
                <p className="text-white/70 text-xs mt-1 mb-4">
                  Buy the full book to unlock all {numPages} pages.
                </p>
                <button
                  onClick={() => purchaseMutation.mutate()}
                  disabled={purchaseMutation.isPending || !book}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold disabled:opacity-50"
                >
                  {purchaseMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      Buy now — ₦{book ? (book.priceKobo / 100).toLocaleString() : '…'}
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Pager */}
      {numPages && (
        <div className="flex items-center justify-between px-4 py-3 bg-black/90 border-t border-white/10 flex-shrink-0">
          <button
            onClick={prevPage}
            disabled={pageNumber <= 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-white text-xs font-semibold disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
            Prev
          </button>
          <span className="text-white/80 text-xs font-semibold">
            {pageNumber} / {effectiveMaxPage}
          </span>
          <button
            onClick={nextPage}
            disabled={pageNumber >= effectiveMaxPage}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-white text-xs font-semibold disabled:opacity-30"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
