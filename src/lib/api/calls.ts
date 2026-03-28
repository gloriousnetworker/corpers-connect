import api from './client';
import type { CallLog } from '@/types/models';
import type { PaginatedData } from '@/types/api';

export async function getCallHistory(params?: {
  cursor?: string;
  limit?: number;
  type?: 'VOICE' | 'VIDEO';
}): Promise<PaginatedData<CallLog>> {
  const searchParams = new URLSearchParams();
  if (params?.cursor) searchParams.set('cursor', params.cursor);
  if (params?.limit)  searchParams.set('limit', String(params.limit));
  if (params?.type)   searchParams.set('type', params.type);
  const qs = searchParams.toString();
  const { data } = await api.get<PaginatedData<CallLog>>(`/calls${qs ? `?${qs}` : ''}`);
  return data;
}

export async function refreshCallToken(callId: string): Promise<{
  token: string;
  channelName: string;
  appId: string;
}> {
  const { data } = await api.get(`/calls/${callId}/token`);
  return data;
}
