'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateOpportunity } from '@/lib/api/opportunities';
import { useOpportunitiesStore } from '@/store/opportunities.store';
import { OpportunityType } from '@/types/enums';

const TYPES = [
  { value: OpportunityType.JOB,        label: '💼 Full-time Job' },
  { value: OpportunityType.INTERNSHIP, label: '🎓 Internship'    },
  { value: OpportunityType.VOLUNTEER,  label: '🤝 Volunteer'     },
  { value: OpportunityType.CONTRACT,   label: '📋 Contract'      },
  { value: OpportunityType.OTHER,      label: '🌐 Other'         },
];

export default function EditOpportunityForm() {
  const qc = useQueryClient();
  const { selectedOpportunity, goBack, selectOpportunity } = useOpportunitiesStore();
  const opp = selectedOpportunity;

  const [title, setTitle]             = useState(opp?.title ?? '');
  const [description, setDescription] = useState(opp?.description ?? '');
  const [type, setType]               = useState<OpportunityType>(opp?.type ?? OpportunityType.JOB);
  const [companyName, setCompanyName] = useState(opp?.companyName ?? '');
  const [location, setLocation]       = useState(opp?.location ?? '');
  const [isRemote, setIsRemote]       = useState(opp?.isRemote ?? false);
  const [salary, setSalary]           = useState(opp?.salary ?? '');
  const [deadline, setDeadline]       = useState(
    opp?.deadline ? new Date(opp.deadline).toISOString().split('T')[0] : ''
  );
  const [requirements, setRequirements] = useState(opp?.requirements ?? '');
  const [contactEmail, setContactEmail] = useState(opp?.contactEmail ?? '');
  const [companyWebsite, setCompanyWebsite] = useState(opp?.companyWebsite ?? '');

  const mutation = useMutation({
    mutationFn: () =>
      updateOpportunity(opp!.id, {
        title, description, type, companyName, location, isRemote,
        salary: salary || undefined,
        deadline: deadline || undefined,
        requirements: requirements || undefined,
        contactEmail: contactEmail || undefined,
        companyWebsite: companyWebsite || undefined,
      }),
    onSuccess: (updated) => {
      toast.success('Opportunity updated!');
      qc.invalidateQueries({ queryKey: ['opportunities'] });
      qc.invalidateQueries({ queryKey: ['my-opportunities'] });
      qc.invalidateQueries({ queryKey: ['opportunity', opp?.id] });
      selectOpportunity(updated);
    },
    onError: (err: Error) => toast.error(err.message ?? 'Failed to update opportunity'),
  });

  if (!opp) { goBack(); return null; }

  const canSubmit = title.trim() && description.trim() && companyName.trim() && location.trim();
  const inputCls = 'w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm';
  const labelCls = 'text-sm font-semibold text-foreground';

  return (
    <div className="flex flex-col min-h-full">
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={goBack} className="text-foreground hover:text-primary">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-bold text-foreground text-lg flex-1">Edit Opportunity</h1>
      </div>

      <div className="px-4 py-5 space-y-5 flex-1">
        {/* Type */}
        <div>
          <label className={`${labelCls} block mb-2`}>Type</label>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={[
                  'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                  type === t.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-transparent text-foreground border-border hover:bg-muted',
                ].join(' ')}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelCls}>Job Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} className={inputCls} />
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelCls}>Company / Organisation</label>
          <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} maxLength={200} className={inputCls} />
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelCls}>Location</label>
          <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={200} className={inputCls} />
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input type="checkbox" checked={isRemote} onChange={(e) => setIsRemote(e.target.checked)} className="w-4 h-4 rounded accent-primary" />
            <span className="text-sm text-foreground">Remote opportunity</span>
          </label>
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelCls}>Salary / Stipend</label>
          <input type="text" value={salary} onChange={(e) => setSalary(e.target.value)} maxLength={100} className={inputCls} />
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelCls}>Application Deadline</label>
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} min={new Date().toISOString().split('T')[0]} className={inputCls} />
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelCls}>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} maxLength={5000} className={`${inputCls} resize-none`} />
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelCls}>Requirements</label>
          <textarea value={requirements} onChange={(e) => setRequirements(e.target.value)} rows={3} maxLength={3000} className={`${inputCls} resize-none`} />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className={labelCls}>Contact Email</label>
            <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className={inputCls} />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelCls}>Company Website</label>
            <input type="url" value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} className={inputCls} />
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 bg-surface border-t border-border px-4 py-4">
        <button
          onClick={() => mutation.mutate()}
          disabled={!canSubmit || mutation.isPending}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {mutation.isPending && <Loader2 size={18} className="animate-spin" />}
          {mutation.isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
