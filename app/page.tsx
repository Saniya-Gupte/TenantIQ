'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Shield, Brain, FileSearch, TrendingUp, Scale, FileText,
  ChevronRight, CheckCircle, AlertTriangle, BarChart3, Users
} from 'lucide-react';

const agents = [
  {
    icon: BarChart3,
    name: 'Credit Analysis Agent',
    desc: 'Evaluates credit score, debt load, bankruptcies, and financial history',
    color: '#3b82f6',
  },
  {
    icon: TrendingUp,
    name: 'Income Verification Agent',
    desc: 'Verifies income sufficiency, employment stability, and rent-to-income ratio',
    color: '#8b5cf6',
  },
  {
    icon: FileSearch,
    name: 'Rental History Agent',
    desc: 'Analyzes tenancy stability, eviction records, and landlord relationships',
    color: '#06b6d4',
  },
  {
    icon: AlertTriangle,
    name: 'Risk Assessment Agent',
    desc: 'Synthesizes all signals into a comprehensive risk profile',
    color: '#f97316',
  },
  {
    icon: Scale,
    name: 'Fair Housing Compliance Agent',
    desc: 'Ensures screening complies with Fair Housing Act requirements',
    color: '#22c55e',
  },
  {
    icon: FileText,
    name: 'Screening Report Agent',
    desc: 'Generates the final plain-English recommendation and adverse action notice',
    color: '#ec4899',
  },
];

const stats = [
  { value: '3.6M', label: 'Evictions filed annually' },
  { value: '$15K', label: 'Average cost of bad tenant' },
  { value: '6', label: 'AI agents analyze each application' },
  { value: '<60s', label: 'Average screening time' },
];


export default function LandingPage() {
  const [hoveredAgent, setHoveredAgent] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-[#0f172a]/90 backdrop-blur-md border-b border-[#1e293b]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-7 h-7 text-[#3b82f6]" />
            <span className="text-xl font-bold">TenantIQ</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-[#94a3b8] hover:text-white text-sm transition-colors">
              Dashboard
            </Link>
            <Link
              href="/apply"
              className="bg-[#3b82f6] hover:bg-[#2563eb] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Screen a Tenant
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
        {/* Gradient orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-[#3b82f6]/10 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-64 h-64 bg-[#8b5cf6]/10 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#1e293b] border border-[#334155] rounded-full px-4 py-2 text-sm text-[#94a3b8] mb-8">
            <Brain className="w-4 h-4 text-[#3b82f6]" />
            Powered by Google Gemini AI — 6 Specialized Agents
          </div>

          <h1 className="text-6xl md:text-7xl font-black mb-6 leading-tight tracking-tight">
            Screen Smarter.{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Rent Safer.
            </span>
          </h1>

          <p className="text-xl text-[#94a3b8] max-w-2xl mx-auto mb-6 leading-relaxed">
            TenantIQ deploys 6 specialized AI agents to analyze every rental application —
            income, credit, rental history, risk, and Fair Housing compliance — in under 60 seconds.
          </p>

          <div className="inline-block bg-[#1e293b] border border-[#ef4444]/30 rounded-xl px-6 py-3 text-[#ef4444] font-semibold mb-10 text-sm">
            3.6M evictions filed annually. The average bad tenant costs $15,000.
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply"
              className="group flex items-center justify-center gap-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:shadow-lg hover:shadow-[#3b82f6]/25 hover:-translate-y-0.5"
            >
              Screen a Tenant Now
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 bg-[#1e293b] hover:bg-[#334155] border border-[#334155] text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all"
            >
              <Users className="w-5 h-5" />
              View Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-6 border-y border-[#1e293b]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-4xl font-black text-[#3b82f6] mb-1">{stat.value}</div>
              <div className="text-[#64748b] text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              6 AI Agents. One Comprehensive Report.
            </h2>
            <p className="text-[#94a3b8] text-lg max-w-2xl mx-auto">
              Each agent specializes in a critical dimension of tenant risk, working sequentially
              to build a complete picture of every applicant.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent, i) => {
              const Icon = agent.icon;
              return (
                <div
                  key={i}
                  onMouseEnter={() => setHoveredAgent(i)}
                  onMouseLeave={() => setHoveredAgent(null)}
                  className="relative bg-[#1e293b] border border-[#334155] rounded-2xl p-6 cursor-default transition-all duration-300 hover:-translate-y-1"
                  style={{
                    borderColor: hoveredAgent === i ? agent.color + '60' : undefined,
                    boxShadow: hoveredAgent === i ? `0 0 30px ${agent.color}15` : undefined,
                  }}
                >
                  <div className="absolute top-4 right-4 text-[#334155] font-bold text-lg">
                    0{i + 1}
                  </div>
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: agent.color + '20' }}
                  >
                    <Icon className="w-6 h-6" style={{ color: agent.color }} />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{agent.name}</h3>
                  <p className="text-[#94a3b8] text-sm leading-relaxed">{agent.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process flow */}
      <section className="py-24 px-6 bg-[#1e293b]/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-16">How TenantIQ Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Submit Application', desc: 'Applicant fills out a comprehensive 4-step form with personal, rental, income, and financial information.', icon: FileText },
              { step: '02', title: '6 Agents Analyze', desc: 'Each specialized AI agent processes the application sequentially, analyzing different risk dimensions.', icon: Brain },
              { step: '03', title: 'Instant Report', desc: 'Receive a comprehensive screening report with a risk score, detailed findings, and a Fair Housing compliant decision.', icon: CheckCircle },
            ].map(({ step, title, desc, icon: Icon }, i) => (
              <div key={i} className="relative">
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-[#334155] to-transparent z-0" />
                )}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl bg-[#3b82f6]/10 border border-[#3b82f6]/30 flex items-center justify-center mb-4">
                    <Icon className="w-7 h-7 text-[#3b82f6]" />
                  </div>
                  <div className="text-[#3b82f6] font-bold text-sm mb-2">STEP {step}</div>
                  <h3 className="font-bold text-xl mb-3">{title}</h3>
                  <p className="text-[#94a3b8] text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-[#334155] rounded-3xl p-12">
            <Shield className="w-16 h-16 text-[#3b82f6] mx-auto mb-6" />
            <h2 className="text-4xl font-bold mb-4">Ready to Screen Smarter?</h2>
            <p className="text-[#94a3b8] text-lg mb-8">
              Stop relying on gut instinct. Let 6 specialized AI agents analyze your next applicant
              in under 60 seconds.
            </p>
            <Link
              href="/apply"
              className="group inline-flex items-center gap-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white px-10 py-4 rounded-xl font-bold text-lg transition-all hover:shadow-xl hover:shadow-[#3b82f6]/30 hover:-translate-y-0.5"
            >
              Screen a Tenant Now
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <p className="text-[#475569] text-xs mt-6">
              Demo purposes only. Real deployments connect to credit bureaus and background check APIs.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-[#1e293b]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[#475569]">
            <Shield className="w-5 h-5 text-[#3b82f6]" />
            <span className="font-semibold">TenantIQ</span>
            <span className="text-sm">— Intelligent Tenant Screening</span>
          </div>
          <p className="text-[#475569] text-xs text-center">
            For demonstration purposes only. Not legal advice. Always consult a licensed attorney for adverse action decisions.
          </p>
        </div>
      </footer>
    </div>
  );
}
