'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { 
  ShieldCheck, 
  Clock, 
  Layers, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Code2, 
  TrendingUp, 
  ExternalLink,
  Briefcase,
  PieChart as PieIcon,
  Hash,
  Sparkles
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/components/auth/AuthContext';
import { PitchMediaViewer } from '@/components/media/PitchMediaViewer';
import { StartupDoc, SprintDoc, TimelineEventDoc } from '@/types';

const COLORS = ['#6366f1', '#38bdf8', '#a855f7', '#10b981', '#f59e0b', '#ec4899'];

export default function StartupProfilePage() {
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAuth();

  const [startup, setStartup] = useState<StartupDoc | null>(null);
  const [sprint, setSprint] = useState<SprintDoc | null>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<TimelineEventDoc[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  // Apply Modal
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [coverNote, setCoverNote] = useState('');
  const [applyStatus, setApplyStatus] = useState<any>(null);

  // Fund Modal
  const [fundModalOpen, setFundModalOpen] = useState(false);
  const [fundAmount, setFundAmount] = useState('500000');
  const [fundType, setFundType] = useState<'investment' | 'branding_partnership'>('investment');
  const [brandingLogo, setBrandingLogo] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80');
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [fundStatus, setFundStatus] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/startups/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.startup) {
          setStartup(data.startup);
          setSprint(data.sprint);
          setDepartments(data.departments || []);
          setTimeline(data.timeline || []);
          setIsOwner(data.isOwner || false);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-slate-400">Loading startup profile & sprint metrics...</p>
      </div>
    );
  }

  if (!startup) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center glass-panel rounded-3xl p-8 mt-10">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white">Startup Not Found</h2>
        <p className="text-xs text-slate-400 mt-1">This venture may have been removed or set to private.</p>
        <a href="/discover" className="mt-4 inline-block">
          <Button variant="secondary" size="sm">Back to Discover</Button>
        </a>
      </div>
    );
  }

  const equityData = Object.entries(startup.vestedEquitySplit || startup.proposedEquitySplit || { 'Founder': 70, 'Builders Pool': 30 }).map(([name, value]) => ({
    name,
    value: Number(value)
  }));

  const isFundingUnlocked = startup.stage === 'sprint_completed' || startup.stage === 'funded';
  const canFund = isFundingUnlocked && !startup.isFundingPaused;

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startupId: startup._id,
          departmentId: selectedDeptId,
          coverNote
        })
      });
      const data = await res.json();
      if (res.ok) {
        setApplyStatus({ success: true, message: data.message });
      } else {
        setApplyStatus({ error: data.error || 'Failed to submit' });
      }
    } catch {
      setApplyStatus({ error: 'Network error submitting application' });
    }
  };

  const handleFund = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/funding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startupId: startup._id,
          type: fundType,
          amount: Number(fundAmount),
          brandingLogoUrl: fundType === 'branding_partnership' ? brandingLogo : undefined,
          agreementAccepted
        })
      });
      const data = await res.json();
      if (res.ok) {
        setFundStatus({ success: true, message: data.message });
      } else {
        setFundStatus({ error: data.error || 'Failed to submit funding' });
      }
    } catch {
      setFundStatus({ error: 'Network error' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Hero Banner Card */}
      <div className="glass-panel-glow border border-white/10 rounded-3xl overflow-hidden relative">
        <div className="relative h-64 w-full bg-slate-900">
          <Image
            src={startup.images[0] || 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1200&auto=format&fit=crop&q=80'}
            alt={startup.name}
            fill
            priority
            className="object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-[#0b0f19]/70 to-transparent" />
          
          <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <Badge variant="stage" stage={startup.stage} />
                <span className="text-xs text-slate-300 font-medium px-2.5 py-0.5 rounded-full bg-white/10">
                  {startup.sector}
                </span>
                {startup.ownershipHash && (
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    <ShieldCheck className="w-3 h-3" />
                    <span>SHA-256 Proven</span>
                  </span>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                {startup.name}
              </h1>
              <p className="text-sm sm:text-base text-slate-300 font-normal">
                {startup.tagline}
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-3">
              {isOwner ? (
                <a href={`/dashboard/founder?startupId=${startup._id}`}>
                  <Button variant="glow" size="md" className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    <span>Manage Sprint Workspace</span>
                  </Button>
                </a>
              ) : (
                <>
                  {/* Developers see only Apply to Dept */}
                  {(!user || user.role === 'developer') && (
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => { setApplyStatus(null); setApplyModalOpen(true); }}
                      className="text-sky-300 border-sky-500/30 hover:bg-sky-500/10"
                    >
                      <Code2 className="w-4 h-4" />
                      <span>Apply to Dept</span>
                    </Button>
                  )}

                  {/* Investors see only Back with Capital */}
                  {(!user || user.role === 'investor') && (
                    <Button
                      variant={canFund ? 'glow' : 'ghost'}
                      size="md"
                      disabled={!canFund}
                      onClick={() => { setFundStatus(null); setFundModalOpen(true); }}
                      className={!canFund ? 'text-slate-500 border-white/5 cursor-not-allowed' : ''}
                      title={canFund ? 'Commit investment or sponsorship' : startup.isFundingPaused ? 'Funding intake is paused by founder' : 'Funding locked until sprint is completed'}
                    >
                      <TrendingUp className="w-4 h-4" />
                      <span>{canFund ? 'Back with Capital' : startup.isFundingPaused ? 'Funding Paused' : 'Funding Gated'}</span>
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* "Powered By" Branding Strip if active */}
      {startup.brandingPartnerships && startup.brandingPartnerships.length > 0 && (
        <div className="p-4 rounded-2xl glass-panel border border-indigo-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-indigo-300 font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Official Sponsor & Branding Partner:</span>
          </div>
          <div className="flex items-center gap-4">
            {startup.brandingPartnerships.map((bp, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">{bp.brandName}</span>
                <span className="text-[10px] text-slate-400">({bp.sponsorshipDurationDays}d sponsorship)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Details + Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Pitch Assets, Problem, Validation, Departments */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Pitch Video, PPT & Media Deck */}
          <PitchMediaViewer
            pitchVideoUrl={startup.pitchVideoUrl}
            pitchDeckUrl={startup.pitchDeckUrl}
            images={startup.images}
            startupName={startup.name}
          />

          {/* Problem Statement Card */}
          <div className="glass-panel p-6 border border-white/10 space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span>Problem Statement</span>
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {startup.problemStatement || 'No written problem statement provided yet.'}
            </p>
          </div>

          {/* Validation Evidence Card */}
          <div className="glass-panel p-6 border border-white/10 space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Validation Evidence & Traction</span>
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {startup.validationEvidence || 'Validation metrics pending review.'}
            </p>
          </div>

          {/* 8 Departments Breakdown */}
          <div className="glass-panel p-6 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <span>Execution Departments ({departments.length})</span>
              </h3>
              <span className="text-xs text-slate-400">Strict API isolation active</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {departments.map((dept) => (
                <div
                  key={dept._id}
                  className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-xs text-white">{dept.name}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Users className="w-3 h-3" />
                      <span>{dept.memberCount} active member{dept.memberCount === 1 ? '' : 's'}</span>
                    </div>
                  </div>

                  {dept.isMember ? (
                    <a href={`/departments/${dept._id}`}>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-semibold flex items-center gap-1">
                        Joined <ArrowRight className="w-3 h-3" />
                      </span>
                    </a>
                  ) : (
                    <button
                      onClick={() => { setSelectedDeptId(dept._id); setApplyModalOpen(true); }}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-white/5 hover:bg-white/10 text-sky-300 border border-sky-500/20 transition-colors"
                    >
                      Apply
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Audit Trail & Milestone History */}
          <div className="glass-panel p-6 border border-white/10 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <span>Verifiable Timeline & Audit Trail</span>
            </h3>

            {timeline.length === 0 ? (
              <p className="text-xs text-slate-400">No milestone events logged yet.</p>
            ) : (
              <div className="space-y-3 relative before:absolute before:inset-0 before:left-2.5 before:w-0.5 before:bg-white/10">
                {timeline.map((event) => (
                  <div key={event._id} className="relative pl-6 text-xs">
                    <div className="absolute left-1.5 top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-[#0b0f19]" />
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-200">{event.actorName || 'System'}</span>
                      <span>{new Date(event.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-slate-300 mt-0.5">{event.details}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Col: Execution Score, Equity Pie, Ownership Hash */}
        <div className="space-y-6">
          
          {/* Dynamic Execution Score Card */}
          <div className="glass-panel-glow p-6 border border-white/10 text-center space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Live Execution Score
            </h3>
            <ProgressRing
              value={startup.executionScore}
              size={120}
              strokeWidth={10}
              label="Score"
              sublabel="Delivery vs Commitment"
              colorGradient={startup.executionScore >= 80 ? 'emerald' : startup.executionScore >= 50 ? 'brand' : 'amber'}
            />
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-[11px] text-slate-400 text-left space-y-1">
              <div className="flex justify-between">
                <span>Task Delivery Velocity:</span>
                <span className="text-white font-medium">45 max</span>
              </div>
              <div className="flex justify-between">
                <span>Critical Milestones:</span>
                <span className="text-white font-medium">25 max</span>
              </div>
              <div className="flex justify-between">
                <span>Timeline Commits:</span>
                <span className="text-white font-medium">20 max</span>
              </div>
              <div className="flex justify-between">
                <span>Founder Commitment:</span>
                <span className="text-white font-medium">10 max</span>
              </div>
            </div>
          </div>

          {/* Equity Breakdown Pie Chart */}
          <div className="glass-panel p-6 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <PieIcon className="w-3.5 h-3.5 text-indigo-400" />
                <span>{startup.vestedEquitySplit ? 'Vested Equity Split' : 'Proposed Equity Split'}</span>
              </h3>
              <span className="text-[10px] text-indigo-300 font-semibold">100% Total</span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={equityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {equityData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                    formatter={(val: any) => [`${val}%`, 'Equity']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-white/5">
              {equityData.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-slate-300 font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold text-white">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cryptographic Ownership Proof Card */}
          {startup.ownershipHash && (
            <div className="glass-panel p-5 border border-emerald-500/20 bg-emerald-500/[0.02] space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <Hash className="w-4 h-4" />
                <span>Immutable Proof Hash</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Timestamped SHA-256 snapshot generated upon clearing the Readiness Gate:
              </p>
              <div className="font-mono text-[10px] text-slate-300 break-all p-2 rounded-lg bg-black/50 border border-white/5">
                {startup.ownershipHash}
              </div>
              <div className="text-[10px] text-slate-500">
                Timestamp: {startup.ownershipTimestamp ? new Date(startup.ownershipTimestamp).toUTCString() : 'Recorded'}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Apply Modal */}
      <Modal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        title={`Apply to ${startup.name}`}
        subtitle="Select a department to join the sprint and earn vested equity points."
      >
        {applyStatus?.success ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h4 className="text-base font-bold text-white">Application Sent!</h4>
            <p className="text-xs text-slate-400">{applyStatus.message}</p>
            <Button variant="secondary" onClick={() => setApplyModalOpen(false)}>Close</Button>
          </div>
        ) : (
          <form onSubmit={handleApply} className="space-y-4">
            {applyStatus?.error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {applyStatus.error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Department</label>
              <select
                required
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="w-full glass-input px-3 py-2 text-xs text-white bg-slate-900"
              >
                <option value="">Select target department...</option>
                {departments.map(d => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Why should the founder choose you?</label>
              <textarea
                required
                rows={3}
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value)}
                placeholder="Detail the technical or growth deliverables you will ship..."
                className="w-full glass-input p-3 text-xs text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setApplyModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="glow">Submit Application</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Fund Modal */}
      <Modal
        isOpen={fundModalOpen}
        onClose={() => setFundModalOpen(false)}
        title={`Fund ${startup.name}`}
        subtitle="Post-sprint execution backing (Razorpay Test Mode with 1% platform fee)."
      >
        {fundStatus?.success ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h4 className="text-base font-bold text-white">Commitment Sent!</h4>
            <p className="text-xs text-slate-400">{fundStatus.message}</p>
            <Button variant="secondary" onClick={() => setFundModalOpen(false)}>Close</Button>
          </div>
        ) : (
          <form onSubmit={handleFund} className="space-y-4">
            {fundStatus?.error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {fundStatus.error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl glass-panel text-xs">
              <button
                type="button"
                onClick={() => setFundType('investment')}
                className={`py-2 rounded-lg font-semibold ${fundType === 'investment' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
              >
                Direct Investment
              </button>
              <button
                type="button"
                onClick={() => setFundType('branding_partnership')}
                className={`py-2 rounded-lg font-semibold ${fundType === 'branding_partnership' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
              >
                Branding Sponsor (30d)
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Commitment Amount (INR)</label>
              <input
                type="number"
                required
                step="10000"
                min="10000"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                className="w-full glass-input px-3 py-2 text-sm font-bold text-white"
              />
              <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
                <span>1% Platform Fee:</span>
                <span className="text-indigo-400 font-semibold">₹{(Number(fundAmount) * 0.01).toLocaleString()}</span>
              </div>
            </div>

            {fundType === 'branding_partnership' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Brand Logo URL</label>
                <input
                  type="url"
                  required
                  value={brandingLogo}
                  onChange={(e) => setBrandingLogo(e.target.value)}
                  className="w-full glass-input px-3 py-2 text-xs text-white"
                />
              </div>
            )}

            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                required
                checked={agreementAccepted}
                onChange={(e) => setAgreementAccepted(e.target.checked)}
                className="mt-0.5 rounded border-white/20 bg-white/5 text-indigo-600"
              />
              <span>I acknowledge that 1% platform fee is deducted and this runs in test mode.</span>
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setFundModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="glow" disabled={!agreementAccepted}>Commit Funds</Button>
            </div>
          </form>
        )}
      </Modal>

    </div>
  );
}
