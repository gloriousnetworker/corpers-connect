'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Search, X, BadgeCheck, Loader2, ShoppingBag, TrendingUp, Hash, ArrowLeft, Flame } from 'lucide-react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { getCorpersInState, getSuggestions, searchDiscover, searchPosts, searchListings } from '@/lib/api/discover';
import { getTrendingPosts, getTrendingHashtags, getHashtagPosts, type TrendingHashtag } from '@/lib/api/posts';
import { queryKeys } from '@/lib/query-keys';
import { useUIStore } from '@/store/ui.store';
import { useAuthStore } from '@/store/auth.store';
import LevelBadge from '@/components/profile/LevelBadge';
import FollowButton from '@/components/profile/FollowButton';
import PostCard from '@/components/post/PostCard';
import { getInitials, debounce, getAvatarUrl, getOptimisedUrl } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/utils';
import type { DiscoverUser } from '@/lib/api/discover';
import type { Post, MarketplaceListing } from '@/types/models';

type SearchTab = 'people' | 'posts' | 'listings';
type DiscoverView = 'explore' | 'trending' | 'hashtag';

export default function DiscoverSection() {
  const setViewingUser = useUIStore((s) => s.setViewingUser);
  const currentUser = useAuthStore((s) => s.user);
  const pendingHashtag = useUIStore((s) => s.pendingHashtag);
  const setHashtag = useUIStore((s) => s.setHashtag);

  const [inputValue, setInputValue] = useState('');
  const [query, setQuery] = useState('');
  const [searchTab, setSearchTab] = useState<SearchTab>('people');
  const [discoverView, setDiscoverView] = useState<DiscoverView>('explore');
  const [activeHashtag, setActiveHashtag] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle hashtag deep-link from anywhere in the app (e.g. tapping #tag in PostCard)
  useEffect(() => {
    if (pendingHashtag) {
      setActiveHashtag(pendingHashtag);
      setDiscoverView('hashtag');
      setHashtag(null); // clear so it doesn't re-trigger
    }
  }, [pendingHashtag, setHashtag]);

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
    enabled: isSearching && searchTab === 'people',
    staleTime: 30_000,
  });

  const postsResults = useInfiniteQuery({
    queryKey: queryKeys.searchPosts(query),
    queryFn: ({ pageParam }) => searchPosts(query, pageParam as string | undefined),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    enabled: isSearching && searchTab === 'posts',
    staleTime: 30_000,
  });

  const listingsResults = useInfiniteQuery({
    queryKey: queryKeys.searchListings(query),
    queryFn: ({ pageParam }) => searchListings(query, pageParam as string | undefined),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    enabled: isSearching && searchTab === 'listings',
    staleTime: 30_000,
  });

  // ── Suggestions + Corpers (explore view) ─────────────────────────────────
  const suggestions = useQuery({
    queryKey: queryKeys.suggestions(),
    queryFn: () => getSuggestions(10),
    staleTime: 5 * 60_000,
    enabled: !isSearching && discoverView === 'explore',
  });

  const corpersQuery = useInfiniteQuery({
    queryKey: queryKeys.discoverCorpers(),
    queryFn: ({ pageParam }) => getCorpersInState(pageParam as string | undefined),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    staleTime: 5 * 60_000,
    enabled: !isSearching && discoverView === 'explore',
  });

  // ── Trending ──────────────────────────────────────────────────────────────
  const trendingHashtagsQuery = useQuery({
    queryKey: queryKeys.trendingHashtags(),
    queryFn: getTrendingHashtags,
    staleTime: 5 * 60_000,
    enabled: !isSearching && discoverView === 'trending',
  });

  const trendingPostsQuery = useQuery({
    queryKey: queryKeys.trendingPosts(),
    queryFn: getTrendingPosts,
    staleTime: 5 * 60_000,
    enabled: !isSearching && discoverView === 'trending',
  });

  // ── Hashtag feed ─────────────────────────────────────────────────────────
  const hashtagQuery = useInfiniteQuery({
    queryKey: queryKeys.hashtagPosts(activeHashtag ?? ''),
    queryFn: ({ pageParam }) => getHashtagPosts(activeHashtag!, pageParam as string | undefined),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    enabled: discoverView === 'hashtag' && !!activeHashtag,
    staleTime: 60_000,
  });

  const searchItems = searchResults.data?.pages.flatMap((p) => p.items) ?? [];
  const postItems = postsResults.data?.pages.flatMap((p) => p.items) ?? [];
  const listingItems = listingsResults.data?.pages.flatMap((p) => p.items) ?? [];
  const corpers = corpersQuery.data?.pages.flatMap((p) => p.items) ?? [];
  const stateLabel = corpersQuery.data?.pages[0]?.state ?? currentUser?.servingState ?? 'your state';
  const hashtagPosts = hashtagQuery.data?.pages.flatMap((p) => p.items) ?? [];
  const hashtagPostCount = hashtagQuery.data?.pages[0]?.postCount ?? 0;

  const handleUserClick = (userId: string) => setViewingUser(userId, 'discover');

  const openHashtag = (tag: string) => {
    setActiveHashtag(tag);
    setDiscoverView('hashtag');
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
            placeholder="Search corpers, posts, listings…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-foreground-muted text-foreground"
            style={{ fontSize: '16px' }}
          />
          {inputValue && (
            <button onClick={clearSearch} className="p-0.5">
              <X className="w-3.5 h-3.5 text-foreground-muted" />
            </button>
          )}
        </div>

        {/* Explore / Trending tabs (only when not searching) */}
        {!isSearching && discoverView !== 'hashtag' && (
          <div className="flex gap-1 mt-2.5">
            <button
              onClick={() => setDiscoverView('explore')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                discoverView === 'explore'
                  ? 'bg-primary text-white'
                  : 'bg-surface-alt text-foreground-muted hover:text-foreground'
              }`}
            >
              Explore
            </button>
            <button
              onClick={() => setDiscoverView('trending')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                discoverView === 'trending'
                  ? 'bg-primary text-white'
                  : 'bg-surface-alt text-foreground-muted hover:text-foreground'
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              Trending
            </button>
          </div>
        )}

        {/* Hashtag header */}
        {!isSearching && discoverView === 'hashtag' && activeHashtag && (
          <div className="flex items-center gap-2 mt-2.5">
            <button
              onClick={() => { setDiscoverView('explore'); setActiveHashtag(null); }}
              className="p-1 rounded-full hover:bg-surface-alt"
            >
              <ArrowLeft className="w-4 h-4 text-foreground-muted" />
            </button>
            <div className="flex items-center gap-1.5">
              <Hash className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-foreground">{activeHashtag}</span>
              {hashtagPostCount > 0 && (
                <span className="text-xs text-foreground-muted">· {hashtagPostCount.toLocaleString()} posts</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Search results ─────────────────────────────────────────────────── */}
      {isSearching ? (
        <div className="bg-surface">
          <div className="flex border-b border-border">
            {(['people', 'posts', 'listings'] as SearchTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setSearchTab(tab)}
                className={`flex-1 py-2.5 text-xs font-semibold capitalize transition-colors border-b-2 ${
                  searchTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-foreground-muted hover:text-foreground'
                }`}
              >
                {tab === 'people' ? 'People' : tab === 'posts' ? 'Posts' : 'Listings'}
              </button>
            ))}
          </div>

          {searchTab === 'people' && (
            <>
              {searchResults.isLoading ? <SearchSkeleton /> : searchItems.length === 0 ? (
                <SearchEmpty label="No corpers found" hint="Try a different name or state code" />
              ) : (
                <div className="divide-y divide-border/50">
                  {searchItems.map((u) => (
                    <DiscoverUserRow key={u.id} user={u} currentUserId={currentUser?.id} onClick={() => handleUserClick(u.id)} />
                  ))}
                  {searchResults.hasNextPage && (
                    <LoadMoreButton onClick={() => searchResults.fetchNextPage()} isLoading={searchResults.isFetchingNextPage} />
                  )}
                </div>
              )}
            </>
          )}

          {searchTab === 'posts' && (
            <>
              {postsResults.isLoading ? <SearchSkeleton /> : postItems.length === 0 ? (
                <SearchEmpty label="No posts found" hint="Try different keywords" />
              ) : (
                <div className="divide-y divide-border/50">
                  {postItems.map((post) => (
                    <SearchPostRow key={post.id} post={post} />
                  ))}
                  {postsResults.hasNextPage && (
                    <LoadMoreButton onClick={() => postsResults.fetchNextPage()} isLoading={postsResults.isFetchingNextPage} />
                  )}
                </div>
              )}
            </>
          )}

          {searchTab === 'listings' && (
            <>
              {listingsResults.isLoading ? <SearchSkeleton /> : listingItems.length === 0 ? (
                <SearchEmpty label="No listings found" hint="Try different keywords" />
              ) : (
                <div className="divide-y divide-border/50">
                  {listingItems.map((listing) => (
                    <SearchListingRow key={listing.id} listing={listing} />
                  ))}
                  {listingsResults.hasNextPage && (
                    <LoadMoreButton onClick={() => listingsResults.fetchNextPage()} isLoading={listingsResults.isFetchingNextPage} />
                  )}
                </div>
              )}
            </>
          )}
        </div>

      ) : discoverView === 'hashtag' ? (
        /* ── Hashtag feed ──────────────────────────────────────────────────── */
        <div className="bg-surface">
          {hashtagQuery.isLoading ? (
            <div className="py-10 flex justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-foreground-muted" />
            </div>
          ) : hashtagPosts.length === 0 ? (
            <SearchEmpty
              label={`No posts for #${activeHashtag}`}
              hint="Be the first to use this hashtag!"
            />
          ) : (
            <>
              {hashtagPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
              {hashtagQuery.hasNextPage && (
                <LoadMoreButton onClick={() => hashtagQuery.fetchNextPage()} isLoading={hashtagQuery.isFetchingNextPage} />
              )}
            </>
          )}
        </div>

      ) : discoverView === 'trending' ? (
        /* ── Trending view ─────────────────────────────────────────────────── */
        <div className="bg-surface">
          {/* Trending hashtag chips */}
          <section className="px-4 pt-4 pb-3 border-b border-border">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-4 h-4 text-orange-500" />
              <h3 className="text-sm font-bold text-foreground">Trending Hashtags</h3>
            </div>
            {trendingHashtagsQuery.isLoading ? (
              <div className="flex flex-wrap gap-2">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-7 w-20 rounded-full bg-surface-alt animate-pulse" />
                ))}
              </div>
            ) : (trendingHashtagsQuery.data?.length ?? 0) === 0 ? (
              <p className="text-sm text-foreground-muted">No hashtags yet — start posting with #tags!</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {trendingHashtagsQuery.data!.map((h: TrendingHashtag) => (
                  <button
                    key={h.id}
                    onClick={() => openHashtag(h.tag)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                  >
                    <Hash className="w-3 h-3" />
                    {h.tag}
                    <span className="text-primary/60 ml-0.5">{h.postCount}</span>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Trending posts */}
          <section>
            <div className="flex items-center gap-2 px-4 pt-4 pb-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Trending Posts</h3>
              <span className="text-xs text-foreground-muted">last 48 hours</span>
            </div>
            {trendingPostsQuery.isLoading ? (
              <div className="divide-y divide-border/50">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-3 px-4 py-3">
                    <div className="w-10 h-10 rounded-full bg-surface-alt animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-3 bg-surface-alt rounded animate-pulse w-1/3" />
                      <div className="h-2.5 bg-surface-alt rounded animate-pulse w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (trendingPostsQuery.data?.length ?? 0) === 0 ? (
              <SearchEmpty
                label="Nothing trending yet"
                hint="Posts with the most reactions will appear here"
              />
            ) : (
              trendingPostsQuery.data!.map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            )}
          </section>
        </div>

      ) : (
        /* ── Explore view (default) ────────────────────────────────────────── */
        <>
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
      <button onClick={onClick} className="flex items-center gap-3 flex-1 min-w-0 text-left">
        <div className="w-11 h-11 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center flex-shrink-0">
          {user.profilePicture ? (
            <Image src={getAvatarUrl(user.profilePicture, 88)} alt={initials} width={44} height={44} className="object-cover w-full h-full" />
          ) : (
            <span className="font-bold text-primary text-sm uppercase">{initials}</span>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <p className="text-sm font-semibold text-foreground truncate">{user.firstName} {user.lastName}</p>
            {user.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-info flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <LevelBadge level={user.level} size="sm" />
            {user.ppa && <span className="text-xs text-foreground-muted truncate">{user.ppa}</span>}
          </div>
        </div>
      </button>
      {!isOwnProfile && (
        <FollowButton userId={user.id} isFollowing={user.isFollowing ?? false} followsYou={user.followsYou ?? false} size="sm" />
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
      <button onClick={onClick} className="w-16 h-16 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center mb-1.5">
        {user.profilePicture ? (
          <Image src={getAvatarUrl(user.profilePicture, 128)} alt={initials} width={64} height={64} className="object-cover w-full h-full" />
        ) : (
          <span className="font-bold text-primary text-base uppercase">{initials}</span>
        )}
      </button>
      <p className="text-xs font-medium text-foreground text-center truncate w-full leading-tight">{user.firstName}</p>
      <p className="text-[10px] text-foreground-muted truncate w-full text-center">{user.servingState}</p>
      {!isOwnProfile && (
        <div className="mt-1.5">
          <FollowButton userId={user.id} isFollowing={user.isFollowing ?? false} followsYou={user.followsYou ?? false} size="sm" />
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

function SearchEmpty({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <p className="font-semibold text-foreground text-sm">{label}</p>
      <p className="text-xs text-foreground-muted mt-1">{hint}</p>
    </div>
  );
}

function LoadMoreButton({ onClick, isLoading }: { onClick: () => void; isLoading: boolean }) {
  return (
    <div className="p-4 text-center">
      <button onClick={onClick} disabled={isLoading} className="text-sm text-primary font-semibold disabled:opacity-50">
        {isLoading ? 'Loading…' : 'Load more'}
      </button>
    </div>
  );
}

function SearchPostRow({ post }: { post: Post }) {
  const initials = getInitials(post.author.firstName, post.author.lastName);
  return (
    <div className="flex gap-3 px-4 py-3">
      <div className="w-9 h-9 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center flex-shrink-0">
        {post.author.profilePicture ? (
          <Image src={getAvatarUrl(post.author.profilePicture, 72)} alt={initials} width={36} height={36} className="object-cover w-full h-full" />
        ) : (
          <span className="text-xs font-bold text-primary uppercase">{initials}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p className="text-xs font-semibold text-foreground truncate">{post.author.firstName} {post.author.lastName}</p>
          {post.author.isVerified && <BadgeCheck className="w-3 h-3 text-info flex-shrink-0" />}
          <span className="text-[10px] text-foreground-muted ml-auto flex-shrink-0">{formatRelativeTime(post.createdAt)}</span>
        </div>
        {post.content && (
          <p className="text-xs text-foreground-muted mt-0.5 line-clamp-2">{post.content}</p>
        )}
        {post.mediaUrls?.[0] && (
          <div className="mt-1.5 w-16 h-12 rounded overflow-hidden bg-surface-alt flex-shrink-0">
            <Image src={getOptimisedUrl(post.mediaUrls[0], 128)} alt="Post media" width={64} height={48} className="object-cover w-full h-full" />
          </div>
        )}
      </div>
    </div>
  );
}

function SearchListingRow({ listing }: { listing: MarketplaceListing }) {
  return (
    <div className="flex gap-3 px-4 py-3">
      <div className="w-14 h-14 rounded-lg overflow-hidden bg-surface-alt flex items-center justify-center flex-shrink-0">
        {listing.images?.[0] ? (
          <Image src={getOptimisedUrl(listing.images[0], 112)} alt={listing.title} width={56} height={56} className="object-cover w-full h-full" />
        ) : (
          <ShoppingBag className="w-6 h-6 text-foreground-muted" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{listing.title}</p>
        <p className="text-xs text-foreground-muted mt-0.5 line-clamp-1">{listing.description}</p>
        <div className="flex items-center gap-2 mt-1">
          {listing.price != null && (
            <span className="text-xs font-bold text-primary">₦{listing.price.toLocaleString()}</span>
          )}
          <span className="text-[10px] text-foreground-muted">{listing.servingState}</span>
        </div>
      </div>
    </div>
  );
}
