'use client';

import { useLibraryStore } from '@/store/library.store';
import LibraryHome from '@/components/library/LibraryHome';
import BookDetail from '@/components/library/BookDetail';
import BookReader from '@/components/library/BookReader';
import MyLibrary from '@/components/library/MyLibrary';
import MyPublished from '@/components/library/MyPublished';
import PublishBook from '@/components/library/PublishBook';
import WalletView from '@/components/library/WalletView';

/**
 * Library is an SPA-within-SPA: internal view state is held by useLibraryStore
 * (home → detail → reader etc.). The outer Dashboard only routes to this
 * section — all sub-navigation stays in here.
 */
export default function LibrarySection() {
  const view = useLibraryStore((s) => s.view);
  const selectedBookId = useLibraryStore((s) => s.selectedBookId);

  if (view === 'detail' && selectedBookId) return <BookDetail bookId={selectedBookId} />;
  if (view === 'reader' && selectedBookId) return <BookReader bookId={selectedBookId} />;
  if (view === 'my-library') return <MyLibrary />;
  if (view === 'my-published') return <MyPublished />;
  if (view === 'publish') return <PublishBook />;
  if (view === 'wallet') return <WalletView />;

  return <LibraryHome />;
}
