'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Wallet as WalletIcon, TrendingUp, Loader2, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { getMyWallet } from '@/lib/api/wallet';
import { queryKeys } from '@/lib/query-keys';
import { useLibraryStore } from '@/store/library.store';
import { formatRelativeTime } from '@/lib/utils';
import type { WalletTxType } from '@/types/models';

export default function WalletView() {
  const goBack = useLibraryStore((s) => s.goBack);

  const { data: wallet, isLoading } = useQuery({
    queryKey: queryKeys.wallet(),
    queryFn: () => getMyWallet(),
    staleTime: 30_000,
  });

  return (
    <div className="max-w-[680px] mx-auto pb-6">
      <div className="sticky top-0 z-20 bg-surface/95 backdrop-blur-sm border-b border-border px-3 py-2 flex items-center gap-2">
        <button onClick={goBack} className="p-2 rounded-full hover:bg-surface-alt" aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <p className="text-sm font-bold text-foreground">My Wallet</p>
      </div>

      {isLoading || !wallet ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="p-4">
          {/* Balance card */}
          <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-primary to-emerald-600 text-white p-5 shadow-lg">
            <div className="flex items-center gap-2 text-white/80 text-xs font-semibold uppercase tracking-wider">
              <WalletIcon className="w-4 h-4" />
              Available balance
            </div>
            <p className="text-4xl font-black mt-2">
              ₦{(wallet.balanceKobo / 100).toLocaleString()}
            </p>
            <div className="flex items-center gap-1.5 mt-3 text-white/80 text-xs">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>
                Lifetime: ₦{(wallet.lifetimeEarningsKobo / 100).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Payout note */}
          <div className="mt-3 p-3 rounded-xl bg-surface-alt border border-border text-xs text-foreground-secondary">
            💰 Withdrawals via Paystack Transfers are coming soon. Your earnings will accumulate here safely until they launch.
          </div>

          {/* Transactions */}
          <div className="mt-5">
            <h3 className="text-sm font-bold text-foreground mb-2">Recent activity</h3>
            {wallet.transactions.length === 0 ? (
              <p className="text-xs text-foreground-muted italic py-6 text-center">
                No transactions yet. Sell a book to see earnings here.
              </p>
            ) : (
              <ul className="divide-y divide-border/60 rounded-xl bg-surface-alt overflow-hidden">
                {wallet.transactions.map((tx) => (
                  <li key={tx.id} className="flex items-center gap-3 px-3 py-2.5">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCredit(tx.type) ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                      }`}
                    >
                      {isCredit(tx.type) ? (
                        <ArrowDownCircle className="w-4 h-4" />
                      ) : (
                        <ArrowUpCircle className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {tx.description ?? labelFor(tx.type)}
                      </p>
                      <p className="text-[10px] text-foreground-muted">
                        {formatRelativeTime(tx.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-bold flex-shrink-0 ${
                        isCredit(tx.type) ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {isCredit(tx.type) ? '+' : '-'}₦{(tx.amountKobo / 100).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function isCredit(type: WalletTxType) {
  return type === 'CREDIT_SALE' || type === 'CREDIT_BONUS';
}

function labelFor(type: WalletTxType) {
  switch (type) {
    case 'CREDIT_SALE':
      return 'Book sale';
    case 'CREDIT_BONUS':
      return 'Bonus';
    case 'DEBIT_PAYOUT':
      return 'Payout';
    case 'DEBIT_REFUND':
      return 'Refund';
  }
}
