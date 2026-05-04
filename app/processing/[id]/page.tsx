'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, BarChart3, TrendingUp, FileSearch, AlertTriangle, Scale, FileText, CheckCircle, Loader2, Clock } from 'lucide-react';
import Link from 'next/link';

const AGENTS = [
  { id: 'credit', name: 'Credit Analysis Agent', icon: BarChart3, desc: 'Analyzing credit history, debt load, and financial risk...', color: '#3b82f6' },
  { id: 'income', name: 'Income Verification Agent', icon: TrendingUp, desc: 'Verifying income sufficiency and employment stability...', color: '#8b5cf6' },
  { id: 'rental', name: 'Rental History Agent', icon: FileSearch, desc: 'Reviewing rental history and tenancy stability...', color: '#06b6d4' },
  { id: 'risk', name: 'Risk Assessment Agent', icon: AlertTriangle, desc: 'Synthesizing all signals into comprehensive risk profile...', color: '#f97316' },
  { id: 'fairhousing', name: 'Fair Housing Compliance Agent', icon: Scale, desc: 'Ensuring screening meets Fair Housing Act requirements...', color: '#22c55e' },
  { id: 'report', name: 'Screening Report Agent', icon: FileText, desc: 'Generating final recommendation and adverse action notice...', color: '#ec4899' },
];

type AgentStatus = 'pending' | 'analyzing' | 'complete';

interface ScreeningResult {
  id: string;
  createdAt: string;
  applicantName: string;
  overallScore: number;
  recommendation: string;
  agentResults: unknown;
}

interface AppSummary {
  id: string;
  created_at: string;
  applicant_name: string;
  applicant_email: string;
  overall_score: number;
  recommendation: string;
  status: string;
}

function persistResult(result: ScreeningResult, appData: { email?: string }) {
  localStorage.setItem(`tenantiq_result_${result.id}`, JSON.stringify(result));

  const existing: AppSummary[] = JSON.parse(localStorage.getItem('tenantiq_applications') || '[]');
  const summary: AppSummary = {
    id: result.id,
    created_at: result.createdAt,
    applicant_name: result.applicantName,
    applicant_email: appData.email || '',
    overall_score: result.overallScore,
    recommendation: result.recommendation,
    status: 'complete',
  };
  const updated = [summary, ...existing.filter(a => a.id !== result.id)];
  localStorage.setItem('tenantiq_applications', JSON.stringify(updated));
}

export default function ProcessingPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentStatus>>({});
  const [, setCurrentAgentIndex] = useState(-1);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [error, setError] = useState('');
  const [resultId, setResultId] = useState('');
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const appDataRaw = sessionStorage.getItem('pendingApplication');
    if (!appDataRaw) {
      router.push('/apply');
      return;
    }

    async function runScreening() {
      try {
        const parsedData = JSON.parse(appDataRaw!);

        // Animate agents while waiting for API response
        const animateAgents = (idx: number) => {
          setCurrentAgentIndex(idx);
          setAgentStatuses(prev => ({ ...prev, [AGENTS[idx].id]: 'analyzing' }));
        };

        animateAgents(0);

        // Stagger subsequent agent transitions (UI only)
        const agentTimers: ReturnType<typeof setTimeout>[] = [];
        for (let i = 1; i < AGENTS.length; i++) {
          const delay = i * 1800 + Math.random() * 400;
          agentTimers.push(setTimeout(() => {
            setAgentStatuses(prev => ({ ...prev, [AGENTS[i - 1].id]: 'complete' }));
            if (i < AGENTS.length) {
              setCurrentAgentIndex(i);
              setAgentStatuses(prev => ({ ...prev, [AGENTS[i].id]: 'analyzing' }));
            }
          }, delay));
        }

        const response = await fetch('/api/screen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsedData),
        });

        agentTimers.forEach(t => clearTimeout(t));

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Screening failed');
        }

        const result = await response.json();

        // Mark all agents complete
        const allComplete: Record<string, AgentStatus> = {};
        AGENTS.forEach(a => { allComplete[a.id] = 'complete'; });
        setAgentStatuses(allComplete);
        setCurrentAgentIndex(AGENTS.length);

        // Persist to localStorage (survives tab close / navigation)
        persistResult(result, parsedData);

        sessionStorage.removeItem('pendingApplication');
        setResultId(result.id);

        setTimeout(() => {
          router.push(`/results/${result.id}`);
        }, 1500);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Screening failed. Please try again.');
      }
    }

    runScreening();

    const countdown = setInterval(() => {
      setTimeRemaining(t => {
        if (t <= 1) { clearInterval(countdown); return 0; }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [router, params.id]);

  const completedCount = Object.values(agentStatuses).filter(s => s === 'complete').length;
  const progress = (completedCount / AGENTS.length) * 100;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <nav className="border-b border-[#1e293b] px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <Shield className="w-6 h-6 text-[#3b82f6]" />
            <span className="font-bold">TenantIQ</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {error ? (
          <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-2xl p-8 text-center">
            <div className="text-[#ef4444] text-xl font-semibold mb-3">Screening Error</div>
            <p className="text-[#94a3b8] mb-6">{error}</p>
            <Link href="/apply" className="inline-block bg-[#3b82f6] hover:bg-[#2563eb] text-white px-6 py-3 rounded-lg font-medium">
              Try Again
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#3b82f6]/10 border border-[#3b82f6]/30 rounded-2xl mb-4">
                {completedCount === AGENTS.length ? (
                  <CheckCircle className="w-8 h-8 text-[#22c55e]" />
                ) : (
                  <Loader2 className="w-8 h-8 text-[#3b82f6] animate-spin" />
                )}
              </div>
              <h1 className="text-3xl font-bold mb-2">
                {completedCount === AGENTS.length ? 'Analysis Complete!' : 'Analyzing Application'}
              </h1>
              <p className="text-[#64748b]">
                {completedCount === AGENTS.length
                  ? 'Redirecting to your results...'
                  : '6 specialized AI agents are reviewing this application'}
              </p>
            </div>

            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#64748b]">{completedCount} of {AGENTS.length} agents complete</span>
                <div className="flex items-center gap-1.5 text-sm text-[#64748b]">
                  <Clock className="w-3.5 h-3.5" />
                  {timeRemaining > 0 ? `~${timeRemaining}s remaining` : 'Finalizing...'}
                </div>
              </div>
              <div className="h-2 bg-[#1e293b] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] rounded-full transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="space-y-3">
              {AGENTS.map((agent, i) => {
                const status = agentStatuses[agent.id] || 'pending';
                const Icon = agent.icon;
                const isAnalyzing = status === 'analyzing';
                const isComplete = status === 'complete';

                return (
                  <div
                    key={agent.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-500 ${
                      isAnalyzing
                        ? 'border-[#3b82f6]/50 bg-[#3b82f6]/5 shadow-lg shadow-[#3b82f6]/10'
                        : isComplete
                        ? 'border-[#22c55e]/30 bg-[#22c55e]/5'
                        : 'border-[#334155] bg-[#1e293b]'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: isComplete ? '#22c55e20' : isAnalyzing ? agent.color + '20' : '#33415520',
                      }}
                    >
                      {isComplete ? (
                        <CheckCircle className="w-5 h-5 text-[#22c55e]" />
                      ) : isAnalyzing ? (
                        <Loader2 className="w-5 h-5 animate-spin" style={{ color: agent.color }} />
                      ) : (
                        <Icon className="w-5 h-5 text-[#475569]" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-sm ${isComplete ? 'text-[#22c55e]' : isAnalyzing ? 'text-white' : 'text-[#64748b]'}`}>
                        {agent.name}
                      </div>
                      <div className="text-xs text-[#475569] truncate">
                        {isComplete ? 'Analysis complete' : isAnalyzing ? agent.desc : 'Waiting...'}
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      {isComplete && (
                        <span className="text-xs bg-[#22c55e]/20 text-[#22c55e] px-2 py-1 rounded-full">Done</span>
                      )}
                      {isAnalyzing && (
                        <span className="text-xs bg-[#3b82f6]/20 text-[#3b82f6] px-2 py-1 rounded-full">Active</span>
                      )}
                      {status === 'pending' && (
                        <span className="text-xs bg-[#334155] text-[#475569] px-2 py-1 rounded-full">{i + 1}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {resultId && (
              <div className="mt-6 text-center">
                <Link
                  href={`/results/${resultId}`}
                  className="inline-block bg-[#22c55e] hover:bg-[#16a34a] text-white px-8 py-3 rounded-xl font-semibold transition-all"
                >
                  View Results
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
