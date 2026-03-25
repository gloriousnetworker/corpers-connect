'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Search, X, BadgeCheck, Loader2 } from 'lucide-react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { getCorpersInState, getSuggestions, searchDiscover } from '@/lib/api/discover';
import { queryKeys } from '@/lib/query-keys';
import { useUIStore } from '@/store/ui.store';
import { useAuthStore } from '@/store/auth.store';
import UserCard from '@/components/profile/UserCard';
import LevelBadge from '@/components/profile/LevelBadge';
import FollowButton from '@/components/profile/FollowButton';
import { getInitials, debounce } from '@/lib/utils';
import type { DiscoverUser } from '@/lib/api/discover';

export default function DiscoverSection() {
  const setViewingUser = useUIStore((s) => s.setViewingUser);
  const currentUser = useAuthStore((s) => s.user);
  const [inputValue, setInputValue] = useState('');
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search input
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSetQuery = useCallback(
    debounce((...args: unknown[]) => setQuery(args[0] as string), 300),
    []
  );

  useEffect(() => {
    debouncedSetQuery(inputValue.trim());
  }, [inputValue, debouncedSetQuery]);

  const isSearching = query.length >= 2;

  // ── Search results ───────────────────────────────────────────────────────
  const searchResults = useInfiniteQuery({
    queryKey: queryKeys.search(query),
    queryFn: ({ pageParam }) => searchDiscover(query, pageParam as string | undefined),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    enabled: isSearching,
    staleTime: 30_000,
  });

  // ── Suggestions ──────────────────────────────────────────────────────────
  const suggestions = useQuery({
    queryKey: queryKeys.suggestions(),
    queryFn: () => getSuggestions(10),
    staleTime: 5 * 60_000,
    enabled: !isSearching,
  });

  // ── Corpers in same state ─────────────────────────────────────────────────
  const corpersQuery = useInfiniteQuery({
    queryKey: queryKeys.discoverCorpers(),
    queryFn: ({ pageParam }) => getCorpersInState(pageParam as string | undefined),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    staleTime: 5 * 60_000,
    enabled: !isSearching,
  });

  const searchItems = searchResults.data?.pages.flatMap((p) => p.items) ?? [];
  const corpers = corpersQuery.data?.pages.flatMap((p) => p.items) ?? [];
  const stateLabel = corpersQuery.data?.pages[0]?.state ?? currentUser?.servingState ?? 'your state';

  const handleUserClick = (userId: string) => {
    setViewingUser(userId, 'discover');
  };

  const clearSearch = () => {
    setInputValue('');
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <div className="max-w-[680px] mx-auto">
      {/* ── Search bar ─────────────────────────────────────────────────────── */}
      <div className="sticky top-[var(--top-bar-height,56px)] z-20 bg-surface border-b border-border px-4 py-3">
        <div className="flex items-center gap-2.5 px-3 py-2.5 bg-surface-alt rounded-xl">
          {searchResults.isFetching && isSearching ? (
            <Loader2 className="w-4 h-4 text-foreground-muted flex-shrink-0 animate-spin" />
          ) : (
            <Search className="w-4 h-4 text-foreground-muted flex-shrink-0" />
          )}
          <input
            ref={inputRef}
            type="search"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Search corpers by name or state code…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-foreground-muted text-foreground"
            style={{ fontSize: '16px' }}
          />
          {inputValue && (
            <button onClick={clearSearch} className="p-0.5">
              <X className="w-3.5 h-3.5 text-foreground-muted" />
            </button>
          )}
        </div>
      </div>

      {/* ── Search results ─────────────────────────────────────────────────── */}
      {isSearching ? (
        <div className="bg-surface">
          {searchResults.isLoading ? (
            <SearchSkeleton />
          ) : searchItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <p className="font-semibold text-foreground text-sm">No corpers found</p>
              <p className="text-xs text-foreground-muted mt-1">Try a different name or state code</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {searchItems.map((u) => (
                <DiscoverUserRow
                  key={u.id}
                  user={u}
                  currentUserId={currentUser?.id}
                  onClick={() => handleUserClick(u.id)}
                />
              ))}
              {searchResults.hasNextPage && (
                <div className="p-4 text-center">
                  <button
                    onClick={() => searchResults.fetchNextPage()}
                    disabled={searchResults.isFetchingNextPage}
                    className="text-sm text-primary font-semibold disabled:opacity-50"
                  >
                    {searchResults.isFetchingNextPage ? 'Loading…' : 'Load more'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* ── Suggestions strip ───────────────────────────────────────────── */}
          <section className="bg-surface mb-2">
            <div className="px-4 pt-4 pb-2">
              <h3 className="text-sm font-semibold text-foreground">Suggested Corpers</h3>
            </div>
            {suggestions.isLoading ? (
              <div className="flex gap-3 px-4 pb-4 overflow-x-auto scrollbar-none">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-24">
                    <div className="w-16 h-16 rounded-full bg-surface-alt animate-pulse mx-auto mb-2" />
                    <div className="h-2.5 bg-surface-alt rounded animate-pulse w-3/4 mx-auto" />
                  </div>
                ))}
              </div>
            ) : (suggestions.data?.length ?? 0) === 0 ? (
              <p className="px-4 pb-4 text-sm text-foreground-muted">No suggestions right now</p>
            ) : (
              <div className="flex gap-3 px-4 pb-4 overflow-x-auto scrollbar-none">
                {suggestions.data!.map((u) => (
                  <SuggestionChip
                    key={u.id}
                    user={u}
                    currentUserId={currentUser?.id}
                    onClick={() => handleUserClick(u.id)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ── Corpers in your state ────────────────────────────────────────── */}
          <section className="bg-surface">
            <div className="px-4 pt-2 pb-2 border-t border-border">
              <h3 className="text-sm font-semibold text-foreground">
                Corpers in {stateLabel}
              </h3>
            </div>
            {corpersQuery.isLoading ? (
              <div className="divide-y divide-border/50">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-11 h-11 rounded-full bg-surface-alt animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-surface-alt rounded animate-pulse w-1/3" />
                      <div className="h-2.5 bg-surface-alt rounded animate-pulse w-1/4" />
                    </div>
                    <div className="h-7 w-16 bg-surface-alt rounded-full animate-pulse" />
                  </div>
                ))}
              </div>
            ) : corpers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <p className="font-semibold text-foreground text-sm">No corpers found in {stateLabel}</p>
                <p className="text-xs text-foreground-muted mt-1">They'll appear here as more corpers join</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {corpers.map((u) => (
                  <DiscoverUserRow
                    key={u.id}
                    user={u}
                    currentUserId={currentUser?.id}
                    onClick={() => handleUserClick(u.id)}
                  />
                ))}
                {corpersQuery.hasNextPage && (
                  <div className="p-4 text-center">
                    <button
                      onClick={() => corpersQuery.fetchNextPage()}
                      disabled={corpersQuery.isFetchingNextPage}
                      className="text-sm text-primary font-semibold disabled:opacity-50"
                    >
                      {corpersQuery.isFetchingNextPage ? 'Loading…' : 'Load more'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function DiscoverUserRow({
  user,
  currentUserId,
  onClick,
}: {
  user: DiscoverUser;
  currentUserId?: string;
  onClick: () => void;
}) {
  const initials = getInitials(user.firstName, user.lastName);
  const isOwnProfile = user.id === currentUserId;

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <button
        onClick={onClick}
        className="flex items-center gap-3 flex-1 min-w-0 text-left"
      >
        <div className="w-11 h-11 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center flex-shrink-0">
          {user.profilePicture ? (
            <Image
              src={user.profilePicture}
              alt={initials}
              width={44}
              height={44}
              className="object-cover w-full h-full"
            />
          ) : (
            <span className="font-bold text-primary text-sm uppercase">{initials}</span>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <p className="text-sm font-semibold text-foreground truncate">
              {user.firstName} {user.lastName}
            </p>
            {user.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-info flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <LevelBadge level={user.level} size="sm" />
            {user.ppa && (
              <span className="text-xs text-foreground-muted truncate">{user.ppa}</span>
            )}
          </div>
        </div>
      </button>
      {!isOwnProfile && (
        <FollowButton
          userId={user.id}
          isFollowing={false}
          size="sm"
        />
      )}
    </div>
  );
}

function SuggestionChip({
  user,
  currentUserId,
  onClick,
}: {
  user: DiscoverUser;
  currentUserId?: string;
  onClick: () => void;
}) {
  const initials = getInitials(user.firstName, user.lastName);
  const isOwnProfile = user.id === currentUserId;

  return (
    <div className="flex-shrink-0 w-24 flex flex-col items-center">
      <button
        onClick={onClick}
        className="w-16 h-16 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center mb-1.5"
      >
        {user.profilePicture ? (
          <Image
            src={user.profilePicture}
            alt={initials}
            width={64}
            height={64}
            className="object-cover w-full h-full"
          />
        ) : (
          <span className="font-bold text-primary text-base uppercase">{initials}</span>
        )}
      </button>
      <p className="text-xs font-medium text-foreground text-center truncate w-full leading-tight">
        {user.firstName}
      </p>
      <p className="text-[10px] text-foreground-muted truncate w-full text-center">{user.servingState}</p>
      {!isOwnProfile && (
        <div className="mt-1.5">
          <FollowButton userId={user.id} isFollowing={false} size="sm" />
        </div>
      )}
    </div>
  );
}

function SearchSkeleton() {
  return (
    <div className="divide-y divide-border/50">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="w-11 h-11 rounded-full bg-surface-alt animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-surface-alt rounded animate-pulse w-2/5" />
            <div className="h-2.5 bg-surface-alt rounded animate-pulse w-1/4" />
          </div>
          <div className="h-7 w-16 bg-surface-alt rounded-full animate-pulse" />
        </div>
      ))}
    </div>
  );
}
