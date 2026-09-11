'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Users, 
  TrendingUp, 
  Layers, 
  CheckCircle2, 
  Clock, 
  Award,
  ChevronRight,
  Code2,
  Briefcase,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { StartupDoc } from '@/types';

export default function HomePage() {
  const [startups, setStartups] = useState<StartupDoc[]>([]);
  const [activeRoleTab, setActiveRoleTab] = useState<'founder' | 'developer' | 'investor'>('founder');

  useEffect(() => {
    fetch('/api/startups')
      .then(res => res.json())
      .then(data => {
        if (data.startups) setStartups(data.startups.slice(0, 3));
      })
      .catch(() => {});
  }, []);

  return (
    <div className="relative overflow-hidden">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-indigo-600/15 via-purple-600/10 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-96 right-10 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 md:pt-28 md:pb-24 text-center">
        
        {/* Value Prop Pill */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-6 shadow-sm shadow-indigo-500/10"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>The Delivery-First Venture Engine</span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.1]"
        >
          Ideas are cheap.{' '}
          <span className="text-gradient-brand">Delivery is the currency.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed"
        >
          The three-sided ecosystem where founders prove execution through structured 8-department sprints, builders earn real vested equity by shipping code, and investors back validated traction.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a href="/discover">
            <Button variant="glow" size="lg" className="w-full sm:w-auto flex items-center gap-2">
              <span>Explore Verified Ideas</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </a>
          <a href="/signup?role=founder">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              Launch a Sprint
            </Button>
          </a>
        </motion.div>

        {/* Interactive Lifecycle Stages Visualization */}
        <div className="mt-16 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          
          <div className="glass-panel p-5 border border-white/10 relative overflow-hidden group hover:border-indigo-500/40 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-xs mb-3">
              01
            </div>
            <h3 className="font-bold text-white text-base mb-1">Readiness Gate</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              No shallow pitches. Ideas must pass a 3-point gate (problem, validation evidence, equity split) with SHA-256 ownership timestamping.
            </p>
          </div>

          <div className="glass-panel p-5 border border-white/10 relative overflow-hidden group hover:border-purple-500/40 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center text-xs mb-3">
              02
            </div>
            <h3 className="font-bold text-white text-base mb-1">8-Dept Sprint Execution</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Time-bound 14, 21, or 30-day sprints. Isolated departments, Kanban queues, and points-based contribution tracking.
            </p>
          </div>

          <div className="glass-panel p-5 border border-white/10 relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs mb-3">
              03
            </div>
            <h3 className="font-bold text-white text-base mb-1">Sprint Completed Syndication</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Investor funding is strictly gated to finished sprints. Test mode Razorpay commitments & 30-day branding partner strips.
            </p>
          </div>

        </div>

      </section>

      {/* Dynamic Role Cards Section */}
      <section className="py-16 bg-black/20 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              One Unified Ecosystem. <span className="text-gradient-brand">Three Dedicated Roles.</span>
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Select your perspective to see your tailored journey and upside mechanics:
            </p>

            {/* Role Switcher Tabs */}
            <div className="flex items-center justify-center gap-2 mt-6 p-1.5 rounded-xl glass-panel max-w-md mx-auto">
              <button
                onClick={() => setActiveRoleTab('founder')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeRoleTab === 'founder'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Founders
              </button>
              <button
                onClick={() => setActiveRoleTab('developer')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeRoleTab === 'developer'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Developers
              </button>
              <button
                onClick={() => setActiveRoleTab('investor')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeRoleTab === 'investor'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Investors
              </button>
            </div>
          </div>

          {/* Active Role Card View */}
          <div className="max-w-4xl mx-auto">
            {activeRoleTab === 'founder' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-panel-glow p-8 border border-indigo-500/30 grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                <div className="md:col-span-2 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Founder Journey</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    Turn your verified hypothesis into an active venture sprint.
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Clear the 3-point Readiness Gate to validate your problem. Open a 14 to 30-day execution sprint that spins up 8 departments automatically. Manage Kanban tickets, review builder applications, and guide team delivery with an AI Founder Copilot.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Retain core equity while delegating builder pool dynamically</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Full visibility across all 8 departments, runway burn, and files</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Unlock investor funding requests once the sprint is completed</span>
                    </li>
                  </ul>
                  <div className="pt-4 flex gap-3">
                    <a href="/signup?role=founder">
                      <Button variant="glow" size="sm">Create Founder Account</Button>
                    </a>
                    <a href="/discover">
                      <Button variant="secondary" size="sm">Explore Ventures</Button>
                    </a>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-black/40 border border-white/10 text-center">
                  <ProgressRing value={88} label="Execution" sublabel="Live Sprint Health" colorGradient="brand" />
                  <div className="mt-4 text-xs font-semibold text-slate-300">14 Days Remaining</div>
                  <div className="text-[11px] text-slate-400">8 Departments Synced</div>
                </div>
              </motion.div>
            )}

            {activeRoleTab === 'developer' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-panel-glow p-8 border border-sky-500/30 grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                <div className="md:col-span-2 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-sky-500/10 border border-sky-500/20 text-sky-300">
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Developer / Builder Upside</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    Ship high-impact code. Earn verified vested equity.
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Apply to exactly one department per sprint. Claim Kanban deliverables, commit code and files, and accumulate contribution points. At the end of the sprint, your share of the Builders Pool vests based on the points you earned.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Transparent dynamic equity calculation (no empty promises)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Dedicated department workspace with domain AI Mentor</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Accumulate platform reputation points across multiple ventures</span>
                    </li>
                  </ul>
                  <div className="pt-4 flex gap-3">
                    <a href="/signup?role=developer">
                      <Button variant="glow" size="sm">Join as Builder</Button>
                    </a>
                    <a href="/discover">
                      <Button variant="secondary" size="sm">Find Sprint Openings</Button>
                    </a>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-black/40 border border-white/10 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-sky-500/20 flex items-center justify-center text-sky-400 font-bold text-2xl mb-2">
                    ⚡ 85
                  </div>
                  <div className="text-base font-bold text-white">Contribution Pts</div>
                  <div className="text-xs text-slate-400 mt-1">Vested Equity: 12.8%</div>
                  <div className="mt-3 px-3 py-1 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 font-semibold">
                    Top Contributor
                  </div>
                </div>
              </motion.div>
            )}

            {activeRoleTab === 'investor' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-panel-glow p-8 border border-emerald-500/30 grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                <div className="md:col-span-2 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Investor & Sponsor Syndication</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    Back proven execution, not speculative PowerPoint slides.
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    FoundersHub unlocks funding requests only after a startup completes a full execution sprint. Review real deliverable audits, department commit logs, and velocity metrics before committing capital or activating 30-day branding partnerships.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Sprint-completed gating: zero speculative pre-seed gamble</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Razorpay Test Mode simulation with explicit 1% fee accounting</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Activate &ldquo;Powered by&rdquo; branding partnerships with logos</span>
                    </li>
                  </ul>
                  <div className="pt-4 flex gap-3">
                    <a href="/signup?role=investor">
                      <Button variant="glow" size="sm">Register as Investor</Button>
                    </a>
                    <a href="/discover?stage=sprint_completed">
                      <Button variant="secondary" size="sm">Explore Syndicates</Button>
                    </a>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-black/40 border border-white/10 text-center">
                  <div className="text-3xl font-extrabold text-emerald-400 mb-1">
                    ₹50,00,000
                  </div>
                  <div className="text-xs text-slate-400">Total Capital Committed</div>
                  <div className="mt-4 px-3 py-1 rounded-full text-[10px] bg-indigo-500/20 text-indigo-400 font-semibold">
                    1% Platform Fee Verified
                  </div>
                </div>
              </motion.div>
            )}
          </div>

        </div>
      </section>

      {/* Featured / Trending Startups Live Feed */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
          <div>
            <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
              Live Sprint Showcase
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Featured Startups in Flight
            </h2>
          </div>
          <a href="/discover" className="mt-4 sm:mt-0 text-sm font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
            <span>View All Public Startups</span>
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>

        {/* Startups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {startups.map((startup) => (
            <div
              key={startup._id}
              className="glass-panel border border-white/10 hover:border-indigo-500/40 transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:shadow-xl hover:shadow-indigo-500/10"
            >
              <div>
                {/* Startup Header Image */}
                <div className="relative h-44 w-full bg-slate-800 overflow-hidden">
                  <Image
                    src={startup.images[0] || 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&auto=format&fit=crop&q=80'}
                    alt={startup.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent" />
                  
                  {/* Stage Pill */}
                  <div className="absolute top-3 left-3">
                    <Badge variant="stage" stage={startup.stage} />
                  </div>

                  {/* Execution Score Floating Widget */}
                  <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10 flex items-center gap-1.5 text-xs font-bold text-white">
                    <span className="text-indigo-400">Score:</span>
                    <span>{startup.executionScore}/100</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg text-white group-hover:text-indigo-300 transition-colors">
                      {startup.name}
                    </h3>
                    <span className="text-xs text-slate-400">{startup.sector}</span>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {startup.tagline}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {startup.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded text-[10px] bg-white/5 border border-white/5 text-slate-400">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="p-5 pt-0 border-t border-white/5 mt-4 flex items-center justify-between text-xs">
                <div className="text-slate-400">
                  By <span className="text-white font-medium">{startup.founderName}</span>
                </div>
                <a
                  href={`/startups/${startup._id}`}
                  className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  <span>Explore Sprint</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust & Compliance Section */}
      <section className="py-16 bg-gradient-to-b from-[#070a12] to-[#0b0f19] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4">
              <ShieldCheck className="w-4 h-4" />
              <span>Verifiable Architecture</span>
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Built on Trust, Transparency & Alignment
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              FoundersHub incorporates institutional trust signals into every step of the startup lifecycle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="glass-panel p-6 border border-white/10 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                #1
              </div>
              <h4 className="font-bold text-white text-base">SHA-256 Ownership Proof</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                When a founder clears the Readiness Gate, a cryptographic SHA-256 hash is stamped with a precise UTC timestamp, creating an immutable proof of ideation priority.
              </p>
            </div>

            <div className="glass-panel p-6 border border-white/10 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                #2
              </div>
              <h4 className="font-bold text-white text-base">DPIIT Startup India Aligned</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Platform workflows mirror the Department for Promotion of Industry and Internal Trade (DPIIT) guidelines for innovation validation, tax benefit eligibility, and entity governance.
              </p>
            </div>

            <div className="glass-panel p-6 border border-white/10 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                #3
              </div>
              <h4 className="font-bold text-white text-base">Aadhaar & PAN Attestation</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Members self-attest their government identities with masked 4-digit signatures and PDF uploads, earning trust badges without exposing unencrypted personal secrets.
              </p>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
