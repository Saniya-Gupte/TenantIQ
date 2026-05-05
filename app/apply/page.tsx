'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, ChevronRight, ChevronLeft, User, Home, Briefcase, CreditCard, Loader2, AlertCircle, X } from 'lucide-react';
import Link from 'next/link';

const STEPS = ['Personal Info', 'Rental History', 'Employment & Income', 'Financial History'];

const initialForm = {
  // Step 1
  fullName: '', email: '', phone: '', dateOfBirth: '',
  govIdType: 'drivers_license', govIdNumber: '',
  // Step 2
  currentAddress: '', timeAtCurrentAddress: '', currentMonthlyRent: '',
  reasonForMoving: '', previousAddress: '', previousLandlordName: '',
  previousLandlordPhone: '', previousLandlordEmail: '',
  // Step 3
  employmentStatus: 'employed', employerName: '', jobTitle: '',
  monthlyGrossIncome: '', yearsAtJob: '',
  additionalIncomeSource: '', additionalIncomeAmount: '',
  // Step 4
  previouslyEvicted: 'no', evictionExplanation: '',
  brokeLeaseEarly: 'no', leaseBreakExplanation: '',
  pendingBankruptcy: 'no',
  creditScoreRange: 'good',
  numberOfOccupants: '1',
  hasPets: 'no', petDetails: '',
  monthlyCarPayment: '', monthlyDebtPayments: '',
  desiredMoveInDate: '', desiredLeaseTerm: '12',
};

type FormData = typeof initialForm;

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-[#94a3b8] mb-1.5">{children}</label>;
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-3 text-white placeholder-[#475569] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-colors text-sm ${props.className || ''}`}
    />
  );
}

function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-colors text-sm ${props.className || ''}`}
    >
      {children}
    </select>
  );
}

function Textarea({ ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      rows={3}
      className={`w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-3 text-white placeholder-[#475569] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-colors text-sm resize-none ${props.className || ''}`}
    />
  );
}

function RadioGroup({ value, options, onChange }: {
  name?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-3 flex-wrap">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
            value === opt.value
              ? 'bg-[#3b82f6] border-[#3b82f6] text-white'
              : 'bg-[#0f172a] border-[#334155] text-[#94a3b8] hover:border-[#3b82f6]/50'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Step1({ form, update }: { form: FormData; update: (k: keyof FormData, v: string) => void }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <Label>Full Legal Name *</Label>
          <Input value={form.fullName} onChange={e => update('fullName', e.target.value)} placeholder="Jane Smith" required />
        </div>
        <div>
          <Label>Email Address *</Label>
          <Input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="jane@email.com" required />
        </div>
        <div>
          <Label>Phone Number *</Label>
          <Input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="(555) 555-5555" required />
        </div>
        <div>
          <Label>Date of Birth * (must be 18+)</Label>
          <Input
            type="date"
            value={form.dateOfBirth}
            onChange={e => update('dateOfBirth', e.target.value)}
            max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
            required
          />
        </div>
        <div>
          <Label>Government ID Type</Label>
          <Select value={form.govIdType} onChange={e => update('govIdType', e.target.value)}>
            <option value="drivers_license">Driver&apos;s License</option>
            <option value="passport">Passport</option>
            <option value="state_id">State ID</option>
          </Select>
        </div>
        <div>
          <Label>ID Number</Label>
          <Input value={form.govIdNumber} onChange={e => update('govIdNumber', e.target.value)} placeholder="ID number" />
        </div>
      </div>
    </div>
  );
}

function Step2({ form, update }: { form: FormData; update: (k: keyof FormData, v: string) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <Label>Current Address *</Label>
        <Input value={form.currentAddress} onChange={e => update('currentAddress', e.target.value)} placeholder="123 Main St, City, State, ZIP" required />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <Label>Time at Current Address *</Label>
          <Input value={form.timeAtCurrentAddress} onChange={e => update('timeAtCurrentAddress', e.target.value)} placeholder="e.g. 2 years 3 months" required />
        </div>
        <div>
          <Label>Current Monthly Rent ($)</Label>
          <Input type="number" value={form.currentMonthlyRent} onChange={e => update('currentMonthlyRent', e.target.value)} placeholder="1500" />
        </div>
      </div>
      <div>
        <Label>Reason for Moving *</Label>
        <Textarea value={form.reasonForMoving} onChange={e => update('reasonForMoving', e.target.value)} placeholder="Please describe your reason for moving..." required />
      </div>
      <div>
        <Label>Previous Address</Label>
        <Input value={form.previousAddress} onChange={e => update('previousAddress', e.target.value)} placeholder="Previous street address" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <Label>Previous Landlord Name</Label>
          <Input value={form.previousLandlordName} onChange={e => update('previousLandlordName', e.target.value)} placeholder="John Doe" />
        </div>
        <div>
          <Label>Previous Landlord Phone</Label>
          <Input type="tel" value={form.previousLandlordPhone} onChange={e => update('previousLandlordPhone', e.target.value)} placeholder="(555) 555-5555" />
        </div>
        <div>
          <Label>Previous Landlord Email</Label>
          <Input type="email" value={form.previousLandlordEmail} onChange={e => update('previousLandlordEmail', e.target.value)} placeholder="landlord@email.com" />
        </div>
      </div>
    </div>
  );
}

function Step3({ form, update }: { form: FormData; update: (k: keyof FormData, v: string) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <Label>Employment Status *</Label>
        <RadioGroup
          name="employmentStatus"
          value={form.employmentStatus}
          onChange={v => update('employmentStatus', v)}
          options={[
            { value: 'employed', label: 'Employed' },
            { value: 'self_employed', label: 'Self-Employed' },
            { value: 'unemployed', label: 'Unemployed' },
            { value: 'retired', label: 'Retired' },
          ]}
        />
      </div>
      {form.employmentStatus !== 'unemployed' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <Label>Employer Name</Label>
            <Input value={form.employerName} onChange={e => update('employerName', e.target.value)} placeholder="Company Inc." />
          </div>
          <div>
            <Label>Job Title</Label>
            <Input value={form.jobTitle} onChange={e => update('jobTitle', e.target.value)} placeholder="Software Engineer" />
          </div>
          <div>
            <Label>Years at Current Job</Label>
            <Input type="number" value={form.yearsAtJob} onChange={e => update('yearsAtJob', e.target.value)} placeholder="3" min="0" step="0.5" />
          </div>
        </div>
      )}
      <div>
        <Label>Monthly Gross Income ($) *</Label>
        <Input type="number" value={form.monthlyGrossIncome} onChange={e => update('monthlyGrossIncome', e.target.value)} placeholder="5000" required />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <Label>Additional Income Source</Label>
          <Input value={form.additionalIncomeSource} onChange={e => update('additionalIncomeSource', e.target.value)} placeholder="e.g. Rental income, investments" />
        </div>
        <div>
          <Label>Additional Income Amount ($/month)</Label>
          <Input type="number" value={form.additionalIncomeAmount} onChange={e => update('additionalIncomeAmount', e.target.value)} placeholder="0" />
        </div>
      </div>
    </div>
  );
}

function Step4({ form, update }: { form: FormData; update: (k: keyof FormData, v: string) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <Label>Have you ever been evicted?</Label>
        <RadioGroup name="evicted" value={form.previouslyEvicted} onChange={v => update('previouslyEvicted', v)}
          options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]} />
        {form.previouslyEvicted === 'yes' && (
          <div className="mt-3">
            <Label>Please explain</Label>
            <Textarea value={form.evictionExplanation} onChange={e => update('evictionExplanation', e.target.value)} placeholder="Explain the circumstances..." />
          </div>
        )}
      </div>

      <div>
        <Label>Have you ever broken a lease early?</Label>
        <RadioGroup name="brokelease" value={form.brokeLeaseEarly} onChange={v => update('brokeLeaseEarly', v)}
          options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]} />
        {form.brokeLeaseEarly === 'yes' && (
          <div className="mt-3">
            <Label>Please explain</Label>
            <Textarea value={form.leaseBreakExplanation} onChange={e => update('leaseBreakExplanation', e.target.value)} placeholder="Explain the circumstances..." />
          </div>
        )}
      </div>

      <div>
        <Label>Any pending bankruptcies?</Label>
        <RadioGroup name="bankruptcy" value={form.pendingBankruptcy} onChange={v => update('pendingBankruptcy', v)}
          options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]} />
      </div>

      <div>
        <Label>Self-Reported Credit Score Range</Label>
        <RadioGroup name="credit" value={form.creditScoreRange} onChange={v => update('creditScoreRange', v)}
          options={[
            { value: 'excellent', label: 'Excellent (750+)' },
            { value: 'good', label: 'Good (700–749)' },
            { value: 'fair', label: 'Fair (650–699)' },
            { value: 'poor', label: 'Poor (Below 650)' },
          ]} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <Label>Number of Occupants *</Label>
          <Select value={form.numberOfOccupants} onChange={e => update('numberOfOccupants', e.target.value)}>
            {['1','2','3','4','5','6+'].map(n => <option key={n} value={n}>{n}</option>)}
          </Select>
        </div>
        <div>
          <Label>Do you have pets?</Label>
          <RadioGroup name="pets" value={form.hasPets} onChange={v => update('hasPets', v)}
            options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]} />
          {form.hasPets === 'yes' && (
            <div className="mt-3">
              <Input value={form.petDetails} onChange={e => update('petDetails', e.target.value)} placeholder="Type, breed, and size (e.g. 1 dog, Labrador, 60lbs)" />
            </div>
          )}
        </div>
        <div>
          <Label>Monthly Car Payment ($)</Label>
          <Input type="number" value={form.monthlyCarPayment} onChange={e => update('monthlyCarPayment', e.target.value)} placeholder="0" />
        </div>
        <div>
          <Label>Other Monthly Debt Payments ($)</Label>
          <Input type="number" value={form.monthlyDebtPayments} onChange={e => update('monthlyDebtPayments', e.target.value)} placeholder="0" />
        </div>
        <div>
          <Label>Desired Move-In Date *</Label>
          <Input type="date" value={form.desiredMoveInDate} onChange={e => update('desiredMoveInDate', e.target.value)} required />
        </div>
        <div>
          <Label>Desired Lease Term</Label>
          <Select value={form.desiredLeaseTerm} onChange={e => update('desiredLeaseTerm', e.target.value)}>
            <option value="6">6 months</option>
            <option value="12">12 months</option>
            <option value="18">18 months</option>
            <option value="24">24 months</option>
            <option value="month_to_month">Month-to-Month</option>
          </Select>
        </div>
      </div>
    </div>
  );
}

const stepIcons = [User, Home, Briefcase, CreditCard];

export default function ApplyPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  function update(key: keyof FormData, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function getAge(dob: string): number {
    if (!dob) return 0;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  function validateStep(): boolean {
    setError('');
    if (step === 0) {
      if (!(form.fullName && form.email && form.phone && form.dateOfBirth)) return false;
      if (getAge(form.dateOfBirth) < 18) {
        setError('Applicant must be at least 18 years old to apply.');
        return false;
      }
      return true;
    }
    if (step === 1) return !!(form.currentAddress && form.timeAtCurrentAddress && form.reasonForMoving);
    if (step === 2) return !!(form.employmentStatus && form.monthlyGrossIncome);
    if (step === 3) return !!(form.creditScoreRange && form.numberOfOccupants && form.desiredMoveInDate);
    return true;
  }

  async function handleSubmit() {
    if (!validateStep()) {
      if (!error) setError('Please fill in all required fields.');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      // Store form data in sessionStorage for the processing page
      sessionStorage.setItem('pendingApplication', JSON.stringify(form));
      // Generate a temporary ID for the processing page
      const tempId = Date.now().toString();
      router.push(`/processing/${tempId}`);
    } catch {
      setError('Failed to submit application. Please try again.');
      setSubmitting(false);
    }
  }

  function next() {
    if (!validateStep()) {
      if (!error) setError('Please fill in all required fields.');
      return;
    }
    setError('');
    setStep(s => Math.min(s + 1, 3));
  }

  function back() {
    setError('');
    setStep(s => Math.max(s - 1, 0));
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Nav */}
      <nav className="border-b border-[#1e293b] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#3b82f6]" />
            <span className="font-bold">TenantIQ</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[#64748b]">Step {step + 1} of {STEPS.length}</span>
            <Link
              href="/"
              title="Discard and go back"
              className="flex items-center justify-center w-8 h-8 rounded-full text-[#64748b] hover:text-white hover:bg-[#334155] transition-all"
            >
              <X className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Rental Application</h1>
          <p className="text-[#64748b] text-sm">
            All information is self-reported for demonstration purposes. Real deployments connect to credit bureaus and background check APIs.
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((name, i) => {
              const Icon = stepIcons[i];
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      i < step ? 'bg-[#22c55e] border-[#22c55e]' :
                      i === step ? 'bg-[#3b82f6] border-[#3b82f6]' :
                      'bg-[#1e293b] border-[#334155]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${i <= step ? 'text-white' : 'text-[#475569]'}`} />
                  </div>
                  <span className={`text-xs hidden md:block ${i === step ? 'text-white' : 'text-[#475569]'}`}>
                    {name}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Form card */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            {(() => { const Icon = stepIcons[step]; return <Icon className="w-6 h-6 text-[#3b82f6]" />; })()}
            <h2 className="text-xl font-semibold">{STEPS[step]}</h2>
          </div>

          {step === 0 && <Step1 form={form} update={update} />}
          {step === 1 && <Step2 form={form} update={update} />}
          {step === 2 && <Step3 form={form} update={update} />}
          {step === 3 && <Step4 form={form} update={update} />}

          {error && (
            <div className="mt-4 flex items-center gap-2 text-[#ef4444] text-sm bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg px-4 py-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#334155]">
            <button
              onClick={back}
              disabled={step === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#334155] text-[#94a3b8] hover:border-[#475569] hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            {step < 3 ? (
              <button
                onClick={next}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] text-white font-medium transition-all"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] text-white font-medium transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                ) : (
                  <><Shield className="w-4 h-4" /> Submit for Screening</>
                )}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-[#475569] text-xs mt-6">
          Your information is processed securely. TenantIQ screens based on objective financial criteria only.
        </p>
      </div>
    </div>
  );
}
