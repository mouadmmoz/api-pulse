"use client";
import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
    } else {
      setSuccess("Registration successful! Check your email to verify your account.");
    }
    setLoading(false);
  };
  
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6 text-neutral-50 font-sans">
      <div className="w-full max-w-md p-8 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl">
        <h2 className="text-3xl font-bold mb-6 text-center">Create an Account</h2>
        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm">{error}</div>}
        {success && <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-3 rounded-lg mb-6 text-sm">{success}</div>}
        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition" required />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-neutral-100 hover:bg-white text-neutral-950 font-medium py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-white/10">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-neutral-500" /> : "Sign Up"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-neutral-500">
          Already have an account? <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Log in</Link>
        </p>
      </div>
    </div>
  );
}
