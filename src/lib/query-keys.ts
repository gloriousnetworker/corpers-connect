export const queryKeys = {
  // Auth
  me: () => ['me'] as const,
  sessions: () => ['sessions'] as const,

  // Feed
  feed: () => ['feed'] as const,

  // Posts
  post: (id: string) => ['post', id] as const,
  postComments: (postId: string) => ['post', postId, 'comments'] as const,
  postReactions: (postId: string) => ['post', postId, 'reactions'] as const,

  // Users
  user: (id: string) => ['user', id] as const,
  userPosts: (id: string) => ['user', id, 'posts'] as const,
  userFollowers: (id: string) => ['user', id, 'followers'] as const,
  userFollowing: (id: string) => ['user', id, 'following'] as const,
  isFollowing: (id: string) => ['user', id, 'is-following'] as const,
  blockedUsers: () => ['blocked-users'] as const,
  bookmarks: () => ['bookmarks'] as const,

  // Discover
  discoverCorpers: () => ['discover', 'corpers'] as const,
  suggestions: () => ['discover', 'suggestions'] as const,
  search: (q: string) => ['search', 'users', q] as const,
  searchPosts: (q: string) => ['search', 'posts', q] as const,
  searchListings: (q: string) => ['search', 'listings', q] as const,

  // Stories
  stories: () => ['stories'] as const,
  userHighlights: (userId: string) => ['highlights', userId] as const,

  // Reels
  reels: () => ['reels'] as const,
  reelsExplore: () => ['reels', 'explore'] as const,

  // Messaging
  conversations: () => ['conversations'] as const,
  conversation: (id: string) => ['conversation', id] as const,
  messages: (conversationId: string) => ['messages', conversationId] as const,
  messageSearch: (conversationId: string, q: string) => ['messages', conversationId, 'search', q] as const,

  // Notifications
  notifications: () => ['notifications'] as const,
  unreadCount: () => ['notifications', 'unread-count'] as const,

  // Marketplace
  listings: (filters: Record<string, unknown>) => ['listings', filters] as const,
  listing: (id: string) => ['listing', id] as const,
  listingReviews: (id: string) => ['listing', id, 'reviews'] as const,
  myListings: () => ['my-listings'] as const,
  myApplication: () => ['seller-application', 'me'] as const,
  sellerProfile: (userId: string) => ['seller-profile', userId] as const,
  sellerListings: (userId: string, cursor?: string) => ['seller-listings', userId, cursor] as const,
  listingComments: (listingId: string, cursor?: string) => ['listing-comments', listingId, cursor] as const,
  marketplaceConversations: (cursor?: string) => ['marketplace-conversations', cursor] as const,
  marketplaceConversation: (id: string) => ['marketplace-conversation', id] as const,
  mySellerProfile: () => ['my-seller-profile'] as const,

  // Opportunities
  opportunities: (filters: Record<string, unknown>) => ['opportunities', filters] as const,
  opportunity: (id: string) => ['opportunity', id] as const,
  myOpportunities: () => ['my-opportunities'] as const,
  savedOpportunities: () => ['saved-opportunities'] as const,
  myApplications: () => ['my-applications'] as const,
  opportunityApplications: (id: string) => ['opportunity', id, 'applications'] as const,

  // Subscriptions
  plans: () => ['subscription-plans'] as const,
  subscription: () => ['subscription', 'me'] as const,
  subscriptionHistory: () => ['subscription', 'history'] as const,
  level: () => ['subscription', 'level'] as const,

  // Calls
  callHistory: () => ['calls'] as const,
  call: (id: string) => ['call', id] as const,
};
