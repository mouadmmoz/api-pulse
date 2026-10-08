"use client";
import Link from 'next/link';
import { Check, ArrowLeft, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function PricingPage() {
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [userId, setUserId] = useState('');
  
  useEffect(() => {
    // URL from environment, or a placeholder for demo
    const baseUrl = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL || 'https://example.lemonsqueezy.com/checkout/buy/some-id';
    
    // We want to pass the user ID so the webhook knows who paid
    async function getUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        // Lemon Squeezy allows passing custom data in checkout URLs via custom_data[key]=value
        // ?checkout[custom][user_id]=...
        const sep = baseUrl.includes('?') ? '&' : '?';
        setCheckoutUrl(`${baseUrl}${sep}checkout[custom][user_id]=${session.user.id}`);
      } else {
        setCheckoutUrl(baseUrl);
      }
    }
    getUser();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 font-sans p-6 md:p-12">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition mb-12">
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>
      
      <div className="max-w-4xl mx-auto text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">Simple, transparent pricing</h1>
        <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
          Start for free, upgrade when you need higher limits and custom edge mock URLs.
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
          <p className="text-neutral-400 mb-8 flex-1">Perfect for trying out API-Pulse and generating a few mock endpoints.</p>
          <ul className="space-y-4 mb-8">
            <li className="flex items-center gap-3 text-neutral-300">
              <Check className="w-5 h-5 text-indigo-500" /> 10 AI schema generations
            </li>
            <li className="flex items-center gap-3 text-neutral-300">
              <Check className="w-5 h-5 text-indigo-500" /> Standard edge mock URLs
            </li>
            <li className="flex items-center gap-3 text-neutral-300 opacity-50">
              <Check className="w-5 h-5 text-neutral-600" /> No API Keys
            </li>
          </ul>
          <Link href="/dashboard" className="w-full text-center py-3 px-4 bg-neutral-800 hover:bg-neutral-700 rounded-xl font-medium transition">
            Current Plan
          </Link>
        </div>

        {/* Pro Plan */}
        <div className="bg-gradient-to-b from-indigo-900/50 to-neutral-900 border border-indigo-500/50 rounded-3xl p-8 shadow-2xl relative flex flex-col transform md:-translate-y-4">
          <div className="absolute top-0 right-8 transform -translate-y-1/2 bg-indigo-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
            <Zap className="w-3 h-3" /> Most Popular
          </div>
          <h3 className="text-2xl font-bold mb-2 text-indigo-300">Pro</h3>
          <div className="mb-6">
            <span className="text-4xl font-bold">$19</span>
            <span className="text-indigo-200/50">/month</span>
          </div>
          <p className="text-indigo-200/70 mb-8 flex-1">For power users and teams who need unlimited generations.</p>
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
              <Check className="w-5 h-5 text-indigo-400" /> Priority Support
            </li>
          </ul>
          <a 
            href={checkoutUrl} 
            className="w-full text-center py-3 px-4 bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] rounded-xl font-bold transition flex justify-center items-center gap-2"
          >
            Upgrade to Pro
          </a>
        </div>
      </div>
    </div>
  );
}
