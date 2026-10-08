"use client";
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  const handleGitHubLogin = async () => {
    setOauthLoading(true);
    setError('');
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (oauthError) throw oauthError;
    } catch (err: any) {
      setError(err.message || 'GitHub authentication failed');
      setOauthLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (data?.session) {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid login credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6 text-neutral-50 font-sans">
      <div className="w-full max-w-md p-8 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl">
        <h2 className="text-3xl font-bold mb-2 text-center">Welcome Back</h2>
        <p className="text-sm text-neutral-400 text-center mb-6">Sign in to your API-Pulse workspace</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        {/* GitHub OAuth Button */}
        <button
          onClick={handleGitHubLogin}
          disabled={oauthLoading || loading}
          type="button"
          className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-medium py-3 rounded-xl transition flex items-center justify-center gap-3 border border-neutral-700 hover:border-neutral-600 disabled:opacity-50"
        >
          {oauthLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
          ) : (
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          )}
          <span>Continue with GitHub</span>
        </button>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-neutral-800" />
          <span className="text-xs uppercase text-neutral-500 font-medium">Or with email</span>
          <div className="flex-1 h-px bg-neutral-800" />
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition text-sm"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading || oauthLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-50 mt-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Log In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          Don't have an account? <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">Register</Link>
        </p>
      </div>
    </div>
  );
}
