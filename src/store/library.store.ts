import { create } from 'zustand';

export type LibraryView =
  | 'home'
  | 'detail'
  | 'reader'
  | 'my-library'
  | 'my-published'
  | 'publish'
  | 'wallet';

interface LibraryState {
  view: LibraryView;
  selectedBookId: string | null;

  setView: (view: LibraryView) => void;
  openBook: (bookId: string) => void;
  openReader: (bookId: string) => void;
  goBack: () => void;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  view: 'home',
  selectedBookId: null,

  setView: (view) => set({ view }),

  openBook: (bookId) => set({ view: 'detail', selectedBookId: bookId }),

  openReader: (bookId) => set({ view: 'reader', selectedBookId: bookId }),

  goBack: () => {
    const { view } = get();
    if (view === 'reader') {
      set({ view: 'detail' });
    } else if (
      view === 'detail' ||
      view === 'my-library' ||
      view === 'my-published' ||
      view === 'publish' ||
      view === 'wallet'
    ) {
      set({ view: 'home', selectedBookId: null });
    } else {
      set({ view: 'home' });
    }
  },
}));
