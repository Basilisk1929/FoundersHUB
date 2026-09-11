import React from 'react';
import { 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  Clock, 
  Code2, 
  TrendingUp, 
  CheckCircle2, 
  ArrowRight,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function HowItWorksPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      
      {/* Title */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
          <Layers className="w-3.5 h-3.5" />
          <span>The Delivery Architecture</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
          How FoundersHub Works
        </h1>
        <p className="text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          &ldquo;Ideas are cheap. Delivery is the currency.&rdquo; Here is the exact mechanics of our three-phase venture engine.
        </p>
      </div>

      {/* Phase 1 */}
      <div className="glass-panel p-8 border border-white/10 rounded-3xl relative overflow-hidden space-y-4">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 font-extrabold flex items-center justify-center text-lg">
            01
          </span>
          <div>
            <h2 className="text-xl font-bold text-white">Phase 1: Idea Validation & Readiness Gate</h2>
            <p className="text-xs text-indigo-400 font-medium">Draft → Public Verification</p>
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">
          To prevent low-effort pitches and protect our builders’ time, every submitted concept starts in <b>Draft</b> mode. A founder must pass the <b>3-Point Readiness Gate</b> before their idea is published to the Discover feed:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1 text-xs">
            <b className="text-white">1. Verified Problem Statement:</b>
            <p className="text-slate-400">At least 30 characters detailing the market inefficiency and affected demographic.</p>
          </div>
          <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1 text-xs">
            <b className="text-white">2. Validation Evidence:</b>
            <p className="text-slate-400">Customer discovery interviews, letter of intent (LOI), or active waitlist metrics.</p>
          </div>
          <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1 text-xs">
            <b className="text-white">3. Initial Equity Split:</b>
            <p className="text-slate-400">Transparent split between Founder retention and the dynamic Builders Pool (e.g. 70/30).</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2.5">
          <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
          <span>
            <b>Immutable Proof:</b> Upon passing the Readiness Gate, the system hashes the problem statement and timestamp with SHA-256, creating undeniable proof of ideation priority.
          </span>
        </div>
      </div>

      {/* Phase 2 */}
      <div className="glass-panel p-8 border border-white/10 rounded-3xl relative overflow-hidden space-y-4">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 font-extrabold flex items-center justify-center text-lg">
            02
          </span>
          <div>
            <h2 className="text-xl font-bold text-white">Phase 2: The 8-Department Sprint Engine</h2>
            <p className="text-xs text-purple-400 font-medium">14, 21, or 30-Day Execution Cycles</p>
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">
          When the founder commits skin in the game (weekly hours or deposit), the platform automatically provisions 8 isolated department workspaces:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {['Development', 'Design (UI/UX)', 'Marketing', 'Product Management', 'Sales & BD', 'Customer Support', 'Operations', 'Finance & Runway'].map(d => (
            <div key={d} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center font-semibold text-slate-200">
              {d}
            </div>
          ))}
        </div>

        <div className="space-y-2 text-xs text-slate-300 pt-2">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span><b>Single-Department Rule:</b> Developers apply to and join exactly ONE department per sprint to foster deep focus.</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span><b>Points-Based Vested Equity:</b> Deliverables are awarded 5 to 50 contribution points. At the end of the sprint, the Builders Pool vests in direct mathematical proportion to total team points earned.</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span><b>Domain AI Mentors:</b> Every department has an embedded AI Mentor trained on standard operating procedures, sprint planning, and wireframe review.</span>
          </div>
        </div>
      </div>

      {/* Phase 3 */}
      <div className="glass-panel p-8 border border-white/10 rounded-3xl relative overflow-hidden space-y-4">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center text-lg">
            03
          </span>
          <div>
            <h2 className="text-xl font-bold text-white">Phase 3: Sprint Completed Syndication</h2>
            <p className="text-xs text-emerald-400 font-medium">Post-Sprint Capital & 30-Day Brand Sponsorships</p>
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">
          We strictly prohibit capital solicitation during early drafting. Only when a venture completes its execution sprint does the <b>Funding Gating Lock</b> disengage:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1.5 text-xs">
            <b className="text-emerald-400">Direct Capital Commitments</b>
            <p className="text-slate-400">
              Investors review task velocity, milestone audit logs, and member contribution before committing capital via our Razorpay test mode flow.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1.5 text-xs">
            <b className="text-indigo-400">30-Day Branding Partnerships</b>
            <p className="text-slate-400">
              Sponsor companies can back a startup in exchange for prominent &ldquo;Powered by [Brand]&rdquo; strips on the public startup card and page.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300">
          <b>Treasury Alignment:</b> Every successful funding transaction allocates a transparent 1% platform fee to FoundersHub, recorded directly on the investor ledger.
        </div>
      </div>

      {/* Action Footer */}
      <div className="text-center pt-8">
        <a href="/discover">
          <Button variant="glow" size="lg" className="inline-flex items-center gap-2">
            <span>Explore Active Sprints</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </a>
      </div>

    </div>
  );
}
