'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Hash, 
  CheckCircle2, 
  FileCheck, 
  Lock, 
  AlertCircle,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function TrustCompliancePage() {
  const [testText, setTestText] = useState('ApexAI Logistics: Autonomous electric freight routing platform');
  const [testHash, setTestHash] = useState('');

  const calculateHash = async () => {
    const encoder = new TextEncoder();
    const data = encoder.encode(testText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    setTestHash(hashHex);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Institutional Trust & Integrity</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
          Trust, Governance & DPIIT Alignment
        </h1>
        <p className="text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          How FoundersHub ensures accountability, cryptographic ownership proof, and statutory compliance across our three-sided venture community.
        </p>
      </div>

      {/* Grid: 3 Pillars of Trust */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="glass-panel p-6 border border-white/10 rounded-3xl space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
            <Hash className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-base">SHA-256 Ownership Proof</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            When an idea clears the Readiness Gate, its canonical text and UTC timestamp are cryptographically hashed using SHA-256. This creates an indisputable digital fingerprint verifying which founder conceived and registered the solution first.
          </p>
        </div>

        <div className="glass-panel p-6 border border-white/10 rounded-3xl space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <FileCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-base">DPIIT Startup India Alignment</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Our Readiness Gate criteria adhere directly to Startup India innovation guidelines: verifying genuine customer problem resolution, innovative business models, and job creation potential.
          </p>
        </div>

        <div className="glass-panel p-6 border border-white/10 rounded-3xl space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-base">Self-Attested Government Badges</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Members can self-attest their Aadhaar and PAN documents with masked 4-digit verification. This generates a verifiable trust badge without storing plaintext identification numbers in unencrypted databases.
          </p>
        </div>

      </div>

      {/* Interactive SHA-256 Verifier Sandbox */}
      <div className="glass-panel-glow p-8 border border-white/10 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Interactive Cryptographic Ownership Simulator</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Type any problem statement below to witness how the SHA-256 snapshot is computed live in your browser.
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <textarea
            rows={3}
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            className="w-full glass-input p-3 text-xs text-white"
          />

          <div className="flex items-center gap-3">
            <Button variant="glow" size="sm" onClick={calculateHash}>
              Generate SHA-256 Digest
            </Button>
            {testHash && (
              <span className="text-[11px] text-emerald-400 font-medium">
                ✓ Digest generated
              </span>
            )}
          </div>

          {testHash && (
            <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-1">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Computed Hash:</div>
              <div className="font-mono text-xs text-indigo-300 break-all">{testHash}</div>
            </div>
          )}
        </div>
      </div>

      {/* Production Security & Compliance Notice */}
      <div className="p-6 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 space-y-2 text-xs text-indigo-200">
        <div className="flex items-center gap-2 font-bold text-white text-sm">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span>Institutional Escrow & Gating Standards</span>
        </div>
        <p className="leading-relaxed text-slate-300">
          FoundersHub enforces cryptographic tamper-evidence (SHA-256 snapshots), automated 1% platform fee accounting, and strict post-sprint capital gating to ensure capital is committed solely to verified delivery milestones.
        </p>
      </div>

    </div>
  );
}
