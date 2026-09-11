import React from 'react';
import { CheckCircle2, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function PricingPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      
      {/* Title */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Radical Transparency</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
          Simple, Aligned Fee Structure
        </h1>
        <p className="text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Zero upfront costs to build, test, and ship. FoundersHub succeeds only when your venture earns verified execution and syndication.
        </p>
      </div>

      {/* 3 Pricing Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Founders */}
        <div className="glass-panel p-8 border border-white/10 rounded-3xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="text-xs font-bold text-purple-400 uppercase tracking-wider">For Founders</div>
            <div className="text-3xl font-extrabold text-white">₹0 <span className="text-xs text-slate-400 font-normal">/ month</span></div>
            <p className="text-xs text-slate-300">
              Submit ideas, clear the Readiness Gate, and run 8-department execution sprints without paying any upfront platform subscription.
            </p>

            <ul className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-white/5">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Unlimited idea drafting</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>SHA-256 cryptographic proof</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Full 8-department workspace</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>AI Founder Copilot access</span>
              </li>
            </ul>
          </div>

          <a href="/signup?role=founder">
            <Button variant="secondary" className="w-full">Get Started Free</Button>
          </a>
        </div>

        {/* Developers */}
        <div className="glass-panel p-8 border border-white/10 rounded-3xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="text-xs font-bold text-sky-400 uppercase tracking-wider">For Builders</div>
            <div className="text-3xl font-extrabold text-white">100% Free <span className="text-xs text-slate-400 font-normal">+ Equity</span></div>
            <p className="text-xs text-slate-300">
              Join active departments, complete Kanban deliverables, and earn vested equity in high-velocity ventures.
            </p>

            <ul className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-white/5">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Apply to any active sprint</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Points-based dynamic vesting</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Department AI Mentor access</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Zero commission on vested shares</span>
              </li>
            </ul>
          </div>

          <a href="/signup?role=developer">
            <Button variant="secondary" className="w-full">Join as Builder</Button>
          </a>
        </div>

        {/* Platform Fee & Investors */}
        <div className="glass-panel-glow p-8 border border-emerald-500/30 rounded-3xl flex flex-col justify-between space-y-6 relative">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
              Treasury Maintenance
            </div>
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Platform Fee</div>
            <div className="text-3xl font-extrabold text-white">1% <span className="text-xs text-slate-400 font-normal">on Syndications</span></div>
            <p className="text-xs text-slate-300">
              A standard 1% fee is deducted from post-sprint capital commitments and 30-day branding sponsorships to support platform infrastructure.
            </p>

            <ul className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-white/5">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Razorpay Test Mode verification</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Audit-proof ledger accounting</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Automated receipt generation</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>No hidden carry or management fees</span>
              </li>
            </ul>
          </div>

          <a href="/signup?role=investor">
            <Button variant="glow" className="w-full">Register as Backer</Button>
          </a>
        </div>

      </div>

      {/* Comparison Callout */}
      <div className="glass-panel p-8 border border-white/10 rounded-3xl space-y-3">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
          <span>Why Delivery-First Alignment Wins</span>
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Traditional platforms charge upfront listing fees or take 7–10% equity warrants simply for an introduction. FoundersHub charges 0% upfront and takes 0% founder equity. We take a flat 1% transaction fee strictly when post-sprint funding takes place, aligning our incentives with real venture success.
        </p>
      </div>

    </div>
  );
}
