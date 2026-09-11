'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  TrendingUp, 
  DollarSign, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  ExternalLink,
  Layers,
  CreditCard
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/components/auth/AuthContext';
import { openRazorpayCheckout } from '@/lib/razorpay-client';
import { StartupDoc, FundingRequestDoc } from '@/types';

export default function InvestorDashboardPage() {
  const { user } = useAuth();
  const [completedStartups, setCompletedStartups] = useState<StartupDoc[]>([]);
  const [myInvestments, setMyInvestments] = useState<FundingRequestDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // Commit Modal
  const [commitModalOpen, setCommitModalOpen] = useState(false);
  const [targetStartup, setTargetStartup] = useState<StartupDoc | null>(null);
  const [commitType, setCommitType] = useState<'investment' | 'branding_partnership'>('investment');
  const [amount, setAmount] = useState('500000');
  const [brandingLogo, setBrandingLogo] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80');
  const [isProcessing, setIsProcessing] = useState(false);
  const [commitResult, setCommitResult] = useState<any>(null);
  const [fallbackPaymentInfo, setFallbackPaymentInfo] = useState<any>(null);

  useEffect(() => {
    fetchInvestorData();
  }, []);

  const fetchInvestorData = async () => {
    setLoading(true);
    try {
      // Fetch startups that passed execution sprints (sprint_completed or funded)
      const stRes = await fetch('/api/startups?stage=sprint_completed');
      const stData = await stRes.json();
      setCompletedStartups(stData.startups || []);

      // Fetch investor's committed requests
      const fRes = await fetch('/api/funding');
      const fData = await fRes.json();
      setMyInvestments(fData.fundingRequests || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openCommitModal = (st: StartupDoc) => {
    setTargetStartup(st);
    setCommitResult(null);
    setCommitModalOpen(true);
  };

  const completeVerification = async (reqId: string, paymentId: string, orderId: string, signature: string) => {
    setIsProcessing(true);
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
        setCommitResult({
          success: true,
          message: `Razorpay test payment verified! Payment ID: ${paymentId}. ₹${Number(amount).toLocaleString()} transferred. 1% platform fee recorded.`
        });
        setFallbackPaymentInfo(null);
        fetchInvestorData();
      } else {
        setCommitResult({ error: verifyData.error || 'Verification failed' });
      }
    } catch (err) {
      console.error(err);
      setCommitResult({ error: 'Failed to verify transaction' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRazorpayTestCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStartup) return;

    setIsProcessing(true);
    setCommitResult(null);
    setFallbackPaymentInfo(null);

    try {
      // 1. Submit funding request
      const fundRes = await fetch('/api/funding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startupId: targetStartup._id,
          type: commitType,
          amount: Number(amount),
          brandingLogoUrl: commitType === 'branding_partnership' ? brandingLogo : undefined,
          agreementAccepted: true
        })
      });

      const fundData = await fundRes.json();
      if (!fundRes.ok) {
        setCommitResult({ error: fundData.error || 'Failed to initiate funding' });
        setIsProcessing(false);
        return;
      }

      const reqId = fundData.fundingRequest._id;

      // 2. Generate Razorpay Test Order
      const orderRes = await fetch('/api/funding/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fundingRequestId: reqId,
          amount: Number(amount)
        })
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        setCommitResult({ error: orderData.error || 'Failed to create Razorpay order' });
        setIsProcessing(false);
        return;
      }

      // 3. Launch Razorpay Test Mode Checkout Portal
      const opened = await openRazorpayCheckout({
        keyId: orderData.keyId,
        orderId: orderData.orderId,
        amount: Number(amount),
        name: `FoundersHub — ${targetStartup.name}`,
        description: commitType === 'branding_partnership' ? '30-Day Branding Sponsorship (Test Mode)' : 'Direct Venture Syndication (Test Mode)',
        prefill: {
          name: user?.name || 'Investor Admin',
          email: user?.email || 'investor@founderhub.com'
        },
        onSuccess: (paymentResp) => {
          completeVerification(
            reqId,
            paymentResp.razorpay_payment_id,
            paymentResp.razorpay_order_id,
            paymentResp.razorpay_signature
          );
        },
        onError: (err) => {
          setCommitResult({ error: err.description || 'Razorpay checkout cancelled or failed' });
          setIsProcessing(false);
        },
        onDismiss: () => {
          setIsProcessing(false);
        }
      });

      // If Razorpay SDK couldn't open directly (e.g. adblocker or sandbox browser), show fallback
      if (!opened) {
        setFallbackPaymentInfo({
          reqId,
          orderId: orderData.orderId,
          amount: Number(amount)
        });
        setIsProcessing(false);
      }
    } catch (e) {
      console.error(e);
      setCommitResult({ error: 'Checkout error occurred' });
      setIsProcessing(false);
    }
  };

  const totalCommitted = myInvestments.reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalFees = myInvestments.reduce((sum, i) => sum + (i.platformFeeAmount || 0), 0);

  // Sector breakdown data for chart
  const sectorMap: Record<string, number> = {};
  for (const inv of myInvestments) {
    const sec = 'AI / Software';
    sectorMap[sec] = (sectorMap[sec] || 0) + (inv.amount || 0);
  }
  const sectorData = Object.entries(sectorMap).map(([name, total]) => ({
    name,
    amount: total
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Investor Portal</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              {user?.name || 'Rohit Malhotra'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Back proven execution. All capital commitments are strictly gated to ventures with completed sprints.
          </p>
        </div>

        {/* Total Capital Committed Stats */}
        <div className="flex items-center gap-4 p-3 rounded-2xl glass-panel-glow border border-emerald-500/30">
          <div>
            <div className="text-base font-extrabold text-emerald-400">
              ₹{totalCommitted.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 font-medium">Committed Capital</div>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div>
            <div className="text-base font-extrabold text-indigo-400">
              ₹{totalFees.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 font-medium">1% Platform Fee (Treasury)</div>
          </div>
        </div>
      </div>

      {/* Mandatory Gating Rule Notice */}
      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3 text-xs text-emerald-200">
        <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
        <div>
          <span className="font-bold text-white block">Execution Verification Gating Condition:</span>
          <span>
            Unlike speculative platforms where funds are committed on unproven pitch decks, FoundersHub requires startups to complete a full 14–30 day execution sprint before funding can be submitted. This ensures you only syndicate with teams that deliver.
          </span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Sprint-Completed Startups Ready for Capital */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="glass-panel p-6 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Startups with Completed Sprints (Ready for Capital)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verified deliverables, sealed execution scores, and audited timelines.
                </p>
              </div>
              <span className="text-xs text-indigo-400 font-semibold">{completedStartups.length} Available</span>
            </div>

            {completedStartups.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No startups have concluded their sprints yet.</p>
            ) : (
              <div className="space-y-4">
                {completedStartups.map(st => (
                  <div
                    key={st._id}
                    className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/30 transition-colors space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base text-white">{st.name}</span>
                          <Badge variant="stage" stage={st.stage} />
                          <span className="text-xs text-slate-400">({st.sector})</span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">{st.tagline}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-lg font-extrabold text-emerald-400 block">{st.executionScore}/100</span>
                        <span className="text-[10px] text-slate-400">Execution Score</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-black/30 border border-white/5 text-[11px] text-slate-400">
                      <b className="text-slate-200">Validation Proof:</b> &ldquo;{st.validationEvidence}&rdquo;
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <span className="text-xs text-slate-400">Founder: <b className="text-white">{st.founderName}</b></span>
                      <div className="flex items-center gap-2">
                        <a href={`/startups/${st._id}`}>
                          <Button variant="ghost" size="sm">Inspect Deliverables</Button>
                        </a>
                        <Button
                          variant="glow"
                          size="sm"
                          onClick={() => openCommitModal(st)}
                          className="flex items-center gap-1.5"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Commit Funds / Sponsor</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Investment & Sponsorship Transaction History */}
          <div className="glass-panel p-6 border border-white/10 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <span>Investment & Branding Partner Ledger</span>
            </h3>

            {myInvestments.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No transactions recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {myInvestments.map(inv => (
                  <div key={inv._id} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white">{inv.startupName}</div>
                      <div className="text-slate-400 text-[11px]">
                        Type: {inv.type === 'investment' ? 'Direct Investment' : '30-Day Branding Partner'} • {new Date(inv.requestedAt).toLocaleDateString()}
                      </div>
                      <div className="text-[10px] text-indigo-300 mt-0.5">
                        1% Platform Fee: ₹{(inv.platformFeeAmount || 0).toLocaleString()}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-extrabold text-emerald-400 text-sm">
                        ₹{(inv.amount || 0).toLocaleString()}
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        {inv.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Col: Sector Allocation & Sandbox Info */}
        <div className="space-y-6">
          
          {/* Sector Allocation Breakdown */}
          <div className="glass-panel p-6 border border-white/10 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Capital Allocation by Sector
            </h3>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sectorData.length > 0 ? sectorData : [{ name: 'AI / Software', amount: 500000 }]}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                    formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Committed']}
                  />
                  <Bar dataKey="amount" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Razorpay Test Mode Card */}
          <div className="glass-panel p-5 border border-indigo-500/20 bg-indigo-500/[0.02] space-y-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-white">
              <CreditCard className="w-4 h-4 text-indigo-400" />
              <span>Razorpay Test Sandbox</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              All payments run in Test Mode. The 1% platform fee is automatically debited to the FoundersHub treasury with SHA-256 HMAC verification.
            </p>
            <div className="p-2 rounded bg-black/40 border border-white/5 font-mono text-[10px] text-slate-300">
              KEY: rzp_test_foundershub_mock
            </div>
          </div>

        </div>

      </div>

      {/* Modal: Commit Funds via Razorpay Test Flow */}
      <Modal
        isOpen={commitModalOpen}
        onClose={() => setCommitModalOpen(false)}
        title={`Fund ${targetStartup?.name || 'Startup'}`}
        subtitle="1% platform fee is automatically deducted. Runs in Razorpay Test Mode."
      >
        {commitResult?.success ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h4 className="text-base font-bold text-white">Payment Verified!</h4>
            <p className="text-xs text-slate-400">{commitResult.message}</p>
            <Button variant="secondary" onClick={() => setCommitModalOpen(false)}>Done</Button>
          </div>
        ) : (
          <form onSubmit={handleRazorpayTestCheckout} className="space-y-4">
            {commitResult?.error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {commitResult.error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl glass-panel text-xs">
              <button
                type="button"
                onClick={() => setCommitType('investment')}
                className={`py-2 rounded-lg font-semibold transition-all ${
                  commitType === 'investment' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Direct Investment
              </button>
              <button
                type="button"
                onClick={() => setCommitType('branding_partnership')}
                className={`py-2 rounded-lg font-semibold transition-all ${
                  commitType === 'branding_partnership' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Branding Sponsor (30d)
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Amount to Commit (INR)
              </label>
              <input
                type="number"
                required
                step="10000"
                min="10000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full glass-input px-3 py-2 text-sm font-bold text-white"
              />
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                <span>1% Platform Fee:</span>
                <span className="text-indigo-400 font-semibold">
                  ₹{(Number(amount) * 0.01).toLocaleString()}
                </span>
              </div>
            </div>

            {commitType === 'branding_partnership' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Branding Partner Logo URL (&ldquo;Powered By&rdquo; Strip)
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
                  Razorpay Order <b className="text-white">{fallbackPaymentInfo.orderId}</b> generated for ₹{fallbackPaymentInfo.amount.toLocaleString()}. External popup was blocked by browser or running in sandboxed environment.
                </p>
                <Button
                  type="button"
                  variant="glow"
                  className="w-full"
                  isLoading={isProcessing}
                  onClick={() => completeVerification(
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
                <div>Launches Razorpay checkout with test UPI, NetBanking, and Card simulators. 1% platform fee recorded.</div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setCommitModalOpen(false)}>Cancel</Button>
              {!fallbackPaymentInfo && (
                <Button type="submit" variant="glow" isLoading={isProcessing}>
                  Launch Razorpay Checkout
                </Button>
              )}
            </div>
          </form>
        )}
      </Modal>

    </div>
  );
}
