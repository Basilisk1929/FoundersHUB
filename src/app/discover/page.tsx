'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  Search, 
  Filter, 
  ArrowRight, 
  Clock, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  Code2, 
  TrendingUp,
  AlertTriangle,
  Send,
  Briefcase,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { useAuth } from '@/components/auth/AuthContext';
import { openRazorpayCheckout } from '@/lib/razorpay-client';
import { StartupDoc } from '@/types';

export default function DiscoverPage() {
  const { user } = useAuth();
  const [startups, setStartups] = useState<StartupDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSector, setSelectedSector] = useState('all');
  const [selectedStage, setSelectedStage] = useState('all');

  // Modal States
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [fundModalOpen, setFundModalOpen] = useState(false);
  const [targetStartup, setTargetStartup] = useState<StartupDoc | null>(null);

  // Builder Application Form
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [coverNote, setCoverNote] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [applyStatus, setApplyStatus] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Investor Funding Form
  const [fundType, setFundType] = useState<'investment' | 'branding_partnership'>('investment');
  const [fundAmount, setFundAmount] = useState('500000');
  const [brandingLogo, setBrandingLogo] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80');
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [fundStatus, setFundStatus] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);
  const [fallbackPaymentInfo, setFallbackPaymentInfo] = useState<any>(null);

  useEffect(() => {
    fetchStartups();
  }, [selectedSector, selectedStage]);

  const fetchStartups = async () => {
    setLoading(true);
    try {
      let url = `/api/startups?search=${encodeURIComponent(search)}`;
      if (selectedSector !== 'all') url += `&sector=${encodeURIComponent(selectedSector)}`;
      if (selectedStage !== 'all') url += `&stage=${encodeURIComponent(selectedStage)}`;

      const res = await fetch(url);
      const data = await res.json();
      setStartups(data.startups || []);
    } catch {
      setStartups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStartups();
  };

  const openApplyModal = (startup: StartupDoc) => {
    setTargetStartup(startup);
    setApplyStatus(null);
    setCoverNote('');
    setSelectedDeptId('');
    setApplyModalOpen(true);
  };

  const openFundModal = (startup: StartupDoc) => {
    setTargetStartup(startup);
    setFundStatus(null);
    setFallbackPaymentInfo(null);
    setAgreementAccepted(false);
    setFundModalOpen(true);
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStartup) return;

    setIsSubmitting(true);
    setApplyStatus(null);

    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startupId: targetStartup._id,
          departmentId: selectedDeptId,
          coverNote,
          resumeUrl: resumeUrl || 'https://files.foundershub.dev/resumes/builder.pdf'
        })
      });

      const data = await res.json();
      if (res.ok) {
        setApplyStatus({ success: true, message: data.message });
      } else {
        setApplyStatus({ error: data.error || 'Failed to submit application' });
      }
    } catch {
      setApplyStatus({ error: 'Network error submitting application' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const completeFundVerification = async (reqId: string, paymentId: string, orderId: string, signature: string) => {
    setIsSubmitting(true);
    try {
      const verifyRes = await fetch('/api/funding/razorpay/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fundingRequestId: reqId,
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: signature
        })
      });
      const verifyData = await verifyRes.json();
      if (verifyRes.ok) {
        setFundStatus({
          success: true,
          message: `Razorpay test payment verified! Payment ID: ${paymentId}. ₹${Number(fundAmount).toLocaleString()} committed to ${targetStartup?.name}. 1% platform fee recorded.`
        });
        setFallbackPaymentInfo(null);
        fetchStartups();
      } else {
        setFundStatus({ error: verifyData.error || 'Signature verification failed' });
      }
    } catch {
      setFundStatus({ error: 'Failed to verify transaction' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStartup) return;

    setIsSubmitting(true);
    setFundStatus(null);
    setFallbackPaymentInfo(null);

    try {
      // 1. Submit funding request
      const res = await fetch('/api/funding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startupId: targetStartup._id,
          type: fundType,
          amount: Number(fundAmount),
          brandingLogoUrl: fundType === 'branding_partnership' ? brandingLogo : undefined,
          agreementAccepted
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setFundStatus({ error: data.error || 'Funding request failed' });
        setIsSubmitting(false);
        return;
      }

      const reqId = data.fundingRequest._id;

      // 2. Generate Razorpay Test Order
      const orderRes = await fetch('/api/funding/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fundingRequestId: reqId,
          amount: Number(fundAmount)
        })
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        setFundStatus({ error: orderData.error || 'Failed to create Razorpay test order' });
        setIsSubmitting(false);
        return;
      }

      // 3. Launch official Razorpay Checkout portal (Test Mode)
      const opened = await openRazorpayCheckout({
        keyId: orderData.keyId,
        orderId: orderData.orderId,
        amount: Number(fundAmount),
        name: `FoundersHub — ${targetStartup.name}`,
        description: fundType === 'branding_partnership' ? '30-Day Branding Sponsorship (Test Mode)' : 'Direct Venture Syndication (Test Mode)',
        prefill: {
          name: user?.name || 'Investor Admin',
          email: user?.email || 'investor@founderhub.com'
        },
        onSuccess: (paymentResp) => {
          completeFundVerification(
            reqId,
            paymentResp.razorpay_payment_id,
            paymentResp.razorpay_order_id,
            paymentResp.razorpay_signature
          );
        },
        onError: (err) => {
          setFundStatus({ error: err.description || 'Razorpay checkout was cancelled' });
          setIsSubmitting(false);
        },
        onDismiss: () => {
          setIsSubmitting(false);
        }
      });

      if (!opened) {
        setFallbackPaymentInfo({
          reqId,
          orderId: orderData.orderId,
          amount: Number(fundAmount)
        });
        setIsSubmitting(false);
      }
    } catch {
      setFundStatus({ error: 'Network error submitting funding request' });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Discover Verified Startups
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Explore ventures with verified Problem Statements, active execution sprints, or proven milestones.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, sector, or tech stack..."
              className="w-full glass-input pl-9 pr-3 py-2 text-xs text-white"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">Search</Button>
        </form>
      </div>

      {/* Filter Tabs & Dropdowns */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-2xl glass-panel mb-8 text-xs">
        
        {/* Stage Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Ventures' },
            { id: 'sprint_active', label: '⚡ Active Sprints' },
            { id: 'sprint_completed', label: '🎯 Sprint Completed' },
            { id: 'published', label: 'Published Ideas' },
            { id: 'funded', label: '🚀 Funded' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedStage(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
                selectedStage === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sector Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="glass-input px-2.5 py-1.5 text-xs text-white bg-transparent"
          >
            <option value="all" className="bg-slate-900">All Sectors</option>
            <option value="AI / Software" className="bg-slate-900">AI / Software</option>
            <option value="FinTech" className="bg-slate-900">FinTech</option>
            <option value="CleanTech" className="bg-slate-900">CleanTech</option>
            <option value="HealthTech" className="bg-slate-900">HealthTech</option>
            <option value="B2B SaaS" className="bg-slate-900">B2B SaaS</option>
          </select>
        </div>

      </div>

      {/* Startups List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-80 rounded-2xl glass-panel animate-pulse" />
          ))}
        </div>
      ) : startups.length === 0 ? (
        <div className="text-center py-20 glass-panel rounded-3xl p-8 max-w-lg mx-auto">
          <Sparkles className="w-8 h-8 text-indigo-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No startups found</h3>
          <p className="text-xs text-slate-400 mt-1">Try relaxing your search terms or filter selections.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {startups.map(startup => {
            const canFund = startup.stage === 'sprint_completed' || startup.stage === 'funded';

            return (
              <div
                key={startup._id}
                className="glass-panel border border-white/10 hover:border-indigo-500/40 rounded-2xl flex flex-col justify-between overflow-hidden group hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300"
              >
                <div>
                  {/* Image Cover */}
                  <div className="relative h-44 w-full bg-slate-800 overflow-hidden">
                    <Image
                      src={startup.images[0] || 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&auto=format&fit=crop&q=80'}
                      alt={startup.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent" />
                    
                    <div className="absolute top-3 left-3">
                      <Badge variant="stage" stage={startup.stage} />
                    </div>

                    <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10 flex items-center gap-1.5 text-xs font-bold text-white">
                      <span className="text-indigo-400">Score:</span>
                      <span>{startup.executionScore}/100</span>
                    </div>
                  </div>

                  {/* Body Content */}
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

                    {/* Problem Statement Preview */}
                    <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 text-[11px] text-slate-400 line-clamp-2 italic">
                      &ldquo;{startup.problemStatement}&rdquo;
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {startup.tags.map(t => (
                        <span key={t} className="px-2 py-0.5 rounded text-[10px] bg-white/5 border border-white/5 text-slate-400">
                          {t}
                        </span>
                      ))}
                    </div>

                    {/* Powered by Branding Partnerships Strip if any */}
                    {startup.brandingPartnerships && startup.brandingPartnerships.length > 0 && (
                      <div className="pt-2 border-t border-white/5 flex items-center gap-2">
                        <span className="text-[10px] uppercase font-semibold text-slate-500">Sponsored by:</span>
                        <div className="flex items-center gap-2">
                          {startup.brandingPartnerships.map((bp, i) => (
                            <span key={i} className="text-xs font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                              {bp.brandName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-5 pt-0 border-t border-white/5 mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs pt-3">
                    <span className="text-slate-400">Founder: {startup.founderName}</span>
                    <a
                      href={`/startups/${startup._id}`}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                    >
                      <span>View Profile</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="pt-1">
                    {/* Developer: ONLY Apply to Dept */}
                    {user?.role === 'developer' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openApplyModal(startup)}
                        className="w-full text-xs text-sky-300 border-sky-500/20 hover:bg-sky-500/10"
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        <span>Apply to Dept (Builder)</span>
                      </Button>
                    )}

                    {/* Investor: ONLY Commit Funds / Invest */}
                    {user?.role === 'investor' && (
                      <Button
                        variant={canFund ? 'glow' : 'ghost'}
                        size="sm"
                        disabled={!canFund}
                        onClick={() => openFundModal(startup)}
                        className={`w-full text-xs ${!canFund ? 'text-slate-500 border-white/5 cursor-not-allowed' : ''}`}
                        title={canFund ? 'Commit investment or 30-day sponsorship' : 'Funding locked until sprint is completed'}
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>{canFund ? 'Invest / Commit Funds' : 'Funding Gated (Sprint Active)'}</span>
                      </Button>
                    )}

                    {/* Founder of this venture: Manage Venture */}
                    {user?.role === 'founder' && user._id === startup.founderId && (
                      <a href={`/dashboard/founder?startupId=${startup._id}`} className="block w-full">
                        <Button variant="glow" size="sm" className="w-full text-xs flex items-center justify-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5" />
                          <span>Manage Your Venture</span>
                        </Button>
                      </a>
                    )}

                    {/* Guest or other users */}
                    {(!user || (user.role === 'founder' && user._id !== startup.founderId)) && (
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openApplyModal(startup)}
                          className="w-full text-xs text-sky-300 border-sky-500/20 hover:bg-sky-500/10"
                        >
                          <Code2 className="w-3.5 h-3.5" />
                          <span>Apply</span>
                        </Button>
                        <Button
                          variant={canFund ? 'glow' : 'ghost'}
                          size="sm"
                          disabled={!canFund}
                          onClick={() => openFundModal(startup)}
                          className={`w-full text-xs ${!canFund ? 'text-slate-500 border-white/5 cursor-not-allowed' : ''}`}
                          title={canFund ? 'Invest' : 'Gated'}
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>{canFund ? 'Invest' : 'Gated'}</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Apply as Developer */}
      <Modal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        title={`Join ${targetStartup?.name || 'Startup'} Department`}
        subtitle="Developers join exactly ONE department per sprint. Contribution points vest into equity."
      >
        {applyStatus?.success ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h4 className="text-base font-bold text-white">Application Submitted!</h4>
            <p className="text-xs text-slate-400">{applyStatus.message}</p>
            <Button variant="secondary" onClick={() => setApplyModalOpen(false)}>Close</Button>
          </div>
        ) : (
          <form onSubmit={handleApplySubmit} className="space-y-4">
            {applyStatus?.error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {applyStatus.error}
              </div>
            )}

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Single-Department Rule: You can apply to and work in only ONE department for this startup. Multi-department access requires explicit founder approval.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Select Department
              </label>
              <select
                required
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="w-full glass-input px-3 py-2 text-xs text-white bg-slate-900"
              >
                <option value="">Choose department to apply...</option>
                <option value={`dept_${targetStartup?._id}_development`}>Development (Fullstack / Architecture)</option>
                <option value={`dept_${targetStartup?._id}_design__ui_ux_`}>Design (UI/UX & Prototyping)</option>
                <option value={`dept_${targetStartup?._id}_marketing`}>Marketing (Growth & Viral Loops)</option>
                <option value={`dept_${targetStartup?._id}_product_management`}>Product Management (Backlog & Scoping)</option>
                <option value={`dept_${targetStartup?._id}_sales`}>Sales & Business Development</option>
                <option value={`dept_${targetStartup?._id}_customer_support`}>Customer Support & Community</option>
                <option value={`dept_${targetStartup?._id}_operations`}>Operations & Tooling</option>
                <option value={`dept_${targetStartup?._id}_finance`}>Finance & Unit Economics</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Cover Note & Motivation
              </label>
              <textarea
                required
                rows={3}
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value)}
                placeholder="What deliverables can you ship during this execution sprint?"
                className="w-full glass-input p-3 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Resume / Portfolio Link
              </label>
              <input
                type="url"
                value={resumeUrl}
                onChange={(e) => setResumeUrl(e.target.value)}
                placeholder="https://github.com/username or LinkedIn URL"
                className="w-full glass-input px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setApplyModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="glow" isLoading={isSubmitting}>
                Submit Application
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal: Investor Funding Commitment */}
      <Modal
        isOpen={fundModalOpen}
        onClose={() => setFundModalOpen(false)}
        title={`Fund ${targetStartup?.name || 'Startup'} (Test Mode)`}
        subtitle="1% platform fee is automatically deducted. Funds unlock only post-sprint completion."
      >
        {fundStatus?.success ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h4 className="text-base font-bold text-white">Commitment Recorded!</h4>
            <p className="text-xs text-slate-400">{fundStatus.message}</p>
            <Button variant="secondary" onClick={() => setFundModalOpen(false)}>Close</Button>
          </div>
        ) : (
          <form onSubmit={handleFundSubmit} className="space-y-4">
            {fundStatus?.error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {fundStatus.error}
              </div>
            )}

            {/* Type selector */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl glass-panel text-xs">
              <button
                type="button"
                onClick={() => setFundType('investment')}
                className={`py-2 rounded-lg font-semibold transition-all ${
                  fundType === 'investment' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Capital Investment
              </button>
              <button
                type="button"
                onClick={() => setFundType('branding_partnership')}
                className={`py-2 rounded-lg font-semibold transition-all ${
                  fundType === 'branding_partnership' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Branding Partner (30-day)
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Amount (INR)
              </label>
              <input
                type="number"
                required
                step="10000"
                min="10000"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                className="w-full glass-input px-3 py-2 text-sm font-bold text-white"
              />
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                <span>1% Platform Fee:</span>
                <span className="text-indigo-400 font-semibold">
                  ₹{(Number(fundAmount) * 0.01).toLocaleString()}
                </span>
              </div>
            </div>

            {fundType === 'branding_partnership' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Brand Logo URL (&ldquo;Powered By&rdquo; Strip)
                </label>
                <input
                  type="url"
                  required
                  value={brandingLogo}
                  onChange={(e) => setBrandingLogo(e.target.value)}
                  className="w-full glass-input px-3 py-2 text-xs text-white"
                />
              </div>
            )}

            {fallbackPaymentInfo ? (
              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs space-y-3">
                <div className="font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-400" />
                  <span>Razorpay Test Portal (In-App Sandbox)</span>
                </div>
                <p className="text-slate-300">
                  Razorpay Order <b className="text-white">{fallbackPaymentInfo.orderId}</b> generated for ₹{fallbackPaymentInfo.amount.toLocaleString()}. External checkout popup was prevented or blocked by browser.
                </p>
                <Button
                  type="button"
                  variant="glow"
                  className="w-full"
                  isLoading={isSubmitting}
                  onClick={() => completeFundVerification(
                    fallbackPaymentInfo.reqId,
                    `pay_test_${Date.now()}`,
                    fallbackPaymentInfo.orderId,
                    'test_mode_verified_sig'
                  )}
                >
                  Authorize Test Payment of ₹{fallbackPaymentInfo.amount.toLocaleString()}
                </Button>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1 text-xs text-slate-400">
                <div className="text-slate-200 font-medium flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Razorpay Test Mode Portal</span>
                </div>
                <div>Opens official Razorpay modal with test card & UPI simulators. 1% platform fee recorded.</div>
              </div>
            )}

            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  required
                  checked={agreementAccepted}
                  onChange={(e) => setAgreementAccepted(e.target.checked)}
                  className="mt-0.5 rounded border-white/20 bg-white/5 text-indigo-600 focus:ring-0"
                />
                <span>
                  I agree to the test mode term sheet and acknowledge that 1% platform fee will be allocated to FoundersHub treasury.
                </span>
              </label>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => { setFundModalOpen(false); setFallbackPaymentInfo(null); }}>Cancel</Button>
              <Button type="submit" variant="glow" isLoading={isSubmitting} disabled={!agreementAccepted}>
                Submit Commitment
              </Button>
            </div>
          </form>
        )}
      </Modal>

    </div>
  );
}
