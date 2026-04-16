import api from './client';
import type { ApiResponse, PaginatedData } from '@/types/api';
import type { Wallet, WalletTransaction } from '@/types/models';

/** GET /wallet/me — balance + lifetime earnings + recent transactions */
export async function getMyWallet(): Promise<Wallet> {
  const { data } = await api.get<ApiResponse<Wallet>>('/wallet/me');
  return data.data;
}

/** GET /wallet/transactions — paginated wallet transaction history */
export async function listTransactions(
  params: { cursor?: string; limit?: number } = {},
): Promise<PaginatedData<WalletTransaction>> {
  const { data } = await api.get<ApiResponse<PaginatedData<WalletTransaction>>>(
    '/wallet/transactions',
    { params },
  );
  return data.data;
}
