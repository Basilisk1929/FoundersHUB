import React from 'react';
import Image from 'next/image';
import { Shield, Sparkles, CheckCircle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#070a12] text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Col 1: Brand */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8 rounded-xl overflow-hidden shadow-lg shadow-indigo-500/20">
                <Image
                  src="/brand/website-logo.png"
                  alt="FoundersHub Logo"
                  fill
                  sizes="32px"
                  className="object-cover"
                />
              </div>
              <span className="font-bold text-base text-white tracking-tight">
                Founders<span className="text-gradient-brand">Hub</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed italic">
              &ldquo;Ideas are cheap. Delivery is the currency.&rdquo;
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <Shield className="w-4 h-4" />
              <span>DPIIT Startup India Aligned</span>
            </div>
          </div>

          {/* Col 2: Platform */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-2.5 text-xs">
              <li><a href="/discover" className="hover:text-white transition-colors">Discover Startups</a></li>
              <li><a href="/how-it-works" className="hover:text-white transition-colors">Sprint Execution Engine</a></li>
              <li><a href="/trust" className="hover:text-white transition-colors">Ownership Proof & DPIIT</a></li>
              <li><a href="/pricing" className="hover:text-white transition-colors">Platform Fee Structure (1%)</a></li>
            </ul>
          </div>

          {/* Col 3: Three-Sided Ecosystem */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">Ecosystem</h4>
            <ul className="space-y-2.5 text-xs">
              <li><a href="/signup?role=founder" className="hover:text-white transition-colors">For Founders (Launch Sprints)</a></li>
              <li><a href="/signup?role=developer" className="hover:text-white transition-colors">For Developers (Earn Equity)</a></li>
              <li><a href="/signup?role=investor" className="hover:text-white transition-colors">For Investors (Post-Sprint Funding)</a></li>
              <li><a href="/login" className="hover:text-white transition-colors">Sign In to Hub</a></li>
            </ul>
          </div>

          {/* Col 4: Trust & Compliance */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">Compliance</h4>
            <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.02] space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-white font-medium">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified Execution Gating</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Strict post-sprint gating guarantees capital commitment only after delivery verification with transparent 1% fee accounting.
              </p>
            </div>
          </div>

        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} FoundersHub. Built for high-velocity builders and visionary backers.
          </div>
          <div className="flex items-center gap-6">
            <a href="/trust" className="hover:text-slate-300">Security & Privacy</a>
            <a href="/trust" className="hover:text-slate-300">Terms of Delivery</a>
            <a href="/trust" className="hover:text-slate-300">Aadhaar/PAN Attestation</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
