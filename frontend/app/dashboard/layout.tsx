"use client";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LogOut } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

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
          <button
            onClick={handleSignOut}
            className="text-sm text-neutral-400 hover:text-white transition flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
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
