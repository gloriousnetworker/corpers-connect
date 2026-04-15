'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Search, Check, Loader2 } from 'lucide-react';
import { searchUsers } from '@/lib/api/conversations';
import { getAvatarUrl, getInitials } from '@/lib/utils';
import type { TaggedUserSummary } from '@/types/models';

interface TagUsersPickerProps {
  selectedIds: string[];
  selectedUsers: TaggedUserSummary[];
  onConfirm: (ids: string[], users: TaggedUserSummary[]) => void;
  onClose: () => void;
  /** Max number of users the caller can tag. */
  max?: number;
}

export default function TagUsersPicker({
  selectedIds,
  selectedUsers,
  onConfirm,
  onClose,
  max = 20,
}: TagUsersPickerProps) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [results, setResults] = useState<TaggedUserSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [localSelected, setLocalSelected] = useState<TaggedUserSummary[]>(selectedUsers);

  // 300ms debounce on the search query
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (debounced.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    searchUsers(debounced)
      .then((rows) => {
        if (cancelled) return;
        setResults(
          rows.map((r) => ({
            id: r.id,
            firstName: r.firstName,
            lastName: r.lastName,
            profilePicture: r.profilePicture ?? null,
            isVerified: r.isVerified,
          })),
        );
      })
      .catch(() => !cancelled && setResults([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const toggleUser = (u: TaggedUserSummary) => {
    const alreadyIn = localSelected.find((x) => x.id === u.id);
    if (alreadyIn) {
      setLocalSelected((prev) => prev.filter((x) => x.id !== u.id));
    } else {
      if (localSelected.length >= max) return;
      setLocalSelected((prev) => [...prev, u]);
    }
  };

  const confirm = () => {
    onConfirm(
      localSelected.map((u) => u.id),
      localSelected,
    );
  };

  // Selected users always render at top even before a search
  const selectedMap = new Map(localSelected.map((u) => [u.id, u]));
  const displayList: TaggedUserSummary[] = [
    ...localSelected,
    ...results.filter((r) => !selectedMap.has(r.id)),
  ];

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 flex items-end sm:items-center justify-center">
      <div className="bg-surface w-full max-w-md max-h-[90vh] overflow-hidden rounded-t-3xl sm:rounded-3xl flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-foreground text-sm">
            Tag friends ({localSelected.length}/{max})
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-surface-alt" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search input */}
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or state code"
              className="w-full pl-9 pr-3 py-2.5 bg-surface-alt rounded-lg text-sm text-foreground placeholder:text-foreground-muted outline-none focus:ring-2 focus:ring-primary/30"
              style={{ fontSize: '16px' }}
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : displayList.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-foreground-muted">
              {query.length < 2
                ? 'Type at least 2 characters to search'
                : 'No one found'}
            </div>
          ) : (
            <ul className="divide-y divide-border/40">
              {displayList.map((u) => {
                const checked = selectedMap.has(u.id);
                return (
                  <li key={u.id}>
                    <button
                      onClick={() => toggleUser(u)}
                      disabled={!checked && localSelected.length >= max}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-alt disabled:opacity-40"
                    >
                      {u.profilePicture ? (
                        <Image
                          src={getAvatarUrl(u.profilePicture, 56)}
                          alt=""
                          width={36}
                          height={36}
                          className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-primary uppercase">
                            {getInitials(u.firstName, u.lastName)}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {u.firstName} {u.lastName}
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition ${
                          checked ? 'bg-primary' : 'border-2 border-border'
                        }`}
                      >
                        {checked && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Done */}
        <div className="border-t border-border p-3">
          <button
            onClick={confirm}
            className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
