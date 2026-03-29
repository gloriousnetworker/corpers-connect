import api from './client';
import type { ApiResponse, PaginatedData } from '@/types/api';
import type { Opportunity, OpportunityApplication } from '@/types/models';
import type { OpportunityType, ApplicationStatus } from '@/types/enums';

// ── Filters ───────────────────────────────────────────────────────────────────

export interface OpportunityFilters {
  type?: OpportunityType;
  isRemote?: boolean;
  search?: string;
  cursor?: string;
  limit?: number;
}

export interface ApplicationFilters {
  cursor?: string;
  limit?: number;
  status?: ApplicationStatus;
}

// ── Payloads ──────────────────────────────────────────────────────────────────

export interface CreateOpportunityPayload {
  title: string;
  description: string;
  type: OpportunityType;
  companyName: string;
  location: string;
  isRemote?: boolean;
  salary?: string;
  deadline?: string;           // ISO date string
  requirements?: string;
  contactEmail?: string;
  companyWebsite?: string;
}

export type UpdateOpportunityPayload = Partial<CreateOpportunityPayload>;

// ── Browse ─────────────────────────────────────────────────────────────────────

export async function getOpportunities(
  filters: OpportunityFilters = {}
): Promise<PaginatedData<Opportunity>> {
  const params: Record<string, string | number | boolean | undefined> = {};
  if (filters.type)             params.type     = filters.type;
  if (filters.isRemote != null) params.isRemote = filters.isRemote;
  if (filters.search)           params.search   = filters.search;
  if (filters.cursor)           params.cursor   = filters.cursor;
  params.limit = filters.limit ?? 20;

  const { data } = await api.get<ApiResponse<PaginatedData<Opportunity>>>(
    '/opportunities',
    { params }
  );
  return data.data;
}

export async function getOpportunity(id: string): Promise<Opportunity> {
  const { data } = await api.get<ApiResponse<Opportunity>>(`/opportunities/${id}`);
  return data.data;
}

// ── My posted ─────────────────────────────────────────────────────────────────

export async function getMyOpportunities(
  params: { cursor?: string; limit?: number } = {}
): Promise<PaginatedData<Opportunity>> {
  const { data } = await api.get<ApiResponse<PaginatedData<Opportunity>>>(
    '/opportunities/mine',
    { params: { cursor: params.cursor, limit: params.limit ?? 20 } }
  );
  return data.data;
}

// ── Create / Update / Delete ───────────────────────────────────────────────────

export async function createOpportunity(
  payload: CreateOpportunityPayload
): Promise<Opportunity> {
  const { data } = await api.post<ApiResponse<Opportunity>>('/opportunities', payload);
  return data.data;
}

export async function updateOpportunity(
  id: string,
  payload: UpdateOpportunityPayload
): Promise<Opportunity> {
  const { data } = await api.patch<ApiResponse<Opportunity>>(`/opportunities/${id}`, payload);
  return data.data;
}

export async function deleteOpportunity(id: string): Promise<void> {
  await api.delete(`/opportunities/${id}`);
}

// ── Save / Unsave ─────────────────────────────────────────────────────────────

export async function saveOpportunity(id: string): Promise<void> {
  await api.post(`/opportunities/${id}/save`);
}

export async function unsaveOpportunity(id: string): Promise<void> {
  await api.delete(`/opportunities/${id}/save`);
}

export async function getSavedOpportunities(
  params: { cursor?: string; limit?: number } = {}
): Promise<PaginatedData<Opportunity>> {
  const { data } = await api.get<ApiResponse<PaginatedData<Opportunity>>>(
    '/opportunities/saved',
    { params: { cursor: params.cursor, limit: params.limit ?? 20 } }
  );
  return data.data;
}

// ── Apply ─────────────────────────────────────────────────────────────────────

export async function applyToOpportunity(
  id: string,
  coverLetter?: string,
  cvFile?: File
): Promise<OpportunityApplication> {
  if (cvFile) {
    const formData = new FormData();
    if (coverLetter) formData.append('coverLetter', coverLetter);
    formData.append('cv', cvFile);
    const { data } = await api.post<ApiResponse<OpportunityApplication>>(
      `/opportunities/${id}/apply`,
      formData
    );
    return data.data;
  }

  const { data } = await api.post<ApiResponse<OpportunityApplication>>(
    `/opportunities/${id}/apply`,
    coverLetter ? { coverLetter } : {}
  );
  return data.data;
}

// ── Applications (applicant view) ─────────────────────────────────────────────

export async function getMyApplications(
  filters: ApplicationFilters = {}
): Promise<PaginatedData<OpportunityApplication>> {
  const { data } = await api.get<ApiResponse<PaginatedData<OpportunityApplication>>>(
    '/opportunities/applications/mine',
    { params: { cursor: filters.cursor, limit: filters.limit ?? 20, status: filters.status } }
  );
  return data.data;
}

// ── Applications (author view) ─────────────────────────────────────────────────

export async function getOpportunityApplications(
  opportunityId: string,
  filters: ApplicationFilters = {}
): Promise<PaginatedData<OpportunityApplication>> {
  const { data } = await api.get<ApiResponse<PaginatedData<OpportunityApplication>>>(
    `/opportunities/${opportunityId}/applications`,
    { params: { cursor: filters.cursor, limit: filters.limit ?? 20, status: filters.status } }
  );
  return data.data;
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus
): Promise<OpportunityApplication> {
  const { data } = await api.patch<ApiResponse<OpportunityApplication>>(
    `/opportunities/applications/${applicationId}/status`,
    { status }
  );
  return data.data;
}
