'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, MapPin, Clock, Wifi, Bookmark, BookmarkCheck, Share2,
  Globe, Mail, CheckCircle, Edit2, Trash2, MoreVertical, Users, ExternalLink,
} from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  getOpportunity, saveOpportunity, unsaveOpportunity, deleteOpportunity,
} from '@/lib/api/opportunities';
import { useOpportunitiesStore } from '@/store/opportunities.store';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { OpportunityType } from '@/types/enums';
import { getAvatarUrl } from '@/lib/utils';
import ApplyModal from './ApplyModal';

const TYPE_STYLE: Record<OpportunityType, { label: string; cls: string }> = {
  [OpportunityType.JOB]:        { label: 'Full-time Job',  cls: 'bg-blue-100 text-blue-700'    },
  [OpportunityType.INTERNSHIP]: { label: 'Internship',     cls: 'bg-violet-100 text-violet-700' },
  [OpportunityType.VOLUNTEER]:  { label: 'Volunteer',      cls: 'bg-emerald-100 text-emerald-700' },
  [OpportunityType.CONTRACT]:   { label: 'Contract',       cls: 'bg-amber-100 text-amber-700'   },
  [OpportunityType.OTHER]:      { label: 'Opportunity',    cls: 'bg-muted text-muted-foreground' },
};

export default function OpportunityDetail() {
  const qc = useQueryClient();
  const { selectedOpportunity, goBack, setView, viewApplicationsFor } = useOpportunitiesStore();
  const user = useAuthStore((s) => s.user);
  const setViewingUser = useUIStore((s) => s.setViewingUser);
  const [menuOpen, setMenuOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const { data: opp, isLoading } = useQuery({
    queryKey: ['opportunity', selectedOpportunity?.id],
    queryFn: () => getOpportunity(selectedOpportunity!.id),
    enabled: !!selectedOpportunity,
    initialData: selectedOpportunity ?? undefined,
  });

  const saveMutation = useMutation({
    mutationFn: () => opp?.isSaved ? unsaveOpportunity(opp.id) : saveOpportunity(opp!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['opportunities'] });
      qc.invalidateQueries({ queryKey: ['opportunity', opp?.id] });
      qc.invalidateQueries({ queryKey: ['saved-opportunities'] });
      toast(opp?.isSaved ? 'Removed from saved' : 'Saved to your list');
    },
    onError: () => toast.error('Could not update saved status'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteOpportunity(opp!.id),
    onSuccess: () => {
      toast.success('Opportunity deleted');
      qc.invalidateQueries({ queryKey: ['opportunities'] });
      qc.invalidateQueries({ queryKey: ['my-opportunities'] });
      goBack();
    },
    onError: () => toast.error('Failed to delete opportunity'),
  });

  const handleShare = useCallback(async () => {
    if (!opp) return;
    const text = `${opp.title} at ${opp.companyName} — Corpers Connect`;
    if (navigator.share) {
      await navigator.share({ title: opp.title, text });
    } else {
      await navigator.clipboard.writeText(text);
      toast('Copied to clipboard');
    }
  }, [opp]);

  if (isLoading || !opp) {
    return (
      <div className="flex flex-col min-h-full">
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border">
          <button onClick={goBack}><ArrowLeft size={22} /></button>
        </div>
        <div className="p-4 space-y-3 animate-pulse">
          <div className="h-6 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-24 bg-muted rounded" />
        </div>
      </div>
    );
  }

  const isAuthor = user?.id === opp.authorId;
  const badge = TYPE_STYLE[opp.type];
  const deadline = opp.deadline ? new Date(opp.deadline) : null;
  const isExpired = deadline ? deadline < new Date() : false;

  return (
    <div className="flex flex-col min-h-full">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
        <button onClick={goBack} className="text-foreground hover:text-primary transition-colors">
          <ArrowLeft size={22} />
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={handleShare}
            className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground"
          >
            <Share2 size={18} />
          </button>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground disabled:opacity-50"
          >
            {opp.isSaved
              ? <BookmarkCheck size={18} className="text-primary" />
              : <Bookmark size={18} />}
          </button>
          {isAuthor && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground"
              >
                <MoreVertical size={18} />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-20 bg-surface border border-border rounded-xl shadow-lg py-1 w-44 overflow-hidden">
                    <button
                      onClick={() => { setMenuOpen(false); setView('edit'); }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-foreground hover:bg-muted"
                    >
                      <Edit2 size={15} /> Edit
                    </button>
                    <button
                      onClick={() => { setMenuOpen(false); viewApplicationsFor(opp.id); }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-foreground hover:bg-muted"
                    >
                      <Users size={15} /> View Applications
                    </button>
                    <button
                      onClick={() => { setMenuOpen(false); setDeleteConfirm(true); }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-destructive hover:bg-muted"
                    >
                      <Trash2 size={15} /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-5 space-y-5">
        {/* Company + title */}
        <div className="flex gap-4 items-start">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary flex-shrink-0 uppercase">
            {opp.companyName[0]}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium">{opp.companyName}</p>
            <h1 className="text-xl font-bold text-foreground leading-tight mt-0.5">{opp.title}</h1>
            {opp.salary && (
              <p className="text-base font-bold text-primary mt-1">{opp.salary}</p>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.cls}`}>
            {badge.label}
          </span>
          {opp.isRemote && (
            <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-100 text-teal-700">
              <Wifi size={10} /> Remote
            </span>
          )}
          {opp.isFeatured && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary text-primary-foreground">
              ⭐ Featured
            </span>
          )}
          {opp.hasApplied && (
            <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle size={10} /> Applied
            </span>
          )}
        </div>

        {/* Quick info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin size={14} className="flex-shrink-0" />
            <span className="truncate">{opp.location}</span>
          </div>
          {deadline && (
            <div className={`flex items-center gap-2 text-sm ${isExpired ? 'text-destructive' : 'text-muted-foreground'}`}>
              <Clock size={14} className="flex-shrink-0" />
              <span>{isExpired ? 'Expired' : `Closes ${deadline.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}`}</span>
            </div>
          )}
          {opp.contactEmail && (
            <a
              href={`mailto:${opp.contactEmail}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 text-sm text-primary hover:underline col-span-2"
            >
              <Mail size={14} className="flex-shrink-0" />
              {opp.contactEmail}
            </a>
          )}
          {opp.companyWebsite && (
            <a
              href={opp.companyWebsite}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 text-sm text-primary hover:underline col-span-2"
            >
              <Globe size={14} className="flex-shrink-0" />
              <span className="truncate">{opp.companyWebsite}</span>
              <ExternalLink size={12} className="flex-shrink-0" />
            </a>
          )}
        </div>

        {/* Description */}
        <div>
          <h2 className="font-bold text-foreground mb-2">About this opportunity</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {opp.description}
          </p>
        </div>

        {/* Requirements */}
        {opp.requirements && (
          <div>
            <h2 className="font-bold text-foreground mb-2">Requirements</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {opp.requirements}
            </p>
          </div>
        )}

        {/* Posted by */}
        <div
          className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors"
          onClick={() => setViewingUser(opp.authorId, 'opportunities')}
        >
          {opp.author.profilePicture ? (
            <Image
              src={getAvatarUrl(opp.author.profilePicture, 80)}
              alt={opp.author.firstName}
              width={40}
              height={40}
              className="rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold flex-shrink-0">
              {opp.author.firstName[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground flex items-center gap-1">
              {opp.author.firstName} {opp.author.lastName}
              {opp.author.isVerified && (
                <CheckCircle size={13} className="text-primary flex-shrink-0" />
              )}
            </p>
            <p className="text-xs text-muted-foreground">Posted this opportunity</p>
          </div>
          <ArrowLeft size={15} className="text-muted-foreground rotate-180 flex-shrink-0" />
        </div>
      </div>

      {/* CTA */}
      {!isAuthor && !opp.hasApplied && !isExpired && (
        <div className="sticky bottom-0 bg-surface border-t border-border px-4 py-4">
          <button
            onClick={() => setApplyOpen(true)}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            Apply Now
          </button>
        </div>
      )}

      {!isAuthor && opp.hasApplied && (
        <div className="sticky bottom-0 bg-surface border-t border-border px-4 py-4">
          <div className="w-full py-3.5 rounded-xl bg-emerald-100 text-emerald-700 font-semibold text-sm flex items-center justify-center gap-2">
            <CheckCircle size={18} /> Application Submitted
          </div>
        </div>
      )}

      {isAuthor && (
        <div className="sticky bottom-0 bg-surface border-t border-border px-4 py-4">
          <button
            onClick={() => viewApplicationsFor(opp.id)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            <Users size={18} /> View Applications
          </button>
        </div>
      )}

      {/* Apply modal */}
      {applyOpen && (
        <ApplyModal
          opportunity={opp}
          onClose={() => setApplyOpen(false)}
          onSuccess={() => {
            // Refresh detail data to show hasApplied
            qc.invalidateQueries({ queryKey: ['opportunity', opp.id] });
          }}
        />
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-sm space-y-4 border border-border">
            <h3 className="font-bold text-foreground">Delete opportunity?</h3>
            <p className="text-sm text-muted-foreground">
              All applications will also be deleted. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => { setDeleteConfirm(false); deleteMutation.mutate(); }}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 disabled:opacity-60"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
