import api from './client';
import type { ApiResponse, PaginatedData } from '@/types/api';
import type {
  Book,
  BookGenre,
  BookStatus,
  BookReview,
  BookProgress,
  BookReadAccess,
} from '@/types/models';

export interface BookListParams {
  cursor?: string;
  limit?: number;
  genre?: BookGenre;
  q?: string;
  authorId?: string;
  sort?: 'trending' | 'newest' | 'bestseller';
}

/** GET /books — browse the public library */
export async function listBooks(params: BookListParams = {}): Promise<PaginatedData<Book>> {
  const { data } = await api.get<ApiResponse<PaginatedData<Book>>>('/books', { params });
  return data.data;
}

/** GET /books/:bookId — single book detail (author + metadata, pdfUrl only if owned) */
export async function getBook(bookId: string): Promise<Book> {
  const { data } = await api.get<ApiResponse<Book>>(`/books/${bookId}`);
  return data.data;
}

/**
 * GET /books/:bookId/read — read-access payload.
 *   - fullAccess=true → pdfUrl is the full book
 *   - fullAccess=false → pdfUrl is the same file but frontend must clamp to previewPages
 */
export async function getReadUrl(bookId: string): Promise<BookReadAccess> {
  const { data } = await api.get<ApiResponse<BookReadAccess>>(`/books/${bookId}/read`);
  return data.data;
}

export interface PublishBookPayload {
  title: string;
  subtitle?: string;
  description: string;
  aboutTheAuthor?: string;
  genre: BookGenre;
  tags?: string[];
  language?: string;
  priceKobo: number;
  previewPages?: number;
  status?: BookStatus;
  cover: File;
  pdf: File;
  backCover?: File;
}

/** POST /books — publish a new book (multipart) */
export async function publishBook(payload: PublishBookPayload): Promise<Book> {
  const fd = new FormData();
  fd.append('title', payload.title);
  if (payload.subtitle) fd.append('subtitle', payload.subtitle);
  fd.append('description', payload.description);
  if (payload.aboutTheAuthor) fd.append('aboutTheAuthor', payload.aboutTheAuthor);
  fd.append('genre', payload.genre);
  if (payload.tags) fd.append('tags', JSON.stringify(payload.tags));
  if (payload.language) fd.append('language', payload.language);
  fd.append('priceKobo', String(payload.priceKobo));
  if (payload.previewPages !== undefined) fd.append('previewPages', String(payload.previewPages));
  if (payload.status) fd.append('status', payload.status);
  fd.append('cover', payload.cover);
  fd.append('pdf', payload.pdf);
  if (payload.backCover) fd.append('backCover', payload.backCover);

  const { data } = await api.post<ApiResponse<Book>>('/books', fd);
  return data.data;
}

/** PATCH /books/:bookId — edit metadata (price, description, status, etc.) */
export async function updateBook(
  bookId: string,
  payload: Partial<Omit<PublishBookPayload, 'cover' | 'pdf' | 'backCover'>>,
): Promise<Book> {
  const { data } = await api.patch<ApiResponse<Book>>(`/books/${bookId}`, payload);
  return data.data;
}

export async function deleteBook(bookId: string): Promise<{ softDeleted: boolean }> {
  const { data } = await api.delete<ApiResponse<{ softDeleted: boolean }>>(`/books/${bookId}`);
  return data.data;
}

/** GET /books/my/library — books the caller has purchased */
export async function getMyLibrary(
  params: { cursor?: string; limit?: number } = {},
): Promise<PaginatedData<Book & { purchasedAt: string }>> {
  const { data } = await api.get<ApiResponse<PaginatedData<Book & { purchasedAt: string }>>>(
    '/books/my/library',
    { params },
  );
  return data.data;
}

/** GET /books/my/published — books the caller has published */
export async function getMyPublished(): Promise<Book[]> {
  const { data } = await api.get<ApiResponse<Book[]>>('/books/my/published');
  return data.data;
}

// ── Purchase ──────────────────────────────────────────────────────────────────

export interface PurchaseInitResponse {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
  amountKobo: number;
}

/** POST /books/:bookId/purchase — initializes Paystack; frontend redirects to authorizationUrl */
export async function initiateBookPurchase(
  bookId: string,
  callbackUrl?: string,
): Promise<PurchaseInitResponse> {
  const { data } = await api.post<ApiResponse<PurchaseInitResponse>>(
    `/books/${bookId}/purchase`,
    { callbackUrl },
  );
  return data.data;
}

// ── Reviews ───────────────────────────────────────────────────────────────────

export async function listReviews(
  bookId: string,
  params: { cursor?: string; limit?: number } = {},
): Promise<PaginatedData<BookReview>> {
  const { data } = await api.get<ApiResponse<PaginatedData<BookReview>>>(
    `/books/${bookId}/reviews`,
    { params },
  );
  return data.data;
}

export async function createReview(
  bookId: string,
  payload: { rating: number; content?: string },
): Promise<BookReview> {
  const { data } = await api.post<ApiResponse<BookReview>>(
    `/books/${bookId}/reviews`,
    payload,
  );
  return data.data;
}

// ── Progress ──────────────────────────────────────────────────────────────────

export async function saveProgress(bookId: string, lastPage: number): Promise<BookProgress | null> {
  const { data } = await api.patch<ApiResponse<BookProgress | null>>(
    `/books/${bookId}/progress`,
    { lastPage },
  );
  return data.data;
}

export async function getProgress(bookId: string): Promise<BookProgress | null> {
  const { data } = await api.get<ApiResponse<BookProgress | null>>(`/books/${bookId}/progress`);
  return data.data;
}
