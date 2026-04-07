'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, CheckCircle, FileText, ChevronRight, User, MapPin, FileUp } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Logo from '@/components/shared/Logo';
import { API_URL, NIGERIAN_STATES } from '@/lib/constants';

type Step = 1 | 2 | 3 | 4;
type SubmitState = 'idle' | 'submitting' | 'success';

const STEP_LABELS = ['Personal Info', 'NYSC Details', 'Upload Document'];

export default function JoinRequestPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
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

  const validateStep1 = () => {
    if (!form.firstName.trim()) return toast.error('First name is required');
    if (!form.lastName.trim()) return toast.error('Last name is required');
    if (!form.email.trim()) return toast.error('Email is required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return toast.error('Enter a valid email');
    setStep(2);
  };

  const validateStep2 = () => {
    if (!form.stateCode.trim()) return toast.error('State code is required');
    if (!form.servingState) return toast.error('Please select your serving state');
    if (!form.batch.trim()) return toast.error('Batch is required');
    setStep(3);
  };

  const validateStep3 = () => {
    if (!file) return toast.error('Please upload your NYSC posting letter');
    setStep(4);
  };

  const handleSubmit = async () => {
    setSubmitState('submitting');

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        if (val) formData.append(key, val);
      });
      formData.append('document', file!);

      const res = await fetch(`${API_URL}/api/v1/join-requests`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Submission failed');
      }

      setSubmitState('success');
    } catch (err: unknown) {
      setSubmitState('idle');
      const message = err instanceof Error ? err.message : 'Something went wrong';
      toast.error(message);
    }
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (submitState === 'success') {
    return (
      <div className="flex flex-col px-5 pt-14 pb-8 items-center text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <CheckCircle className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Request Submitted!</h1>
        <p className="text-sm text-foreground-muted max-w-xs mb-2">
          We&apos;ve sent a confirmation to <strong className="text-foreground">{form.email}</strong>.
        </p>
        <p className="text-sm text-foreground-muted max-w-xs mb-8">
          We&apos;ll review your documents and notify you once approved. This usually takes 24-48 hours.
        </p>
        <Button fullWidth onClick={() => router.replace('/login')}>
          Back to Login
        </Button>
      </div>
    );
  }

  // ── Step progress bar ───────────────────────────────────────────────────────
  const progressStep = Math.min(step, 3);

  const StepProgress = () => (
    <div className="mb-6">
      <div className="flex gap-2 mb-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              s <= progressStep ? 'bg-primary' : 'bg-surface-alt'
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-foreground-muted">
        Step {progressStep} of 3 — {STEP_LABELS[progressStep - 1]}
      </p>
    </div>
  );

  // ── Back button logic ───────────────────────────────────────────────────────
  const handleBack = () => {
    if (step === 1) router.back();
    else setStep((step - 1) as Step);
  };

  // ── Step 1: Personal Info ───────────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="flex flex-col px-5 pt-10 pb-8">
        <button onClick={handleBack} className="flex items-center gap-1.5 text-sm text-foreground-muted mb-6 touch-manipulation">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="flex justify-center mb-6">
          <Logo size="md" />
        </div>

        <div className="space-y-1 mb-4">
          <h1 className="text-2xl font-bold text-foreground">Request to Join</h1>
          <p className="text-sm text-foreground-muted">
            Can&apos;t find your state code? Complete these steps and upload your NYSC posting letter.
          </p>
        </div>

        <StepProgress />

        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-base font-semibold text-foreground">Personal Information</h2>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name *"
              placeholder="e.g. Iniubong"
              value={form.firstName}
              onChange={(e) => updateField('firstName', e.target.value)}
            />
            <Input
              label="Last Name *"
              placeholder="e.g. Udofot"
              value={form.lastName}
              onChange={(e) => updateField('lastName', e.target.value)}
            />
          </div>

          <Input
            label="Email *"
            type="email"
            placeholder="your@email.com"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
            hint="The email used to register for NYSC"
          />

          <Input
            label="Phone (optional)"
            type="tel"
            placeholder="08012345678"
            value={form.phone}
            onChange={(e) => updateField('phone', e.target.value)}
          />

          <Button fullWidth onClick={validateStep1} className="mt-2">
            Continue <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <p className="text-center text-sm text-foreground-muted mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-primary font-semibold">Sign in</Link>
        </p>
      </div>
    );
  }

  // ── Step 2: NYSC Details ────────────────────────────────────────────────────
  if (step === 2) {
    return (
      <div className="flex flex-col px-5 pt-10 pb-8">
        <button onClick={handleBack} className="flex items-center gap-1.5 text-sm text-foreground-muted mb-6 touch-manipulation">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <StepProgress />

        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-base font-semibold text-foreground">NYSC Details</h2>
        </div>

        <div className="space-y-4">
          <Input
            label="NYSC State Code *"
            placeholder="e.g. KG/25C/1234"
            autoCapitalize="characters"
            value={form.stateCode}
            onChange={(e) => updateField('stateCode', e.target.value.toUpperCase())}
            hint="As shown on your call-up letter"
          />

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Serving State <span className="text-error">*</span>
            </label>
            <select
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
            label="Batch *"
            placeholder="e.g. 2025C"
            value={form.batch}
            onChange={(e) => updateField('batch', e.target.value.toUpperCase())}
          />

          <Button fullWidth onClick={validateStep2} className="mt-2">
            Continue <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  // ── Step 3: Document Upload ─────────────────────────────────────────────────
  if (step === 3) {
    return (
      <div className="flex flex-col px-5 pt-10 pb-8">
        <button onClick={handleBack} className="flex items-center gap-1.5 text-sm text-foreground-muted mb-6 touch-manipulation">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <StepProgress />

        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <FileUp className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-base font-semibold text-foreground">Upload Document</h2>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              NYSC Posting Letter <span className="text-error">*</span>
            </label>
            <label className="flex flex-col items-center gap-2 p-8 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors">
              {file ? (
                <div className="flex items-center gap-2 text-primary">
                  <FileText className="w-5 h-5" />
                  <span className="text-sm font-medium truncate max-w-[200px]">{file.name}</span>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-foreground-muted" />
                  <span className="text-sm font-medium text-foreground-muted">Tap to upload your posting letter</span>
                  <span className="text-xs text-foreground-muted">PNG, JPG, or PDF — max 5MB</span>
                </>
              )}
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
            {file && (
              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-xs text-error hover:underline"
              >
                Remove file
              </button>
            )}
          </div>

          <p className="text-xs text-foreground-muted leading-relaxed">
            Upload a clear photo or scan of your NYSC posting/call-up letter. This helps us verify your identity.
          </p>

          <Button fullWidth onClick={validateStep3} className="mt-2">
            Review Details <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  // ── Step 4: Review & Submit ─────────────────────────────────────────────────
  return (
    <div className="flex flex-col px-5 pt-10 pb-8">
      <button onClick={handleBack} className="flex items-center gap-1.5 text-sm text-foreground-muted mb-6 touch-manipulation">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="space-y-1 mb-6">
        <h1 className="text-xl font-bold text-foreground">Review Your Details</h1>
        <p className="text-sm text-foreground-muted">
          Please confirm everything is correct before submitting.
        </p>
      </div>

      <div className="space-y-4">
        {/* Personal Info */}
        <div className="bg-surface-alt rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Personal Information</h3>
            <button onClick={() => setStep(1)} className="text-xs text-primary font-medium hover:underline">Edit</button>
          </div>
          <div className="space-y-2 text-sm">
            <Row label="Name" value={`${form.firstName} ${form.lastName}`} />
            <Row label="Email" value={form.email} />
            {form.phone && <Row label="Phone" value={form.phone} />}
          </div>
        </div>

        {/* NYSC Details */}
        <div className="bg-surface-alt rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">NYSC Details</h3>
            <button onClick={() => setStep(2)} className="text-xs text-primary font-medium hover:underline">Edit</button>
          </div>
          <div className="space-y-2 text-sm">
            <Row label="State Code" value={form.stateCode} />
            <Row label="Serving State" value={form.servingState} />
            {form.lga && <Row label="LGA" value={form.lga} />}
            {form.ppa && <Row label="PPA" value={form.ppa} />}
            <Row label="Batch" value={form.batch} />
          </div>
        </div>

        {/* Document */}
        <div className="bg-surface-alt rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Document</h3>
            <button onClick={() => setStep(3)} className="text-xs text-primary font-medium hover:underline">Change</button>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-foreground truncate">{file?.name}</span>
            <span className="text-foreground-muted text-xs ml-auto whitespace-nowrap">
              {file && `${(file.size / 1024).toFixed(0)} KB`}
            </span>
          </div>
        </div>

        {/* Terms */}
        <p className="text-xs text-foreground-muted leading-relaxed">
          By submitting, you confirm that the information provided is accurate and that you are a
          serving or recently passed-out NYSC corps member. False submissions may result in account suspension.
        </p>

        <Button fullWidth onClick={handleSubmit} isLoading={submitState === 'submitting'}>
          Submit Request
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-foreground-muted">{label}</span>
      <span className="text-foreground font-medium text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}
