'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Search, Check, Loader2, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { searchUsers } from '@/lib/api/conversations';
import { getFollowing } from '@/lib/api/users';
import { useAuthStore } from '@/store/auth.store';
import { queryKeys } from '@/lib/query-keys';
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
  selectedIds: _selectedIds,
  selectedUsers,
  onConfirm,
  onClose,
  max = 20,
}: TagUsersPickerProps) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [searchResults, setSearchResults] = useState<TaggedUserSummary[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [localSelected, setLocalSelected] = useState<TaggedUserSummary[]>(selectedUsers);

  // Load the caller's connections (following list) so the picker isn't empty
  // when it opens. Most of the time people tag friends they already follow.
  const { data: followingData, isLoading: followingLoading } = useQuery({
    queryKey: currentUserId ? queryKeys.userFollowing(currentUserId) : ['noop'],
    queryFn: () => getFollowing(currentUserId!, undefined, 50),
    enabled: !!currentUserId,
    staleTime: 60_000,
  });

  const connections: TaggedUserSummary[] = (followingData?.items ?? []).map((u) => ({
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    profilePicture: u.profilePicture ?? null,
    isVerified: u.isVerified,
  }));

  // 300ms debounce on the search query
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Only hit /discover/search when the user actually types something.
  // Otherwise we filter the already-loaded connections locally, which is
  // instant and covers the common case (tagging someone you follow).
  useEffect(() => {
    if (debounced.length < 2) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    setSearchLoading(true);
    searchUsers(debounced)
      .then((rows) => {
        if (cancelled) return;
        setSearchResults(
          rows.map((r) => ({
            id: r.id,
            firstName: r.firstName,
            lastName: r.lastName,
            profilePicture: r.profilePicture ?? null,
            isVerified: r.isVerified,
          })),
        );
      })
      .catch(() => !cancelled && setSearchResults([]))
      .finally(() => !cancelled && setSearchLoading(false));
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

  const selectedMap = new Map(localSelected.map((u) => [u.id, u]));
  const q = debounced.toLowerCase();

  // Build the display list:
  //   - No search:  Selected → then all connections (alphabetical)
  //   - Searching:  Selected (matching) → connections matching → non-connection matches
  let displayList: TaggedUserSummary[];
  let sectionHeader: string | null;

  if (q.length < 2) {
    sectionHeader = connections.length > 0 ? 'Your connections' : null;
    const otherConnections = connections.filter((c) => !selectedMap.has(c.id));
    displayList = [...localSelected, ...otherConnections];
  } else {
    const matchesQuery = (u: TaggedUserSummary) =>
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(q);

    const selectedMatches = localSelected.filter(matchesQuery);
    const connectionMatches = connections.filter(
      (c) => !selectedMap.has(c.id) && matchesQuery(c),
    );
    const connectionIds = new Set(connections.map((c) => c.id));
    const searchOnly = searchResults.filter(
      (r) => !selectedMap.has(r.id) && !connectionIds.has(r.id),
    );

    sectionHeader = null;
    displayList = [...selectedMatches, ...connectionMatches, ...searchOnly];
  }

  const loading = q.length >= 2 && searchLoading;

  return (
    // z-[10050] so this always sits above CreatePostModal (z-[9999]) and any
    // other portalled modals that might open the picker.
    <div className="fixed inset-0 z-[10050] bg-black/60 flex items-end sm:items-center justify-center">
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
              placeholder="Search connections"
              className="w-full pl-9 pr-3 py-2.5 bg-surface-alt rounded-lg text-sm text-foreground placeholder:text-foreground-muted outline-none focus:ring-2 focus:ring-primary/30"
              style={{ fontSize: '16px' }}
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {(followingLoading && q.length < 2) || loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : displayList.length === 0 ? (
            <div className="px-4 py-10 text-center">
              {q.length < 2 ? (
                <>
                  <Users className="w-10 h-10 text-foreground-muted mx-auto mb-2" />
                  <p className="text-sm font-semibold text-foreground">No connections yet</p>
                  <p className="text-xs text-foreground-muted mt-1">
                    Follow people on Corpers Connect to tag them here.
                  </p>
                </>
              ) : (
                <p className="text-sm text-foreground-muted">No one found for &ldquo;{debounced}&rdquo;</p>
              )}
            </div>
          ) : (
            <div>
              {sectionHeader && (
                <p className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
                  {sectionHeader}
                </p>
              )}
              <ul className="divide-y divide-border/40">
                {displayList.map((u) => {
                  const checked = selectedMap.has(u.id);
                  return (
                    <li key={u.id}>
                      <button
                        onClick={() => toggleUser(u)}
                        disabled={!checked && localSelected.length >= max}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-alt disabled:opacity-40 text-left"
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
                        <div className="flex-1 min-w-0">
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
            </div>
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
