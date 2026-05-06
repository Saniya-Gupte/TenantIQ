'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, ArrowRight, Send } from 'lucide-react';

export default function SignInPage() {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setNeedsConfirmation(false);

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const { getSupabaseClient } = await import('@/lib/supabase');
      const supabase = getSupabaseClient();

      if (tab === 'signin') {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) {
          if (authError.message.toLowerCase().includes('email not confirmed')) {
            setNeedsConfirmation(true);
          } else {
            setError(authError.message);
          }
        } else {
          router.push('/dashboard');
        }
      } else {
        const { error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) {
          setError(authError.message);
        } else {
          setSuccessMsg('Account created! Check your email inbox for a confirmation link, then sign in here.');
          setTab('signin');
          setPassword('');
        }
      }
    } catch {
      // Supabase not configured — treat as demo mode and allow direct access
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  async function resendConfirmation() {
    setResending(true);
    setError('');
    try {
      const { getSupabaseClient } = await import('@/lib/supabase');
      const supabase = getSupabaseClient();
      const { error: resendError } = await supabase.auth.resend({ type: 'signup', email });
      if (resendError) {
        setError(resendError.message);
      } else {
        setSuccessMsg('Confirmation email resent — check your inbox.');
        setNeedsConfirmation(false);
      }
    } catch {
      setError('Could not resend confirmation email.');
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col">
      {/* Nav */}
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

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-[#3b82f6]/10 border border-[#3b82f6]/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Shield className="w-7 h-7 text-[#3b82f6]" />
            </div>
            <h1 className="text-3xl font-bold mb-2">
              {tab === 'signin' ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="text-[#64748b] text-sm">
              {tab === 'signin'
                ? 'Sign in to access your screening dashboard'
                : 'Start screening tenants with TenantIQ'}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex bg-[#1e293b] border border-[#334155] rounded-xl p-1 mb-6">
            <button
              onClick={() => { setTab('signin'); setError(''); setSuccessMsg(''); setNeedsConfirmation(false); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === 'signin' ? 'bg-[#3b82f6] text-white' : 'text-[#64748b] hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setTab('signup'); setError(''); setSuccessMsg(''); setNeedsConfirmation(false); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === 'signup' ? 'bg-[#3b82f6] text-white' : 'text-[#64748b] hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Success message */}
          {successMsg && (
            <div className="flex items-start gap-3 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-xl px-4 py-3 mb-5 text-sm">
              <CheckCircle className="w-4 h-4 text-[#22c55e] flex-shrink-0 mt-0.5" />
              <span className="text-[#22c55e]">{successMsg}</span>
            </div>
          )}

          {/* Email not confirmed banner */}
          {needsConfirmation && (
            <div className="bg-[#f97316]/10 border border-[#f97316]/30 rounded-xl px-4 py-4 mb-5">
              <div className="flex items-start gap-3 mb-3">
                <AlertCircle className="w-4 h-4 text-[#f97316] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[#f97316] text-sm font-medium">Email not confirmed</p>
                  <p className="text-[#94a3b8] text-xs mt-1 leading-relaxed">
                    Check your inbox for a confirmation link from Supabase and click it before signing in.
                    If you didn&apos;t receive it, resend below.
                  </p>
                </div>
              </div>
              <button
                onClick={resendConfirmation}
                disabled={resending}
                className="flex items-center gap-2 text-xs font-semibold text-[#f97316] hover:text-[#fb923c] disabled:opacity-50 transition-colors ml-7"
              >
                <Send className="w-3.5 h-3.5" />
                {resending ? 'Sending…' : 'Resend confirmation email'}
              </button>
            </div>
          )}

          {/* Generic error message */}
          {error && (
            <div className="flex items-start gap-3 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-xl px-4 py-3 mb-5 text-sm">
              <AlertCircle className="w-4 h-4 text-[#ef4444] flex-shrink-0 mt-0.5" />
              <span className="text-[#ef4444]">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-[#1e293b] border border-[#334155] rounded-2xl p-7 space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[#94a3b8] mb-2">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-xl pl-10 pr-4 py-3 text-white placeholder-[#334155] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-colors text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[#94a3b8] mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={tab === 'signup' ? 'At least 6 characters' : '••••••••'}
                  autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
                  required
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-xl pl-10 pr-11 py-3 text-white placeholder-[#334155] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-colors text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#94a3b8] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold text-sm transition-all"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {tab === 'signin' ? 'Signing in…' : 'Creating account…'}
                </span>
              ) : (
                <>
                  {tab === 'signin' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
