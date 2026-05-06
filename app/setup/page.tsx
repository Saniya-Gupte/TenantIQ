'use client';

import { useState } from 'react';
import { Shield, Copy, Check, DollarSign, Link2, UserCheck, Send, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SetupPage() {
  const [rent, setRent] = useState('');
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const rentNum = Number(rent);
  const isValid = rentNum > 0;
  const appLink = isValid
    ? (typeof window !== 'undefined' ? window.location.origin : '') + `/apply?rent=${rentNum}`
    : '';

  async function copyLink() {
    await navigator.clipboard.writeText(appLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function fillMySelf() {
    router.push(`/apply?rent=${rentNum}`);
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <nav className="border-b border-[#1e293b] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#3b82f6]" />
            <span className="font-bold">TenantIQ</span>
          </Link>
          <Link href="/dashboard" className="text-sm text-[#64748b] hover:text-white transition-colors">
            Dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-[#3b82f6]/10 border border-[#3b82f6]/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <DollarSign className="w-7 h-7 text-[#3b82f6]" />
          </div>
          <h1 className="text-3xl font-bold mb-3">New Tenant Screening</h1>
          <p className="text-[#94a3b8]">
            Enter the monthly rent for your unit. The income analysis will use this exact amount to calculate the applicant&apos;s rent-to-income ratio.
          </p>
        </div>

        {/* Rent input */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-7 mb-6">
          <label className="block text-sm font-medium text-[#94a3b8] mb-2">
            Monthly Rent for This Unit
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b] text-xl font-semibold">$</span>
            <input
              type="number"
              value={rent}
              onChange={e => { setRent(e.target.value); setCopied(false); }}
              placeholder="2,500"
              min="1"
              className="w-full bg-[#0f172a] border border-[#334155] rounded-xl pl-10 pr-4 py-4 text-white text-2xl font-bold placeholder-[#334155] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-colors"
            />
          </div>
          {isValid && (
            <p className="text-xs text-[#64748b] mt-2">
              Income requirement: applicant should earn at least{' '}
              <span className="text-white font-semibold">${(rentNum * 3).toLocaleString()}/month</span>{' '}
              (3× rent rule)
            </p>
          )}
        </div>

        {/* Two-path action cards — shown once rent is valid */}
        {isValid && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Option A: Share with tenant */}
            <div className="bg-[#1e293b] border border-[#334155] hover:border-[#3b82f6]/40 rounded-2xl p-6 flex flex-col transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#3b82f6]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Send className="w-5 h-5 text-[#3b82f6]" />
                </div>
                <div>
                  <h3 className="font-semibold">Send to Tenant</h3>
                  <p className="text-xs text-[#64748b]">Tenant fills out the form themselves</p>
                </div>
              </div>

              <p className="text-sm text-[#94a3b8] mb-4 leading-relaxed">
                Copy this link and share it with your applicant. The rent is locked — they can see it but cannot change it.
              </p>

              {/* Link display */}
              <div className="bg-[#0f172a] border border-[#334155] rounded-xl px-3 py-2.5 mb-3 flex items-center gap-2 min-w-0">
                <Link2 className="w-3.5 h-3.5 text-[#64748b] flex-shrink-0" />
                <span className="text-xs text-[#64748b] font-mono truncate">{appLink}</span>
              </div>

              <button
                onClick={copyLink}
                className={`mt-auto flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
                  copied
                    ? 'bg-[#22c55e]/15 border border-[#22c55e]/30 text-[#22c55e]'
                    : 'bg-[#3b82f6] hover:bg-[#2563eb] text-white'
                }`}
              >
                {copied ? (
                  <><Check className="w-4 h-4" /> Link Copied!</>
                ) : (
                  <><Copy className="w-4 h-4" /> Copy Application Link</>
                )}
              </button>
            </div>

            {/* Option B: Fill out yourself */}
            <div className="bg-[#1e293b] border border-[#334155] hover:border-[#8b5cf6]/40 rounded-2xl p-6 flex flex-col transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#8b5cf6]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <UserCheck className="w-5 h-5 text-[#8b5cf6]" />
                </div>
                <div>
                  <h3 className="font-semibold">Fill Out Myself</h3>
                  <p className="text-xs text-[#64748b]">You enter the applicant&apos;s information</p>
                </div>
              </div>

              <p className="text-sm text-[#94a3b8] mb-4 leading-relaxed">
                Open the application form directly. Useful if the tenant is present or you&apos;re entering their details on their behalf.
              </p>

              <div className="bg-[#0f172a] border border-[#334155] rounded-xl px-3 py-2.5 mb-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#64748b]">Monthly rent</span>
                  <span className="text-white font-semibold">${rentNum.toLocaleString()}/mo</span>
                </div>
              </div>

              <button
                onClick={fillMySelf}
                className="mt-auto flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm bg-[#8b5cf6] hover:bg-[#7c3aed] text-white transition-all"
              >
                Open Application Form
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Empty state hint */}
        {!isValid && (
          <p className="text-center text-[#475569] text-sm mt-2">
            Enter a rent amount above to see your options.
          </p>
        )}
      </div>
    </div>
  );
}
