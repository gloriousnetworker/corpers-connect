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
  isViewed?: boolean;
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
  isEdited: boolean;
  isDeleted: boolean;
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

export interface SellerApplication {
  id: string;
  userId: string;
  idDocUrl: string;
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

// Auth types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser extends User {
  // extra fields returned at login
}
