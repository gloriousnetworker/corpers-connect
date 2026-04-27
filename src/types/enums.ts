export enum UserLevel {
  OTONDO = 'OTONDO',
  KOPA = 'KOPA',
  CORPER = 'CORPER',
}

/** Persona discriminator. CORPER is the default; MARKETER is a NIN-verified
 *  Nigerian non-corper who can only operate on the marketplace. */
export enum AccountType {
  CORPER = 'CORPER',
  MARKETER = 'MARKETER',
}

export enum MarketerStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum CorperUpgradeStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum SubscriptionTier {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM',
}

export enum SubscriptionPlan {
  MONTHLY = 'MONTHLY',
  ANNUAL = 'ANNUAL',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum PostVisibility {
  PUBLIC = 'PUBLIC',
  STATE = 'STATE',
  FRIENDS = 'FRIENDS',
  ONLY_ME = 'ONLY_ME',
}

export enum PostType {
  REGULAR = 'REGULAR',
  REEL = 'REEL',
  OPPORTUNITY = 'OPPORTUNITY',
}

export enum ReactionType {
  LIKE = 'LIKE',
  LOVE = 'LOVE',
  FIRE = 'FIRE',
  CLAP = 'CLAP',
}

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
  FILE = 'FILE',
  LOCATION = 'LOCATION',
}

export enum ConversationType {
  DM = 'DM',
  GROUP = 'GROUP',
  MARKETPLACE = 'MARKETPLACE',
}

export enum ParticipantRole {
  MEMBER = 'MEMBER',
  ADMIN = 'ADMIN',
}

export enum ListingType {
  FOR_SALE = 'FOR_SALE',
  FOR_RENT = 'FOR_RENT',
  SERVICE = 'SERVICE',
  FREE = 'FREE',
}

export enum ListingCategory {
  HOUSING = 'HOUSING',
  UNIFORM = 'UNIFORM',
  ELECTRONICS = 'ELECTRONICS',
  FOOD = 'FOOD',
  SERVICES = 'SERVICES',
  OPPORTUNITIES = 'OPPORTUNITIES',
  OTHERS = 'OTHERS',
}

export enum ListingStatus {
  ACTIVE = 'ACTIVE',
  SOLD = 'SOLD',
  INACTIVE = 'INACTIVE',
  REMOVED = 'REMOVED',
}

export enum CallType {
  VOICE = 'VOICE',
  VIDEO = 'VIDEO',
}

export enum CallStatus {
  RINGING = 'RINGING',
  ACTIVE = 'ACTIVE',
  ENDED = 'ENDED',
  REJECTED = 'REJECTED',
  MISSED = 'MISSED',
  FAILED = 'FAILED',
}

export enum NotificationType {
  FOLLOW = 'FOLLOW',
  POST_LIKE = 'POST_LIKE',
  POST_COMMENT = 'POST_COMMENT',
  COMMENT_REPLY = 'COMMENT_REPLY',
  MENTION = 'MENTION',
  DM_RECEIVED = 'DM_RECEIVED',
  CALL_MISSED = 'CALL_MISSED',
  STORY_VIEW = 'STORY_VIEW',
  MARKET_INQUIRY = 'MARKET_INQUIRY',
  LISTING_APPROVED = 'LISTING_APPROVED',
  LISTING_REJECTED = 'LISTING_REJECTED',
  LEVEL_UP = 'LEVEL_UP',
  SYSTEM = 'SYSTEM',
  BROADCAST = 'BROADCAST',
  SELLER_APPROVED = 'SELLER_APPROVED',
  SELLER_REJECTED = 'SELLER_REJECTED',
  SELLER_DEACTIVATED = 'SELLER_DEACTIVATED',
  LISTING_COMMENT = 'LISTING_COMMENT',
  MARKETPLACE_MESSAGE = 'MARKETPLACE_MESSAGE',
}

export enum SellerStatus {
  ACTIVE = 'ACTIVE',
  DEACTIVATED = 'DEACTIVATED',
}

export enum SellerApplicationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum OpportunityType {
  JOB = 'JOB',
  INTERNSHIP = 'INTERNSHIP',
  VOLUNTEER = 'VOLUNTEER',
  CONTRACT = 'CONTRACT',
  OTHER = 'OTHER',
}

export enum ApplicationStatus {
  PENDING = 'PENDING',
  REVIEWED = 'REVIEWED',
  SHORTLISTED = 'SHORTLISTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}
