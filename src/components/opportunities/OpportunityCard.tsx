'use client';

import Image from 'next/image';
import { MapPin, Clock, Wifi, Bookmark, BookmarkCheck, CheckCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { saveOpportunity, unsaveOpportunity } from '@/lib/api/opportunities';
import type { Opportunity } from '@/types/models';
import { OpportunityType } from '@/types/enums';
import { formatRelativeTime } from '@/lib/utils';

const TYPE_STYLE: Record<OpportunityType, { label: string; cls: string }> = {
  [OpportunityType.JOB]:        { label: 'Job',        cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  [OpportunityType.INTERNSHIP]: { label: 'Internship', cls: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' },
  [OpportunityType.VOLUNTEER]:  { label: 'Volunteer',  cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  [OpportunityType.CONTRACT]:   { label: 'Contract',   cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  [OpportunityType.OTHER]:      { label: 'Other',      cls: 'bg-muted text-muted-foreground' },
};

interface OpportunityCardProps {
  opportunity: Opportunity;
  onClick: (opp: Opportunity) => void;
}

export default function OpportunityCard({ opportunity, onClick }: OpportunityCardProps) {
  const qc = useQueryClient();
  const badge = TYPE_STYLE[opportunity.type];

  const toggleSave = useMutation({
    mutationFn: () =>
      opportunity.isSaved ? unsaveOpportunity(opportunity.id) : saveOpportunity(opportunity.id),
    onMutate: async () => {
      // Optimistic update across all queries that include this opportunity
      await qc.cancelQueries({ queryKey: ['opportunities'] });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['opportunities'] });
      qc.invalidateQueries({ queryKey: ['saved-opportunities'] });
      toast(opportunity.isSaved ? 'Removed from saved' : 'Saved to your list');
    },
    onError: () => toast.error('Could not update saved status'),
  });

  const deadline = opportunity.deadline
    ? new Date(opportunity.deadline)
    : null;
  const isExpired = deadline ? deadline < new Date() : false;

  return (
    <div
      data-testid="opportunity-card"
      className="flex flex-col gap-3 p-4 rounded-2xl border border-border bg-surface hover:bg-muted/20 transition-colors cursor-pointer"
      onClick={() => onClick(opportunity)}
    >
      {/* Top row: company logo placeholder + name + save btn */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          {/* Company logo / avatar */}
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 font-bold text-primary text-lg uppercase">
            {opportunity.companyName[0]}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-foreground text-sm truncate">{opportunity.companyName}</p>
            <p className="text-xs text-muted-foreground truncate">
              {opportunity.author.firstName} {opportunity.author.lastName}
              {opportunity.author.isVerified && (
                <CheckCircle size={10} className="inline ml-1 text-primary" />
              )}
            </p>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); toggleSave.mutate(); }}
          disabled={toggleSave.isPending}
          className="flex-shrink-0 p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-primary disabled:opacity-50"
          aria-label={opportunity.isSaved ? 'Unsave' : 'Save'}
        >
          {opportunity.isSaved
            ? <BookmarkCheck size={18} className="text-primary" />
            : <Bookmark size={18} />}
        </button>
      </div>

      {/* Title */}
      <div>
        <h3 className="font-bold text-foreground text-base leading-tight line-clamp-2">
          {opportunity.title}
        </h3>
        {opportunity.salary && (
          <p className="text-sm font-semibold text-primary mt-0.5">{opportunity.salary}</p>
        )}
      </div>

      {/* Tags row */}
      <div className="flex items-center flex-wrap gap-1.5">
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}>
          {badge.label}
        </span>
        {opportunity.isRemote && (
          <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
            <Wifi size={9} /> Remote
          </span>
        )}
        {opportunity.isFeatured && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
            ⭐ Featured
          </span>
        )}
        {opportunity.hasApplied && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
            ✓ Applied
          </span>
        )}
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1">
          <MapPin size={11} />
          {opportunity.location}
        </span>
        {deadline && (
          <span className={`flex items-center gap-1 ${isExpired ? 'text-destructive' : ''}`}>
            <Clock size={11} />
            {isExpired ? 'Expired' : `Closes ${deadline.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}`}
          </span>
        )}
        <span className="ml-auto">{formatRelativeTime(opportunity.createdAt)}</span>
      </div>
    </div>
  );
}
