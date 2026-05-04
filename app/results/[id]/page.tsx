'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Shield, BarChart3, TrendingUp, FileSearch, AlertTriangle, Scale, FileText,
  CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp, Copy, Printer
} from 'lucide-react';
import { getScoreLabel, getRecommendationStyle, formatDate } from '@/lib/utils';

interface AgentCard {
  key: string;
  name: string;
  icon: React.ElementType;
  color: string;
  score: number;
  findings: string[];
  redFlags: string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildAgentCards(agentResults: any): AgentCard[] {
  if (!agentResults) return [];
  return [
    {
      key: 'credit', name: 'Credit Analysis Agent', icon: BarChart3, color: '#3b82f6',
      score: agentResults.credit?.creditScore ?? 0,
      findings: agentResults.credit?.findings ?? [],
      redFlags: agentResults.credit?.redFlags ?? [],
    },
    {
      key: 'income', name: 'Income Verification Agent', icon: TrendingUp, color: '#8b5cf6',
      score: agentResults.income?.incomeScore ?? 0,
      findings: agentResults.income?.findings ?? [],
      redFlags: agentResults.income?.redFlags ?? [],
    },
    {
      key: 'rental', name: 'Rental History Agent', icon: FileSearch, color: '#06b6d4',
      score: agentResults.rentalHistory?.rentalScore ?? 0,
      findings: agentResults.rentalHistory?.findings ?? [],
      redFlags: agentResults.rentalHistory?.redFlags ?? [],
    },
    {
      key: 'risk', name: 'Risk Assessment Agent', icon: AlertTriangle, color: '#f97316',
      score: agentResults.riskAssessment?.riskScore ?? 0,
      findings: agentResults.riskAssessment?.findings ?? [],
      redFlags: [],
    },
    {
      key: 'fairhousing', name: 'Fair Housing Compliance', icon: Scale, color: '#22c55e',
      score: agentResults.fairHousing?.complianceStatus === 'compliant' ? 100 : 60,
      findings: agentResults.fairHousing?.auditFindings ?? [],
      redFlags: agentResults.fairHousing?.complianceStatus !== 'compliant' ? ['Review required'] : [],
    },
    {
      key: 'report', name: 'Screening Report Agent', icon: FileText, color: '#ec4899',
      score: agentResults.screeningReport?.overallScore ?? 0,
      findings: agentResults.screeningReport?.conditions?.length
        ? agentResults.screeningReport.conditions
        : ['Report generated successfully'],
      redFlags: [],
    },
  ];
}

function ScoreGauge({ score }: { score: number }) {
  const { color } = getScoreLabel(score);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-40 h-40 mx-auto">
      <svg className="w-40 h-40 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="#1e293b" strokeWidth="10" />
        <circle
          cx="60" cy="60" r="54" fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black" style={{ color }}>{score}</span>
        <span className="text-[#64748b] text-xs">/ 100</span>
      </div>
    </div>
  );
}

function AgentCardComponent({ agent }: { agent: AgentCard }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = agent.icon;
  const { color } = getScoreLabel(agent.score);

  return (
    <div className="bg-[#1e293b] border border-[#334155] rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-5 hover:bg-[#334155]/20 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: agent.color + '20' }}>
          <Icon className="w-5 h-5" style={{ color: agent.color }} />
        </div>
        <div className="flex-1">
          <div className="font-medium text-sm text-white">{agent.name}</div>
          {agent.redFlags.length > 0 && (
            <div className="text-xs text-[#ef4444] flex items-center gap-1 mt-0.5">
              <AlertCircle className="w-3 h-3" />
              {agent.redFlags.length} red flag{agent.redFlags.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-2xl font-bold" style={{ color }}>{agent.score}</span>
          {expanded ? <ChevronUp className="w-4 h-4 text-[#64748b]" /> : <ChevronDown className="w-4 h-4 text-[#64748b]" />}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-[#334155]">
          {agent.findings.length > 0 && (
            <div className="mt-4">
              <div className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-2">Key Findings</div>
              <ul className="space-y-1.5">
                {agent.findings.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#94a3b8]">
                    <CheckCircle className="w-3.5 h-3.5 text-[#22c55e] mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {agent.redFlags.length > 0 && (
            <div className="mt-4">
              <div className="text-xs font-semibold text-[#ef4444] uppercase tracking-wider mb-2">Red Flags</div>
              <ul className="space-y-1.5">
                {agent.redFlags.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#ef4444]">
                    <XCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ScoreBreakdown({ agentResults }: { agentResults: any }) {
  if (!agentResults) return null;

  const bars = [
    { label: 'Income (30%)', score: agentResults.income?.incomeScore ?? 0, color: '#8b5cf6', weight: 0.30 },
    { label: 'Rental History (25%)', score: agentResults.rentalHistory?.rentalScore ?? 0, color: '#06b6d4', weight: 0.25 },
    { label: 'Credit & Financial (20%)', score: agentResults.credit?.creditScore ?? 0, color: '#3b82f6', weight: 0.20 },
    { label: 'Risk Assessment (15%)', score: agentResults.riskAssessment?.riskScore ?? 0, color: '#f97316', weight: 0.15 },
    { label: 'App Completeness (10%)', score: 85, color: '#22c55e', weight: 0.10 },
  ];

  return (
    <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6">
      <h3 className="font-semibold mb-5 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-[#3b82f6]" />
        Score Breakdown
      </h3>
      <div className="space-y-4">
        {bars.map(bar => (
          <div key={bar.label}>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-[#94a3b8]">{bar.label}</span>
              <span className="font-semibold" style={{ color: bar.color }}>{bar.score}</span>
            </div>
            <div className="h-2 bg-[#334155] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${bar.score}%`, backgroundColor: bar.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ResultsPage({ params }: { params: { id: string } }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check localStorage first (persists across sessions)
    const stored = localStorage.getItem(`tenantiq_result_${params.id}`);
    if (stored) {
      try {
        setResult(JSON.parse(stored));
        setLoading(false);
        return;
      } catch {
        // fall through to API
      }
    }

    // Fall back to Supabase via API
    fetch(`/api/applications/${params.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.id) {
          const result = {
            id: data.id,
            agentResults: data.agent_results,
            overallScore: data.overall_score,
            recommendation: data.recommendation,
            applicantName: data.applicant_name,
            createdAt: data.created_at,
          };
          // Cache it locally so future loads are instant
          localStorage.setItem(`tenantiq_result_${data.id}`, JSON.stringify(result));
          setResult(result);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#3b82f6] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#64748b]">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-[#ef4444] mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Results Not Found</h2>
          <p className="text-[#64748b] mb-6">This screening result could not be loaded.</p>
          <Link href="/apply" className="bg-[#3b82f6] hover:bg-[#2563eb] text-white px-6 py-3 rounded-lg font-medium">
            New Application
          </Link>
        </div>
      </div>
    );
  }

  const { agentResults, overallScore, recommendation, applicantName, createdAt } = result;
  const scoreInfo = getScoreLabel(overallScore);
  const recStyle = getRecommendationStyle(recommendation);
  const agentCards = buildAgentCards(agentResults);
  const screeningReport = agentResults?.screeningReport;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <nav className="border-b border-[#1e293b] px-6 py-4 print:hidden">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#3b82f6]" />
            <span className="font-bold">TenantIQ</span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={copyLink}
              className="flex items-center gap-2 px-4 py-2 bg-[#1e293b] border border-[#334155] rounded-lg text-sm text-[#94a3b8] hover:text-white hover:border-[#475569] transition-all"
            >
              <Copy className="w-4 h-4" />
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-[#1e293b] border border-[#334155] rounded-lg text-sm text-[#94a3b8] hover:text-white hover:border-[#475569] transition-all"
            >
              <Printer className="w-4 h-4" />
              Print Report
            </button>
            <Link href="/dashboard" className="text-sm text-[#64748b] hover:text-white transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Score header */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-8 mb-6">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <ScoreGauge score={overallScore} />
            <div className="flex-1 text-center md:text-left">
              <div
                className="inline-block px-4 py-1.5 rounded-full text-sm font-bold mb-3"
                style={{ color: recStyle.color, backgroundColor: recStyle.bg, border: `1px solid ${recStyle.border}` }}
              >
                {recommendation}
              </div>
              <h1 className="text-3xl font-bold mb-1">{applicantName}</h1>
              <p style={{ color: scoreInfo.color }} className="text-lg font-semibold mb-1">{scoreInfo.label}</p>
              {createdAt && (
                <p className="text-[#64748b] text-sm">Screened on {formatDate(createdAt)}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 md:ml-auto">
              {[
                { label: 'Income Score', value: agentResults?.income?.incomeScore ?? 0, color: '#8b5cf6' },
                { label: 'Rental Score', value: agentResults?.rentalHistory?.rentalScore ?? 0, color: '#06b6d4' },
                { label: 'Credit Score', value: agentResults?.credit?.creditScore ?? 0, color: '#3b82f6' },
                { label: 'Risk Score', value: agentResults?.riskAssessment?.riskScore ?? 0, color: '#f97316' },
              ].map(item => (
                <div key={item.label} className="bg-[#0f172a] rounded-xl p-4 text-center min-w-[90px]">
                  <div className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</div>
                  <div className="text-[#64748b] text-xs mt-1">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gemini explanation */}
        {screeningReport?.explanation && (
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 mb-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#3b82f6]" />
              AI Analysis Summary
            </h3>
            <p className="text-[#94a3b8] leading-relaxed">{screeningReport.explanation}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            {/* Agent result cards */}
            <h3 className="font-semibold text-lg mb-4">Agent Results</h3>
            <div className="space-y-3">
              {agentCards.map(agent => (
                <AgentCardComponent key={agent.key} agent={agent} />
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <ScoreBreakdown agentResults={agentResults} />

            {/* Compliance */}
            {agentResults?.fairHousing && (
              <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-[#22c55e]" />
                  Fair Housing Status
                </h4>
                <div className={`text-sm font-medium px-3 py-1.5 rounded-lg inline-block mb-3 ${
                  agentResults.fairHousing.complianceStatus === 'compliant'
                    ? 'bg-[#22c55e]/10 text-[#22c55e]'
                    : 'bg-[#f97316]/10 text-[#f97316]'
                }`}>
                  {agentResults.fairHousing.complianceStatus?.toUpperCase()}
                </div>
                {agentResults.fairHousing.complianceNotes?.map((note: string, i: number) => (
                  <p key={i} className="text-xs text-[#64748b] mb-1">{note}</p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action card */}
        <div
          className="rounded-2xl p-6 border"
          style={{ backgroundColor: recStyle.bg, borderColor: recStyle.border }}
        >
          {recommendation === 'APPROVE' && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-[#22c55e]" />
                <h3 className="text-lg font-bold text-[#22c55e]">Recommended for Approval</h3>
              </div>
              <p className="text-[#94a3b8] mb-4 text-sm">
                This applicant meets your screening criteria. You may proceed with lease preparation, final identity verification, and collection of first month&apos;s rent and security deposit.
              </p>
              <div className="flex flex-wrap gap-3">
                {['Verify identity documents', 'Collect security deposit', 'Prepare lease agreement', 'Schedule move-in inspection'].map(step => (
                  <span key={step} className="bg-[#22c55e]/20 text-[#22c55e] text-xs px-3 py-1.5 rounded-full">{step}</span>
                ))}
              </div>
            </>
          )}

          {recommendation === 'CONDITIONAL' && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-[#f97316]" />
                <h3 className="text-lg font-bold text-[#f97316]">Conditional Approval</h3>
              </div>
              <p className="text-[#94a3b8] mb-4 text-sm">
                This applicant may qualify with additional conditions. Review the requirements below before proceeding.
              </p>
              {screeningReport?.conditions?.length > 0 && (
                <ul className="space-y-2">
                  {screeningReport.conditions.map((c: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#94a3b8]">
                      <span className="text-[#f97316] font-bold mt-0.5">{i + 1}.</span>
                      {c}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {recommendation === 'DECLINE' && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <XCircle className="w-6 h-6 text-[#ef4444]" />
                <h3 className="text-lg font-bold text-[#ef4444]">Application Declined</h3>
              </div>
              {screeningReport?.adverseActionNotice ? (
                <div>
                  <p className="text-xs text-[#64748b] uppercase tracking-wider font-semibold mb-2">Adverse Action Notice (Fair Housing Compliant)</p>
                  <p className="text-sm text-[#94a3b8] leading-relaxed bg-[#0f172a]/50 rounded-lg p-4">
                    {screeningReport.adverseActionNotice}
                  </p>
                </div>
              ) : (
                <p className="text-[#94a3b8] text-sm">
                  This application does not meet the screening criteria. Consult your attorney before issuing an adverse action notice.
                </p>
              )}
            </>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-4 justify-between items-center">
          <div className="text-xs text-[#475569]">
            TenantIQ is for demonstration purposes only. All data is self-reported. Not legal advice.
            Consult legal counsel before adverse action decisions.
          </div>
          <div className="flex gap-3">
            <Link href="/apply" className="text-sm bg-[#1e293b] border border-[#334155] hover:border-[#475569] text-[#94a3b8] hover:text-white px-4 py-2 rounded-lg transition-all">
              New Application
            </Link>
            <Link href="/dashboard" className="text-sm bg-[#3b82f6] hover:bg-[#2563eb] text-white px-4 py-2 rounded-lg transition-all">
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
