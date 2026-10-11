"use client";
import Link from 'next/link';
import { Check, ArrowLeft, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function PricingPage() {
  /*
  ==============================================================================
  LEMON SQUEEZY PAYMENT INTEGRATION - COMMENTED OUT FOR FREE BETA / PORTFOLIO
  Uncomment the code below to re-enable live payment checkout links:
  ==============================================================================
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [userId, setUserId] = useState('');
  
  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL || 'https://example.lemonsqueezy.com/checkout/buy/some-id';
    
    async function getUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        const sep = baseUrl.includes('?') ? '&' : '?';
        setCheckoutUrl(`${baseUrl}${sep}checkout[custom][user_id]=${session.user.id}`);
      } else {
        setCheckoutUrl(baseUrl);
      }
    }
    getUser();
  }, []);
  ==============================================================================
  */

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 font-sans p-6 md:p-12">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition mb-12">
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>
      
      <div className="max-w-4xl mx-auto text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
          Public Beta • All Features Free
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-6">Simple, transparent pricing</h1>
        <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
          API-Pulse is currently in open public beta. All Pro and Enterprise features are free to use.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Free Plan */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-xl flex flex-col">
          <h3 className="text-2xl font-bold mb-2">Hobby</h3>
          <div className="mb-6">
            <span className="text-4xl font-bold">$0</span>
            <span className="text-neutral-500">/month</span>
          </div>
          <p className="text-neutral-400 mb-8 flex-1">Basic usage for exploring AI schema generation.</p>
          <ul className="space-y-4 mb-8">
            <li className="flex items-center gap-3 text-neutral-300">
              <Check className="w-5 h-5 text-indigo-500" /> AI schema generations
            </li>
            <li className="flex items-center gap-3 text-neutral-300">
              <Check className="w-5 h-5 text-indigo-500" /> Standard edge mock URLs
            </li>
            <li className="flex items-center gap-3 text-neutral-300">
              <Check className="w-5 h-5 text-indigo-500" /> OpenAPI 3.0 specification download
            </li>
          </ul>
          <Link href="/dashboard" className="w-full text-center py-3 px-4 bg-neutral-800 hover:bg-neutral-700 rounded-xl font-medium transition">
            Go to Generator
          </Link>
        </div>

        {/* Pro Plan */}
        <div className="bg-gradient-to-b from-indigo-900/50 to-neutral-900 border border-indigo-500/50 rounded-3xl p-8 shadow-2xl relative flex flex-col transform md:-translate-y-4">
          <div className="absolute top-0 right-8 transform -translate-y-1/2 bg-indigo-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
            <Zap className="w-3 h-3" /> Free in Beta
          </div>
          <h3 className="text-2xl font-bold mb-2 text-indigo-300">Pro</h3>
          <div className="mb-6">
            <span className="text-4xl font-bold">$0</span>
            <span className="text-indigo-200/50 line-through ml-2 text-xl font-normal">$19/mo</span>
            <span className="text-emerald-400 text-sm ml-2 font-medium">(100% Free during Beta)</span>
          </div>
          <p className="text-indigo-200/70 mb-8 flex-1">Full access to LLM generations, edge mocks, and API keys.</p>
          <ul className="space-y-4 mb-8">
            <li className="flex items-center gap-3 text-white">
              <Check className="w-5 h-5 text-indigo-400" /> Unlimited AI schema generations
            </li>
            <li className="flex items-center gap-3 text-white">
              <Check className="w-5 h-5 text-indigo-400" /> High-performance Edge mocking
            </li>
            <li className="flex items-center gap-3 text-white">
              <Check className="w-5 h-5 text-indigo-400" /> Create multiple API Keys
            </li>
            <li className="flex items-center gap-3 text-white">
              <Check className="w-5 h-5 text-indigo-400" /> Automatic schema sanitization
            </li>
          </ul>

          {/* 
          PAYMENT CHECKOUT BUTTON - COMMENTED OUT FOR FREE BETA
          <a 
            href={checkoutUrl} 
            className="w-full text-center py-3 px-4 bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] rounded-xl font-bold transition flex justify-center items-center gap-2"
          >
            Upgrade to Pro
          </a>
          */}
          <Link 
            href="/dashboard" 
            className="w-full text-center py-3 px-4 bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] rounded-xl font-bold transition flex justify-center items-center gap-2"
          >
            Access All Features (Free)
          </Link>
        </div>
      </div>
    </div>
  );
}
