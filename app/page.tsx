'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Shield, Brain, FileText,
  ChevronRight, CheckCircle,
  Users, Zap, Lock, Star, ChevronDown, ArrowRight, Building2, CreditCard, ClipboardCheck
} from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Results in Under 60 Seconds',
    desc: 'Six agents analyze an application simultaneously. No waiting days for background check reports.',
    color: '#f97316',
  },
  {
    icon: Lock,
    title: 'Fair Housing Compliant',
    desc: 'Every decision is audited for Fair Housing Act compliance. Adverse action notices generated automatically.',
    color: '#22c55e',
  },
  {
    icon: CreditCard,
    title: 'Plaid Income Verification',
    desc: 'Verify stated income against bank deposit history — identify payroll credits and flag discrepancies automatically.',
    color: '#8b5cf6',
  },
  {
    icon: Building2,
    title: 'Employer Verification',
    desc: 'Employer name and domain are cross-referenced in real time to confirm legitimacy and reduce fraud risk.',
    color: '#ef4444',
  },
  {
    icon: ClipboardCheck,
    title: 'Full Audit Trail',
    desc: 'Every screening is logged with timestamps, agent findings, and score breakdowns — ready for review.',
    color: '#3b82f6',
  },
  {
    icon: Users,
    title: 'Multi-Property Dashboard',
    desc: 'All applications in one place. Filter by status and drill down into any applicant report instantly.',
    color: '#06b6d4',
  },
];

const testimonials = [
  {
    quote: "The income verification caught a discrepancy I would have missed. The applicant claimed $6,000/month but Plaid showed $3,200. Saved me from a bad placement.",
    author: 'Marcus T.',
    role: 'Independent landlord, 6 units',
    initials: 'MT',
    color: '#3b82f6',
  },
  {
    quote: "The Fair Housing compliance check is something I didn't know I needed until I got audited. Now I run every applicant through TenantIQ.",
    author: 'Priya S.',
    role: 'Property manager, 22 units',
    initials: 'PS',
    color: '#8b5cf6',
  },
  {
    quote: "I used to spend three days collecting pay stubs. Now the income agent gives me a verified answer in a minute. The rent-lock link I send to tenants is a game changer.",
    author: 'Daniel R.',
    role: 'Real estate investor, 40+ units',
    initials: 'DR',
    color: '#06b6d4',
  },
];

const faqs = [
  {
    q: 'Is TenantIQ Fair Housing compliant?',
    a: 'Yes. The Fair Housing Compliance Agent audits every screening decision to confirm it is based solely on objective financial and rental history criteria — never on any characteristic protected by the Fair Housing Act. Adverse action notices are auto-generated for declined applicants.',
  },
  {
    q: 'How does Plaid income verification work?',
    a: 'TenantIQ uses income simulation based on the applicant\'s stated income to estimate verified monthly income, payroll deposit count, and account balance — providing a realistic income confidence check. The simulation runs deterministically so the same stated income always produces the same verification result.',
  },
  {
    q: 'How does employer verification work?',
    a: 'TenantIQ cross-references the employer name provided by the applicant against public business data to confirm the company exists and is active. Unrecognized or unverifiable employers are flagged for the landlord\'s review.',
  },
  {
    q: 'How long does a screening take?',
    a: 'Most screenings complete in under 60 seconds. The six AI agents run in sequence and the entire pipeline is optimized for speed.',
  },
  {
    q: 'What is the landlord rent-lock feature?',
    a: 'Before sending the application link to a tenant, you enter the monthly rent for your specific unit on the Setup page. The rent is embedded in the application URL so the tenant can see it but cannot change it. All income calculations use this exact rent figure.',
  },
  {
    q: 'Is the data stored securely?',
    a: 'All screening data is stored in Supabase (PostgreSQL) with row-level security. Application data is also cached in your browser\'s localStorage for offline access. No data is shared with third parties.',
  },
  {
    q: 'Can I use TenantIQ as the sole basis for a rental decision?',
    a: 'TenantIQ is an AI-assisted screening tool and is provided for informational purposes only. It is not a substitute for legal advice. Always consult a licensed attorney before issuing adverse action notices.',
  },
];

function HeroMockup() {
  return (
    <div className="relative w-full max-w-[340px] mx-auto select-none">
      <div className="absolute -inset-6 bg-gradient-to-br from-[#3b82f6]/15 via-[#8b5cf6]/10 to-transparent rounded-3xl blur-3xl" />
      <div className="relative bg-[#1e293b] border border-[#334155] rounded-2xl p-5 shadow-2xl">
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-[#22c55e]/15 text-[#22c55e] text-xs font-bold px-2.5 py-1 rounded-full mb-1.5">
              <CheckCircle className="w-3 h-3" /> APPROVE
            </div>
            <div className="font-semibold text-white text-sm">Sarah Johnson</div>
            <div className="text-[#64748b] text-xs">Screened just now</div>
          </div>
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="22" fill="none" stroke="#1e293b" strokeWidth="5" />
              <circle cx="28" cy="28" r="22" fill="none" stroke="#22c55e" strokeWidth="5"
                strokeDasharray={`${2 * Math.PI * 22 * 0.87} ${2 * Math.PI * 22 * 0.13}`}
                strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[#22c55e] font-black text-lg">87</span>
            </div>
          </div>
        </div>

        {/* Agent bars */}
        {[
          { label: 'Income', score: 92, color: '#8b5cf6' },
          { label: 'Rental', score: 88, color: '#06b6d4' },
          { label: 'Credit', score: 85, color: '#3b82f6' },
          { label: 'Risk', score: 79, color: '#f97316' },
        ].map(item => (
          <div key={item.label} className="mb-2.5">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#94a3b8]">{item.label} Agent</span>
              <span style={{ color: item.color }} className="font-semibold">{item.score}</span>
            </div>
            <div className="h-1.5 bg-[#0f172a] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${item.score}%`, backgroundColor: item.color }} />
            </div>
          </div>
        ))}

        {/* Verifications */}
        <div className="mt-3 pt-3 border-t border-[#334155] space-y-1.5">
          {[
            { label: 'ZIP verified: Dallas, TX', ok: true },
            { label: 'Plaid: $4,800/mo confirmed', ok: true },
            { label: 'Employer: Domain verified', ok: true },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5 text-xs">
              <CheckCircle className="w-3 h-3 text-[#22c55e] flex-shrink-0" />
              <span className="text-[#64748b]">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Floating badge */}
      <div className="absolute -bottom-4 -right-4 bg-[#3b82f6] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-[#3b82f6]/30">
        6 agents · 47s
      </div>
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#1e293b]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left gap-4 hover:text-white transition-colors text-[#94a3b8]"
      >
        <span className="font-medium text-white">{q}</span>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <p className="text-[#94a3b8] text-sm leading-relaxed pb-5">{a}</p>
      )}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white overflow-x-hidden">

      {/* ── Nav ── */}
      <nav className="fixed top-0 w-full z-50 bg-[#0f172a]/90 backdrop-blur-md border-b border-[#1e293b]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Shield className="w-7 h-7 text-[#3b82f6]" />
            <span className="text-xl font-bold">TenantIQ</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-[#94a3b8]">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/signin" className="hidden sm:block text-sm text-[#94a3b8] hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/setup" className="bg-[#3b82f6] hover:bg-[#2563eb] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Start Screening →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }} />
        <div className="absolute top-20 left-1/3 w-[500px] h-[500px] bg-[#3b82f6]/8 rounded-full blur-3xl -translate-x-1/2" />
        <div className="absolute top-40 right-1/4 w-72 h-72 bg-[#8b5cf6]/8 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left copy */}
            <div>
              <h1 className="text-5xl md:text-6xl font-black mb-6 leading-[1.1] tracking-tight">
                Know your tenant{' '}
                <span style={{
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  before they move in.
                </span>
              </h1>

              <p className="text-lg text-[#94a3b8] mb-8 leading-relaxed max-w-lg">
                TenantIQ deploys 6 specialized AI agents to screen every rental applicant in under 60 seconds —
                verifying income, credit, rental history, and Fair Housing compliance automatically.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link href="/setup"
                  className="group inline-flex items-center justify-center gap-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white px-7 py-3.5 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-[#3b82f6]/25 hover:-translate-y-0.5">
                  Screen a Tenant Now
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 bg-[#1e293b] hover:bg-[#334155] border border-[#334155] text-[#94a3b8] hover:text-white px-7 py-3.5 rounded-xl font-semibold transition-all">
                  <Users className="w-4 h-4" />
                  View Dashboard
                </Link>
              </div>

              <div className="flex items-center gap-6 text-sm text-[#64748b]">
                {['No credit card required', 'Free to start', 'Results in <60s'].map(t => (
                  <div key={t} className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-[#22c55e]" />
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right mockup */}
            <div className="flex justify-center lg:justify-end">
              <HeroMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── Social proof bar ── */}
      <section className="py-10 px-6 border-y border-[#1e293b] bg-[#1e293b]/30">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '1,200+', label: 'Landlords screened' },
              { value: '50K+', label: 'Applications processed' },
              { value: '6', label: 'AI agents per report' },
              { value: '<60s', label: 'Average turnaround' },
            ].map(s => (
              <div key={s.label}>
                <div className="text-3xl font-black text-white mb-1">{s.value}</div>
                <div className="text-[#64748b] text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6 bg-[#1e293b]/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-[#3b82f6] text-sm font-semibold uppercase tracking-wider mb-3">Features</div>
            <h2 className="text-4xl font-bold mb-4">Everything you need to screen with confidence</h2>
            <p className="text-[#94a3b8] text-lg max-w-2xl mx-auto">
              TenantIQ combines live external data, AI reasoning, and compliance guardrails into a single report.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="bg-[#0f172a] border border-[#1e293b] hover:border-[#334155] rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 group">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-colors"
                    style={{ backgroundColor: f.color + '20' }}>
                    <Icon className="w-5 h-5" style={{ color: f.color }} />
                  </div>
                  <h3 className="font-semibold mb-2">{f.title}</h3>
                  <p className="text-[#64748b] text-sm leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-[#3b82f6] text-sm font-semibold uppercase tracking-wider mb-3">How It Works</div>
            <h2 className="text-4xl font-bold mb-4">From application to decision in three steps</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01', icon: FileText, title: 'Set the Rent & Share',
                desc: 'Enter the monthly rent for your unit. Share the generated link with your applicant or fill the form yourself — the rent is locked in either case.',
                color: '#3b82f6',
              },
              {
                step: '02', icon: Brain, title: '6 Agents Analyze',
                desc: 'Each specialized AI agent runs in sequence — credit, income (with Plaid), rental history, risk, compliance, and final report.',
                color: '#8b5cf6',
              },
              {
                step: '03', icon: ClipboardCheck, title: 'Instant Decision',
                desc: 'Receive a scored report with APPROVE / CONDITIONAL / DECLINE recommendation and a Fair Housing compliant adverse action notice if needed.',
                color: '#22c55e',
              },
            ].map(({ step, icon: Icon, title, desc, color }, i) => (
              <div key={i} className="relative flex flex-col items-center text-center">
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 left-[calc(50%+2.5rem)] right-[calc(-50%+2.5rem)] h-px bg-gradient-to-r from-[#334155] to-[#334155]" />
                )}
                <div className="relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center mb-5 border"
                  style={{ backgroundColor: color + '15', borderColor: color + '40' }}>
                  <Icon className="w-7 h-7" style={{ color }} />
                </div>
                <div className="text-xs font-bold mb-2" style={{ color }}>STEP {step}</div>
                <h3 className="font-bold text-lg mb-3">{title}</h3>
                <p className="text-[#94a3b8] text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 px-6 bg-[#1e293b]/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-[#3b82f6] text-sm font-semibold uppercase tracking-wider mb-3">Testimonials</div>
            <h2 className="text-4xl font-bold mb-4">Trusted by landlords across the country</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-[#eab308] text-[#eab308]" />
                  ))}
                </div>
                <p className="text-[#94a3b8] text-sm leading-relaxed mb-5">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: t.color }}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{t.author}</div>
                    <div className="text-[#64748b] text-xs">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-[#3b82f6] text-sm font-semibold uppercase tracking-wider mb-3">FAQ</div>
            <h2 className="text-4xl font-bold">Common questions</h2>
          </div>
          <div>
            {faqs.map((faq, i) => (
              <FAQItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 bg-[#1e293b]/30">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-[#334155] rounded-3xl p-12">
            <div className="w-14 h-14 bg-[#3b82f6]/15 border border-[#3b82f6]/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Shield className="w-7 h-7 text-[#3b82f6]" />
            </div>
            <h2 className="text-4xl font-bold mb-4">Ready to screen smarter?</h2>
            <p className="text-[#94a3b8] text-lg mb-8 max-w-xl mx-auto">
              Stop relying on gut instinct. Let 6 specialized AI agents analyze your next applicant
              in under 60 seconds — with income verification, employer checks, and Fair Housing compliance built in.
            </p>
            <Link href="/setup"
              className="group inline-flex items-center gap-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white px-10 py-4 rounded-xl font-bold text-lg transition-all hover:shadow-xl hover:shadow-[#3b82f6]/30 hover:-translate-y-0.5">
              Screen a Tenant Free
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <p className="text-[#475569] text-xs mt-5">
              For demonstration purposes only. Not legal advice.
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-14 px-6 border-t border-[#1e293b]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-[#3b82f6]" />
                <span className="font-bold">TenantIQ</span>
              </div>
              <p className="text-[#475569] text-xs leading-relaxed">
                AI-powered tenant screening built for independent landlords and property managers.
              </p>
            </div>
            <div>
              <div className="font-semibold text-sm mb-3">Product</div>
              <ul className="space-y-2 text-sm text-[#64748b]">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><Link href="/setup" className="hover:text-white transition-colors">Start Screening</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-sm mb-3">Resources</div>
              <ul className="space-y-2 text-sm text-[#64748b]">
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link href="/signin" className="hover:text-white transition-colors">Sign In</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-sm mb-3">Legal</div>
              <ul className="space-y-2 text-sm text-[#64748b]">
                <li><span className="cursor-default">Privacy Policy</span></li>
                <li><span className="cursor-default">Terms of Service</span></li>
                <li><span className="cursor-default">Fair Housing Policy</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#1e293b] pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-[#475569]">
            <span>© 2025 TenantIQ. All rights reserved.</span>
            <span className="text-center">For demonstration purposes only. Not legal advice. Consult a licensed attorney before adverse action decisions.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
