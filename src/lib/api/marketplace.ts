import api from './client';
import type { ApiResponse, PaginatedData } from '@/types/api';
import type { MarketplaceListing, SellerApplication, ListingReview, ListingReviewsPage, SellerProfile, SellerAppeal, AppealMessage, ListingComment, MarketplaceConversationInfo } from '@/types/models';
import type { ListingType, ListingCategory, ListingStatus } from '@/types/enums';

// ── Filters ───────────────────────────────────────────────────────────────

export interface ListingFilters {
  category?: ListingCategory;
  listingType?: ListingType;
  state?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  cursor?: string;
  limit?: number;
}

// ── Inquiry ───────────────────────────────────────────────────────────────

export interface InquiryResult {
  inquiry: {
    id: string;
    listingId: string;
    buyerId: string;
    conversationId: string;
    createdAt: string;
  };
  listingTitle: string;
  sellerId: string;
  conversationId: string;
}

export interface ListingInquiry {
  id: string;
  listingId: string;
  buyerId: string;
  buyer: import('@/types/models').User;
  conversationId: string;
  createdAt: string;
}

// ── Create / Update payloads ───────────────────────────────────────────────

export interface CreateListingPayload {
  title: string;
  description: string;
  category: ListingCategory;
  price?: number;
  listingType: ListingType;
  location?: string;
  images: File[];
}

export interface UpdateListingPayload {
  title?: string;
  description?: string;
  category?: ListingCategory;
  price?: number;
  listingType?: ListingType;
  location?: string;
  status?: ListingStatus;
}

// ── Browse ─────────────────────────────────────────────────────────────────

export async function getListings(
  filters: ListingFilters = {}
): Promise<PaginatedData<MarketplaceListing>> {
  const params: Record<string, string | number | undefined> = {};
  if (filters.category)    params.category    = filters.category;
  if (filters.listingType) params.listingType = filters.listingType;
  if (filters.state)       params.state       = filters.state;
  if (filters.search)      params.search      = filters.search;
  if (filters.minPrice != null) params.minPrice = filters.minPrice;
  if (filters.maxPrice != null) params.maxPrice = filters.maxPrice;
  if (filters.cursor)      params.cursor      = filters.cursor;
  if (filters.limit)       params.limit       = filters.limit ?? 20;

  const { data } = await api.get<ApiResponse<PaginatedData<MarketplaceListing>>>(
    '/marketplace/listings',
    { params }
  );
  return data.data;
}

export async function getListing(id: string): Promise<MarketplaceListing> {
  const { data } = await api.get<ApiResponse<MarketplaceListing>>(
    `/marketplace/listings/${id}`
  );
  return data.data;
}

// ── My listings ────────────────────────────────────────────────────────────

export async function getMyListings(
  params: { cursor?: string; limit?: number } = {}
): Promise<PaginatedData<MarketplaceListing>> {
  const { data } = await api.get<ApiResponse<PaginatedData<MarketplaceListing>>>(
    '/marketplace/my-listings',
    { params: { cursor: params.cursor, limit: params.limit ?? 20 } }
  );
  return data.data;
}

// ── Create ─────────────────────────────────────────────────────────────────

export async function createListing(
  payload: CreateListingPayload
): Promise<MarketplaceListing> {
  const formData = new FormData();
  formData.append('title',       payload.title);
  formData.append('description', payload.description);
  formData.append('category',    payload.category);
  formData.append('listingType', payload.listingType);
  if (payload.price != null) formData.append('price', String(payload.price));
  if (payload.location)      formData.append('location', payload.location);
  payload.images.forEach((f) => formData.append('images', f));

  const { data } = await api.post<ApiResponse<MarketplaceListing>>(
    '/marketplace/listings',
    formData
  );
  return data.data;
}

// ── Update ─────────────────────────────────────────────────────────────────

export async function updateListing(
  id: string,
  payload: UpdateListingPayload
): Promise<MarketplaceListing> {
  const { data } = await api.patch<ApiResponse<MarketplaceListing>>(
    `/marketplace/listings/${id}`,
    payload
  );
  return data.data;
}

// ── Delete ─────────────────────────────────────────────────────────────────

export async function deleteListing(id: string): Promise<void> {
  await api.delete(`/marketplace/listings/${id}`);
}

// ── Inquire ────────────────────────────────────────────────────────────────

export async function inquireListing(listingId: string): Promise<InquiryResult> {
  const { data } = await api.post<ApiResponse<InquiryResult>>(
    `/marketplace/listings/${listingId}/inquire`
  );
  return data.data;
}

export async function getListingInquiries(
  listingId: string
): Promise<ListingInquiry[]> {
  const { data } = await api.get<ApiResponse<ListingInquiry[]>>(
    `/marketplace/listings/${listingId}/inquiries`
  );
  return data.data;
}

// ── Seller application ─────────────────────────────────────────────────────

export async function applyAsSeller(payload: {
  idDoc: File;
  businessName: string;
  businessDescription: string;
  whatTheySell: string;
}): Promise<SellerApplication> {
  const formData = new FormData();
  formData.append('idDoc', payload.idDoc);
  formData.append('businessName', payload.businessName);
  formData.append('businessDescription', payload.businessDescription);
  formData.append('whatTheySell', payload.whatTheySell);

  const { data } = await api.post<ApiResponse<SellerApplication>>(
    '/marketplace/apply',
    formData
  );
  return data.data;
}

// ── Reviews ────────────────────────────────────────────────────────────────

export async function getListingReviews(
  listingId: string,
  params: { cursor?: string; limit?: number } = {}
): Promise<ListingReviewsPage> {
  const { data } = await api.get<ApiResponse<ListingReviewsPage>>(
    `/marketplace/listings/${listingId}/reviews`,
    { params: { cursor: params.cursor, limit: params.limit ?? 20 } }
  );
  return data.data;
}

export async function createListingReview(
  listingId: string,
  payload: { rating: number; comment?: string }
): Promise<ListingReview> {
  const { data } = await api.post<ApiResponse<ListingReview>>(
    `/marketplace/listings/${listingId}/reviews`,
    payload
  );
  return data.data;
}

export async function deleteListingReview(
  listingId: string,
  reviewId: string
): Promise<void> {
  await api.delete(`/marketplace/listings/${listingId}/reviews/${reviewId}`);
}

export async function getMyApplication(): Promise<SellerApplication | null> {
  try {
    const { data } = await api.get<ApiResponse<SellerApplication>>(
      '/marketplace/my-application'
    );
    return data.data;
  } catch {
    return null;
  }
}

// ── Seller Profile ────────────────────────────────────────────────────────

export async function getSellerProfile(userId: string): Promise<SellerProfile> {
  const { data } = await api.get<ApiResponse<SellerProfile>>(`/marketplace/sellers/${userId}`);
  return data.data;
}

export async function getSellerListings(userId: string, params: { cursor?: string; limit?: number } = {}): Promise<PaginatedData<MarketplaceListing>> {
  const { data } = await api.get<ApiResponse<PaginatedData<MarketplaceListing>>>(`/marketplace/sellers/${userId}/listings`, { params });
  return data.data;
}

export async function getMySellerProfile(): Promise<SellerProfile | null> {
  try {
    const { data } = await api.get<ApiResponse<SellerProfile>>('/marketplace/my-seller-profile');
    return data.data;
  } catch { return null; }
}

// ── Comments / Bidding ────────────────────────────────────────────────────

export async function getListingComments(listingId: string, params: { cursor?: string; limit?: number } = {}): Promise<PaginatedData<ListingComment>> {
  const { data } = await api.get<ApiResponse<PaginatedData<ListingComment>>>(`/marketplace/listings/${listingId}/comments`, { params });
  return data.data;
}

export async function createListingComment(listingId: string, payload: { content: string; bidAmount?: number; parentId?: string }): Promise<ListingComment> {
  const { data } = await api.post<ApiResponse<ListingComment>>(`/marketplace/listings/${listingId}/comments`, payload);
  return data.data;
}

export async function updateListingComment(listingId: string, commentId: string, payload: { content: string; bidAmount?: number }): Promise<ListingComment> {
  const { data } = await api.patch<ApiResponse<ListingComment>>(`/marketplace/listings/${listingId}/comments/${commentId}`, payload);
  return data.data;
}

export async function deleteListingComment(listingId: string, commentId: string): Promise<void> {
  await api.delete(`/marketplace/listings/${listingId}/comments/${commentId}`);
}

// ── Marketplace Conversations ─────────────────────────────────────────────

export async function startMarketplaceChat(listingId: string): Promise<MarketplaceConversationInfo> {
  const { data } = await api.post<ApiResponse<MarketplaceConversationInfo>>(`/marketplace/listings/${listingId}/chat`);
  return data.data;
}

export async function getMarketplaceConversations(params: { cursor?: string; limit?: number } = {}): Promise<PaginatedData<MarketplaceConversationInfo>> {
  const { data } = await api.get<ApiResponse<PaginatedData<MarketplaceConversationInfo>>>('/marketplace/conversations', { params });
  return data.data;
}

export async function getMarketplaceConversation(conversationId: string): Promise<MarketplaceConversationInfo> {
  const { data } = await api.get<ApiResponse<MarketplaceConversationInfo>>(`/marketplace/conversations/${conversationId}`);
  return data.data;
}

// ── Seller Appeals ─────────────────────────────────────────────────────────

export async function submitSellerAppeal(message: string): Promise<SellerAppeal> {
  const { data } = await api.post<ApiResponse<SellerAppeal>>('/marketplace/my-seller-profile/appeal', { message });
  return data.data;
}

export async function getMyAppeals(): Promise<SellerAppeal[]> {
  const { data } = await api.get<ApiResponse<SellerAppeal[]>>('/marketplace/my-seller-profile/appeals');
  return data.data;
}

export async function replyToAppeal(appealId: string, content: string): Promise<AppealMessage> {
  const { data } = await api.post<ApiResponse<AppealMessage>>(
    `/marketplace/my-seller-profile/appeals/${appealId}/reply`,
    { content }
  );
  return data.data;
}
