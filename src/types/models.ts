import {
  UserLevel,
  SubscriptionTier,
  PostVisibility,
  PostType,
  ReactionType,
  MessageType,
  ConversationType,
  ParticipantRole,
  ListingType,
  ListingCategory,
  ListingStatus,
  CallType,
  CallStatus,
  NotificationType,
  SellerApplicationStatus,
  OpportunityType,
  ApplicationStatus,
  SubscriptionStatus,
  SubscriptionPlan,
} from './enums';

export interface User {
  id: string;
  stateCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  servingState: string;
  lga?: string | null;
  ppa?: string | null;
  batch: string;
  profilePicture?: string | null;
  bannerImage?: string | null;
  bio?: string | null;
  corperTag: boolean;
  corperTagLabel?: string | null;
  level: UserLevel;
  isVerified: boolean;
  subscriptionTier: SubscriptionTier;
  isOnboarded: boolean;
  isActive: boolean;
  isFirstLogin: boolean;
  twoFactorEnabled: boolean;
  lastSeen?: string | null;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  isFollowing?: boolean;
  followsYou?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  author: User;
  content?: string | null;
  mediaUrls: string[];
  visibility: PostVisibility;
  postType: PostType;
  repostOfId?: string | null;
  isEdited: boolean;
  editedAt?: string | null;
  isFlagged: boolean;
  reactionsCount: number;
  commentsCount: number;
  sharesCount: number;
  myReaction?: ReactionType | null;
  isBookmarked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommentReaction {
  id: string;
  userId: string;
  emoji: string;
}

export interface Comment {
  id: string;
  postId: string;
  parentId?: string | null;
  authorId: string;
  author: User;
  content: string;
  isEdited: boolean;
  replies?: Comment[];
  repliesCount?: number;
  reactions?: CommentReaction[];
  createdAt: string;
  updatedAt: string;
}

export interface Story {
  id: string;
  authorId: string;
  author: User;
  mediaUrl: string;
  mediaType: string;
  caption?: string | null;
  expiresAt: string;
  viewCount?: number;
  reactionsCount?: number;
  isViewed?: boolean;
  hasReacted?: boolean;
  createdAt: string;
}

export interface StoryGroup {
  author: User;
  stories: Story[];
  hasUnviewed: boolean;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  name?: string | null;
  picture?: string | null;
  description?: string | null;
  participants: ConversationParticipant[];
  lastMessage?: Message | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationParticipant {
  conversationId: string;
  userId: string;
  user: User;
  role: ParticipantRole;
  joinedAt: string;
  isArchived: boolean;
  isPinned: boolean;
  isMuted: boolean;
  lastReadAt?: string | null;
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'profilePicture' | 'isVerified'>;
  emoji: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender: User;
  content?: string | null;
  type: MessageType;
  mediaUrl?: string | null;
  replyToId?: string | null;
  replyTo?: Message | null;
  /** ID of the story this message is a reply to (if applicable) */
  storyId?: string | null;
  isEdited: boolean;
  isDeleted: boolean;
  isPinned: boolean;
  /** User IDs who locked this message in — it persists even if sender deletes for everyone */
  lockedFor?: string[];
  reactions: MessageReaction[];
  deliveredAt?: string | null;
  readBy?: string[];
  createdAt: string;
  updatedAt: string;
  // optimistic UI fields
  _pending?: boolean;
  _failed?: boolean;
}

export interface Notification {
  id: string;
  recipientId: string;
  actorId?: string | null;
  actor?: User | null;
  type: NotificationType;
  entityType?: string | null;
  entityId?: string | null;
  content?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface MarketplaceListing {
  id: string;
  sellerId: string;
  seller: User;
  title: string;
  description: string;
  category: ListingCategory;
  price?: number | null;
  listingType: ListingType;
  images: string[];
  location?: string | null;
  servingState: string;
  status: ListingStatus;
  isBoost: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ListingReview {
  id: string;
  listingId: string;
  authorId: string;
  author: Pick<User, 'id' | 'firstName' | 'lastName' | 'profilePicture' | 'isVerified'>;
  rating: number;
  comment?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListingReviewsPage {
  items: ListingReview[];
  nextCursor: string | null;
  hasMore: boolean;
  averageRating: number;
  totalReviews: number;
}

export interface SellerApplication {
  id: string;
  userId: string;
  idDocUrl: string;
  businessName: string;
  businessDescription: string;
  whatTheySell: string;
  status: SellerApplicationStatus;
  reviewNote?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Opportunity {
  id: string;
  authorId: string;
  author: User;
  title: string;
  description: string;
  type: OpportunityType;
  companyName: string;
  location: string;
  isRemote: boolean;
  salary?: string | null;
  deadline?: string | null;
  requirements?: string | null;
  contactEmail?: string | null;
  companyWebsite?: string | null;
  isFeatured: boolean;
  isSaved?: boolean;
  hasApplied?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OpportunityApplication {
  id: string;
  opportunityId: string;
  opportunity?: Opportunity;
  applicantId: string;
  applicant?: User;
  coverLetter?: string | null;
  cvUrl?: string | null;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CallLog {
  id: string;
  callerId: string;
  caller: User;
  receiverId: string;
  receiver: User;
  type: CallType;
  status: CallStatus;
  agoraChannelName?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  duration?: number | null;
  createdAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  plan: SubscriptionPlan;
  amountKobo: number;
  startDate: string;
  endDate: string;
  paystackRef?: string | null;
  status: SubscriptionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPlanInfo {
  id: SubscriptionPlan;
  name: string;
  price: number;
  priceFormatted: string;
  currency: string;
  durationDays: number;
  features: string[];
  savings?: string;
}

export interface Session {
  id: string;
  deviceInfo?: string | null;
  ipAddress?: string | null;
  expiresAt: string;
  createdAt: string;
  isCurrent?: boolean;
}

export interface SellerProfile {
  id: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture: string | null;
    isVerified: boolean;
    servingState: string;
    stateCode: string;
  };
  businessName: string;
  businessDescription: string;
  whatTheySell: string;
  sellerStatus: import('./enums').SellerStatus;
  deactivationReason: string | null;
  averageRating: number;
  totalReviews: number;
  totalListings: number;
  createdAt: string;
  updatedAt: string;
}

export interface AppealMessage {
  id: string;
  appealId: string;
  content: string;
  senderType: 'SELLER' | 'ADMIN';
  adminId: string | null;
  admin: {
    id: string;
    firstName: string;
    lastName: string;
    department: string | null;
    profilePicture: string | null;
  } | null;
  attachmentUrl: string | null;
  attachmentName: string | null;
  createdAt: string;
}

export interface SellerAppeal {
  id: string;
  sellerId: string;
  message: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  adminResponse: string | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
  messages?: AppealMessage[];
}

export interface ListingComment {
  id: string;
  listingId: string;
  authorId: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture: string | null;
    isVerified: boolean;
  };
  parentId: string | null;
  content: string;
  bidAmount: number | null;
  isEdited: boolean;
  isDeleted: boolean;
  repliesCount?: number;
  replies?: ListingComment[];
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceConversationInfo {
  id: string;
  conversationId: string;
  listingId: string;
  listing: {
    id: string;
    title: string;
    images: string[];
    price: number | null;
    status: string;
  };
  buyerId: string;
  buyer: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture: string | null;
  };
  sellerId: string;
  seller: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture: string | null;
  };
  conversation: import('./models').Conversation;
  createdAt: string;
}

// Auth types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser extends User {
  // extra fields returned at login
}
