'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Users, TrendingUp, CheckCircle, XCircle, AlertCircle, ChevronRight, BarChart3, RefreshCw, Trash2, LogOut } from 'lucide-react';
import { getScoreLabel, formatDate } from '@/lib/utils';
import { useRequireAuth, signOut } from '@/lib/useRequireAuth';

interface ApplicationRow {
  id: string;
  created_at: string;
  applicant_name: string;
  applicant_email: string;
  overall_score: number;
  recommendation: string;
  status: string;
}

function getLocalApplications(): ApplicationRow[] {
  try {
    return JSON.parse(localStorage.getItem('tenantiq_applications') || '[]');
  } catch {
    return [];
  }
}

function mergeApplications(remote: ApplicationRow[], local: ApplicationRow[]): ApplicationRow[] {
  const map = new Map<string, ApplicationRow>();
  // Local goes in first (remote will overwrite if id matches, keeping server data authoritative)
  for (const a of local) map.set(a.id, a);
  for (const a of remote) map.set(a.id, a);
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

function RecommendationBadge({ rec }: { rec: string }) {
  const configs: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
    APPROVE: { bg: 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/30', text: 'Approve', icon: CheckCircle },
    CONDITIONAL: { bg: 'bg-[#f97316]/10 text-[#f97316] border border-[#f97316]/30', text: 'Conditional', icon: AlertCircle },
    DECLINE: { bg: 'bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/30', text: 'Decline', icon: XCircle },
    pending: { bg: 'bg-[#334155] text-[#64748b]', text: 'Pending', icon: RefreshCw },
  };
  const config = configs[rec] || configs.pending;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg}`}>
      <Icon className="w-3 h-3" />
      {config.text}
    </span>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const ready = useRequireAuth();
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [dbStatus, setDbStatus] = useState<'ok' | 'error' | 'unknown'>('unknown');
  const [dbError, setDbError] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadApplications = useCallback(async () => {
    setLoading(true);

    // Always load local data first so the page isn't blank while we wait for the network
    const localApps = getLocalApplications();
    setApplications(localApps);

    try {
      const res = await fetch('/api/applications');
      const data = await res.json();

      if (data.error) {
        // API returned an error — keep local data, show a soft warning
        setDbStatus('error');
        setDbError(data.error);
        // Still show local apps (already set above)
      } else {
        setDbStatus('ok');
        setDbError('');
        // Merge: Supabase is authoritative for records it has, local fills the gaps
        const merged = mergeApplications(data.applications || [], localApps);
        setApplications(merged);
      }
    } catch {
      // Network error — keep local data visible, show soft warning
      setDbStatus('error');
      setDbError('Could not reach database. Showing locally cached results.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const filtered = filter === 'all'
    ? applications
    : applications.filter(a => a.recommendation === filter);

  const totalApps = applications.length;
  const approvedApps = applications.filter(a => a.recommendation === 'APPROVE').length;
  const avgScore = totalApps > 0
    ? Math.round(applications.reduce((s, a) => s + (a.overall_score || 0), 0) / totalApps)
    : 0;
  const approvalRate = totalApps > 0 ? Math.round((approvedApps / totalApps) * 100) : 0;

  async function handleDelete(id: string) {
    setDeleting(id);
    // Remove from localStorage immediately
    try {
      const existing: ApplicationRow[] = JSON.parse(localStorage.getItem('tenantiq_applications') || '[]');
      localStorage.setItem('tenantiq_applications', JSON.stringify(existing.filter(a => a.id !== id)));
      localStorage.removeItem(`tenantiq_result_${id}`);
    } catch { /* ignore */ }

    // Best-effort delete from Supabase
    try {
      await fetch(`/api/applications/${id}`, { method: 'DELETE' });
    } catch { /* ignore — local delete already done */ }

    setApplications(prev => prev.filter(a => a.id !== id));
    setConfirmingDelete(null);
    setDeleting(null);
  }

  if (!ready) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#3b82f6] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <nav className="border-b border-[#1e293b] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#3b82f6]" />
            <span className="font-bold">TenantIQ</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/setup"
              className="flex items-center gap-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Shield className="w-4 h-4" />
              New Screening
            </Link>
            <button
              onClick={() => signOut(router)}
              className="flex items-center gap-2 px-4 py-2 bg-[#1e293b] border border-[#334155] rounded-lg text-sm text-[#94a3b8] hover:text-white hover:border-[#475569] transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1">Landlord Dashboard</h1>
            <p className="text-[#64748b] text-sm">All tenant screening results</p>
          </div>
          <button
            onClick={loadApplications}
            className="flex items-center gap-2 px-4 py-2 bg-[#1e293b] border border-[#334155] rounded-lg text-sm text-[#94a3b8] hover:text-white hover:border-[#475569] transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Soft DB warning — doesn't block the page */}
        {dbStatus === 'error' && (
          <div className="flex items-start gap-3 bg-[#f97316]/10 border border-[#f97316]/25 rounded-xl px-4 py-3 mb-6 text-sm">
            <AlertCircle className="w-4 h-4 text-[#f97316] flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-[#f97316] font-medium">Database unavailable</span>
              <span className="text-[#94a3b8]"> — {dbError} Showing results saved on this device.</span>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Applications', value: totalApps, icon: Users, color: '#3b82f6' },
            { label: 'Approval Rate', value: `${approvalRate}%`, icon: TrendingUp, color: '#22c55e' },
            { label: 'Average Score', value: avgScore || '—', icon: BarChart3, color: '#8b5cf6' },
            { label: 'Approved', value: approvedApps, icon: CheckCircle, color: '#22c55e' },
          ].map(stat => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-[#1e293b] border border-[#334155] rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: stat.color + '20' }}>
                    <Icon className="w-4 h-4" style={{ color: stat.color }} />
                  </div>
                </div>
                <div className="text-3xl font-black mb-1" style={{ color: stat.color }}>{stat.value}</div>
                <div className="text-[#64748b] text-xs">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { key: 'all', label: `All (${totalApps})` },
            { key: 'APPROVE', label: `Approved (${applications.filter(a => a.recommendation === 'APPROVE').length})` },
            { key: 'CONDITIONAL', label: `Conditional (${applications.filter(a => a.recommendation === 'CONDITIONAL').length})` },
            { key: 'DECLINE', label: `Declined (${applications.filter(a => a.recommendation === 'DECLINE').length})` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === tab.key
                  ? 'bg-[#3b82f6] text-white'
                  : 'bg-[#1e293b] border border-[#334155] text-[#94a3b8] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-2xl overflow-hidden">
          {loading && applications.length === 0 ? (
            <div className="p-12 text-center text-[#64748b]">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-[#3b82f6]" />
              Loading applications...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-[#334155] mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {filter === 'all' ? 'No Applications Yet' : `No ${filter.charAt(0) + filter.slice(1).toLowerCase()} Applications`}
              </h3>
              <p className="text-[#64748b] mb-6 text-sm">
                {filter === 'all'
                  ? "Screen your first tenant to see results here."
                  : "No applications match this filter."}
              </p>
              {filter === 'all' && (
                <Link
                  href="/setup"
                  className="inline-flex items-center gap-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white px-6 py-3 rounded-xl font-medium transition-all"
                >
                  Screen Your First Tenant
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#334155]">
                    {['Applicant', 'Submitted', 'Score', 'Recommendation', 'Status', '', ''].map((h, i) => (
                      <th key={i} className="text-left text-xs font-semibold text-[#475569] uppercase tracking-wider px-6 py-4">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#334155]">
                  {filtered.map(app => {
                    const scoreInfo = getScoreLabel(app.overall_score);
                    const isConfirming = confirmingDelete === app.id;
                    const isDeleting = deleting === app.id;
                    return (
                      <tr key={app.id} className="hover:bg-[#334155]/20 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-medium text-sm">{app.applicant_name}</div>
                          <div className="text-xs text-[#64748b]">{app.applicant_email}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#94a3b8]">
                          {app.created_at ? formatDate(app.created_at) : '—'}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xl font-bold" style={{ color: scoreInfo.color }}>
                            {app.overall_score}
                          </span>
                          <span className="text-xs text-[#475569] ml-1">/100</span>
                        </td>
                        <td className="px-6 py-4">
                          <RecommendationBadge rec={app.recommendation} />
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs px-2.5 py-1 rounded-full ${
                            app.status === 'complete'
                              ? 'bg-[#22c55e]/10 text-[#22c55e]'
                              : 'bg-[#334155] text-[#64748b]'
                          }`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/results/${app.id}`}
                            className="flex items-center gap-1 text-sm text-[#3b82f6] hover:text-[#60a5fa] opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap"
                          >
                            View Report
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          {isConfirming ? (
                            <div className="flex items-center gap-2 whitespace-nowrap">
                              <button
                                onClick={() => handleDelete(app.id)}
                                disabled={isDeleting}
                                className="text-xs bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/30 hover:bg-[#ef4444]/25 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {isDeleting ? 'Deleting…' : 'Confirm'}
                              </button>
                              <button
                                onClick={() => setConfirmingDelete(null)}
                                className="text-xs text-[#64748b] hover:text-white transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmingDelete(app.id)}
                              className="opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-lg text-[#475569] hover:text-[#ef4444] hover:bg-[#ef4444]/10"
                              title="Delete application"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-center text-[#334155] text-xs mt-6">
          TenantIQ — For demonstration purposes only. Not legal advice.
        </p>
      </div>
    </div>
  );
}
