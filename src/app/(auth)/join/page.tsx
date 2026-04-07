'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, CheckCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Logo from '@/components/shared/Logo';
import { API_URL, NIGERIAN_STATES } from '@/lib/constants';

type FormState = 'form' | 'submitting' | 'success';

export default function JoinRequestPage() {
  const router = useRouter();
  const [state, setState] = useState<FormState>('form');
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    stateCode: '',
    servingState: '',
    lga: '',
    ppa: '',
    batch: '',
  });

  const updateField = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5MB');
      return;
    }
    setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error('Please upload your NYSC posting letter');
    if (!form.servingState) return toast.error('Please select your serving state');

    setState('submitting');

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        if (val) formData.append(key, val);
      });
      formData.append('document', file);

      const res = await fetch(`${API_URL}/api/v1/join-requests`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Submission failed');
      }

      setState('success');
    } catch (err: unknown) {
      setState('form');
      const message = err instanceof Error ? err.message : 'Something went wrong';
      toast.error(message);
    }
  };

  if (state === 'success') {
    return (
      <div className="flex flex-col px-5 pt-14 pb-8 items-center text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <CheckCircle className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Request Submitted!</h1>
        <p className="text-sm text-foreground-muted max-w-xs mb-8">
          We&apos;ll review your documents and send you an email once your request is approved. This usually takes 24-48 hours.
        </p>
        <Button fullWidth onClick={() => router.replace('/login')}>
          Back to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col px-5 pt-10 pb-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-foreground-muted mb-6 touch-manipulation"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="flex justify-center mb-6">
        <Logo size="md" />
      </div>

      <div className="space-y-1 mb-6">
        <h1 className="text-2xl font-bold text-foreground">Request to Join</h1>
        <p className="text-sm text-foreground-muted">
          Can&apos;t find your state code? Fill out this form and upload your NYSC posting letter. Once approved, you&apos;ll be able to register.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First Name"
            placeholder="e.g. Iniubong"
            required
            value={form.firstName}
            onChange={(e) => updateField('firstName', e.target.value)}
          />
          <Input
            label="Last Name"
            placeholder="e.g. Udofot"
            required
            value={form.lastName}
            onChange={(e) => updateField('lastName', e.target.value)}
          />
        </div>

        <Input
          label="Email"
          type="email"
          placeholder="your@email.com"
          required
          value={form.email}
          onChange={(e) => updateField('email', e.target.value)}
        />

        <Input
          label="Phone (optional)"
          type="tel"
          placeholder="08012345678"
          value={form.phone}
          onChange={(e) => updateField('phone', e.target.value)}
        />

        <Input
          label="NYSC State Code"
          placeholder="e.g. KG/25C/1234"
          required
          autoCapitalize="characters"
          value={form.stateCode}
          onChange={(e) => updateField('stateCode', e.target.value.toUpperCase())}
          hint="As shown on your call-up letter"
        />

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Serving State</label>
          <select
            required
            value={form.servingState}
            onChange={(e) => updateField('servingState', e.target.value)}
            className="form-input"
          >
            <option value="">Select your serving state</option>
            {NIGERIAN_STATES.map((s) => (
              <option key={s} value={`${s} State`}>{s}</option>
            ))}
          </select>
        </div>

        <Input
          label="LGA (optional)"
          placeholder="e.g. Lokoja"
          value={form.lga}
          onChange={(e) => updateField('lga', e.target.value)}
        />

        <Input
          label="PPA (optional)"
          placeholder="e.g. Federal Ministry of Health"
          value={form.ppa}
          onChange={(e) => updateField('ppa', e.target.value)}
        />

        <Input
          label="Batch"
          placeholder="e.g. 2025C"
          required
          value={form.batch}
          onChange={(e) => updateField('batch', e.target.value.toUpperCase())}
        />

        {/* Document upload */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">NYSC Posting Letter</label>
          <label className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors">
            {file ? (
              <div className="flex items-center gap-2 text-primary">
                <FileText className="w-5 h-5" />
                <span className="text-sm font-medium truncate max-w-[200px]">{file.name}</span>
              </div>
            ) : (
              <>
                <Upload className="w-6 h-6 text-foreground-muted" />
                <span className="text-sm text-foreground-muted">Tap to upload (max 5MB)</span>
                <span className="text-xs text-foreground-muted">PNG, JPG, or PDF</span>
              </>
            )}
            <input
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>

        {/* Terms */}
        <p className="text-xs text-foreground-muted leading-relaxed">
          By submitting, you confirm that the information provided is accurate and that you are a
          serving or recently passed-out NYSC corps member. False submissions may result in account suspension.
        </p>

        <Button type="submit" fullWidth isLoading={state === 'submitting'}>
          Submit Request
        </Button>
      </form>

      <p className="text-center text-sm text-foreground-muted mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-primary font-semibold">Sign in</Link>
      </p>
    </div>
  );
}
