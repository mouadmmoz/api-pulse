"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LogOut, User, Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUser(session.user);
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null);
        router.push('/login');
      } else {
        setUser(session.user);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm text-neutral-400">Verifying session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 flex flex-col font-sans">
      <header className="border-b border-neutral-800 bg-neutral-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            API-Pulse
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-neutral-400">
            <Link href="/dashboard" className="hover:text-white transition">Generator</Link>
            <Link href="/dashboard/history" className="hover:text-white transition">History</Link>
            <Link href="/dashboard/keys" className="hover:text-white transition">API Keys</Link>
            {/* PAYMENT LINK - COMMENTED OUT FOR FREE BETA
            <Link href="/pricing" className="hover:text-white transition">Upgrade</Link>
            */}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {user?.email && (
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-300 bg-neutral-800/80 border border-neutral-700/80 px-3 py-1.5 rounded-full font-mono">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span className="truncate max-w-[200px]">{user.email}</span>
            </span>
          )}
          <button
            onClick={handleSignOut}
            className="text-sm text-neutral-400 hover:text-white transition flex items-center gap-1.5 bg-neutral-800/40 hover:bg-neutral-800 px-3 py-1.5 rounded-lg border border-neutral-800"
          >
            <LogOut className="w-4 h-4 text-neutral-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>
      <div className="flex-1 overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  );
}
