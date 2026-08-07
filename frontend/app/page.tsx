import Link from 'next/link';
import { ArrowRight, Code2, Zap, Shield, CheckCircle2 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 selection:bg-indigo-500/30 font-sans">
      {/* Navigation */}
      <nav className="border-b border-neutral-900 bg-neutral-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-indigo-500" />
            <span className="text-xl font-bold tracking-tight">API-Pulse</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-neutral-400 hover:text-white transition">
              Log in
            </Link>
            <Link href="/register" className="text-sm font-medium bg-white text-neutral-950 px-4 py-2 rounded-full hover:bg-neutral-200 transition">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-neutral-950 to-neutral-950" />
        
        <div className="max-w-7xl mx-auto px-6 relative text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-8">
            <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
            Enterprise-Grade FSM Mocking
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
            Turn raw JSON into <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Production Mock APIs
            </span>
          </h1>
          
          <p className="text-xl text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Stop waiting on backend teams. Instantly generate strict OpenAPI 3.1 specs and live Cloudflare-backed edge endpoints with a 3.5s hardware circuit breaker.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="h-12 px-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center justify-center gap-2 transition w-full sm:w-auto shadow-lg shadow-indigo-500/25">
              Start Building Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="#pricing" className="h-12 px-8 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white font-medium flex items-center justify-center transition w-full sm:w-auto">
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-neutral-950 border-t border-neutral-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 transition">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6">
                <Code2 className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Deterministic AI</h3>
              <p className="text-neutral-400 leading-relaxed">No infinite loops. If the LLM fails, our AST FSM fallback instantly kicks in to guarantee a valid schema.</p>
            </div>
            
            <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 transition">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Edge Deployed</h3>
              <p className="text-neutral-400 leading-relaxed">Your mock endpoints are instantly deployed to Cloudflare Workers for sub-50ms global latency.</p>
            </div>
            
            <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 transition">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Secure & Sanitized</h3>
              <p className="text-neutral-400 leading-relaxed">Automatic payload sanitization strips AWS keys and bearer tokens before they ever touch the LLM.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-neutral-950">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-16">Simple, transparent pricing</h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
            {/* Free Tier */}
            <div className="p-8 rounded-3xl bg-neutral-900 border border-neutral-800 flex flex-col hover:border-neutral-700 transition">
              <h3 className="text-2xl font-bold mb-2">Hobby</h3>
              <p className="text-neutral-400 mb-6">Perfect for testing the waters.</p>
              <div className="text-5xl font-bold mb-8">$0<span className="text-xl text-neutral-500 font-normal">/mo</span></div>
              
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-neutral-500" /> 10 Free Generations</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-neutral-500" /> FSM Fallback Support</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-neutral-500" /> 24-hour Mock URL Retention</li>
              </ul>
              
              <Link href="/register" className="w-full h-12 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium flex items-center justify-center transition">
                Start Free
              </Link>
            </div>
            
            {/* Pro Tier */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-indigo-900/50 to-neutral-900 border border-indigo-500/30 flex flex-col relative overflow-hidden shadow-2xl shadow-indigo-900/20 hover:border-indigo-500/50 transition">
              <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">POPULAR</div>
              <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
              <p className="text-indigo-200 mb-6">For professional engineering teams.</p>
              <div className="text-5xl font-bold mb-8">$15<span className="text-xl text-indigo-300 font-normal">/mo</span></div>
              
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-indigo-400" /> Unlimited Generations</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-indigo-400" /> API Keys for Automation</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-indigo-400" /> Permanent Mock URLs</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-indigo-400" /> Priority Support</li>
              </ul>
              
              <a 
                href={process.env.NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL || "#"} 
                className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center justify-center transition shadow-lg shadow-indigo-500/25"
              >
                Upgrade to Pro
              </a>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t border-neutral-900 py-12 text-center text-neutral-500 text-sm">
        <p>© 2026 API-Pulse. Built with resilient FSM architecture.</p>
      </footer>
    </div>
  );
}
