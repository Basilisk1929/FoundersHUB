'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Layers, 
  Code2, 
  Cpu, 
  BarChart3, 
  Palette, 
  ShieldCheck, 
  DollarSign, 
  Briefcase, 
  ArrowRight, 
  Users, 
  CheckCircle2, 
  Sparkles,
  Bot
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/components/auth/AuthContext';

interface StandardDept {
  name: string;
  code: string;
  role: string;
  icon: React.ElementType;
  color: string;
  accentBorder: string;
  deliverables: string[];
  samplePoints: number;
}

const STANDARD_DEPTS: StandardDept[] = [
  {
    name: 'Core Engineering',
    code: 'ENG',
    role: 'Backend APIs, database schemas, and microservice pipelines.',
    icon: Code2,
    color: 'from-blue-500/20 to-indigo-500/20 text-blue-400',
    accentBorder: 'border-blue-500/30',
    deliverables: ['Auth & RBAC', 'REST / GraphQL APIs', 'DB Schema Migrations', 'Unit Test Coverage > 80%'],
    samplePoints: 45
  },
  {
    name: 'Frontend & Experience',
    code: 'FE',
    role: 'Responsive UI, responsive components, accessibility, and state management.',
    icon: Palette,
    color: 'from-purple-500/20 to-pink-500/20 text-purple-400',
    accentBorder: 'border-purple-500/30',
    deliverables: ['Design System Implementation', 'Client State & Query Caching', 'Motion & Glassmorphic UI'],
    samplePoints: 40
  },
  {
    name: 'AI & Machine Learning',
    code: 'AI',
    role: 'Gemini multi-turn copilots, prompt grounding, and vector search pipelines.',
    icon: Cpu,
    color: 'from-amber-500/20 to-orange-500/20 text-amber-400',
    accentBorder: 'border-amber-500/30',
    deliverables: ['Gemini 1.5/2.0 Integration', 'Context Grounding & Prompts', 'Streaming Telemetry'],
    samplePoints: 50
  },
  {
    name: 'Growth & Marketing',
    code: 'MKT',
    role: 'SEO indexing, social proof, analytics tracking, and conversion funnels.',
    icon: BarChart3,
    color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400',
    accentBorder: 'border-emerald-500/30',
    deliverables: ['Metadata & OpenGraph Tags', 'Waitlist Onboarding Funnel', 'Campaign UTM Analytics'],
    samplePoints: 30
  },
  {
    name: 'DevOps & Cloud Infra',
    code: 'OPS',
    role: 'CI/CD workflows, Docker containerization, edge CDN, and cluster health.',
    icon: Layers,
    color: 'from-cyan-500/20 to-sky-500/20 text-cyan-400',
    accentBorder: 'border-cyan-500/30',
    deliverables: ['GitHub Actions Workflows', 'Vercel / Cloudflare Edge Config', 'Secret Management'],
    samplePoints: 35
  },
  {
    name: 'Product & UX Design',
    code: 'DES',
    role: 'Figma prototypes, design tokens, interaction specs, and usability audits.',
    icon: Sparkles,
    color: 'from-rose-500/20 to-red-500/20 text-rose-400',
    accentBorder: 'border-rose-500/30',
    deliverables: ['High-fidelity Prototypes', 'Design Token Specifications', 'Usability Test Synthesis'],
    samplePoints: 35
  },
  {
    name: 'Legal & Regulatory',
    code: 'LEG',
    role: 'DPIIT compliance, safe harbor terms, DPDP compliance, and escrow SPVs.',
    icon: ShieldCheck,
    color: 'from-indigo-500/20 to-violet-500/20 text-indigo-400',
    accentBorder: 'border-indigo-500/30',
    deliverables: ['Founder-Builder IP Assignment', 'DPDP Data Privacy Attestation', 'Escrow SPV Bylaws'],
    samplePoints: 30
  },
  {
    name: 'Finance & Tokenomics',
    code: 'FIN',
    role: 'Cap table modeling, dynamic vesting calculations, and Razorpay fee accounting.',
    icon: DollarSign,
    color: 'from-green-500/20 to-emerald-500/20 text-green-400',
    accentBorder: 'border-green-500/30',
    deliverables: ['1% Platform Fee Ledger', 'Dynamic Vesting Point Math', 'Burn Rate Projections'],
    samplePoints: 35
  }
];

export default function DepartmentsIndexPage() {
  const { user } = useAuth();
  const [activeDepts, setActiveDepts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user has active departments via startups or applications
    fetch('/api/startups')
      .then(res => res.json())
      .then(data => {
        const myStartups = data.startups || [];
        if (myStartups.length > 0) {
          // fetch first startup's departments
          const st = myStartups[0];
          fetch(`/api/startups/${st._id}`)
            .then(r => r.json())
            .then(d => {
              setActiveDepts(d.departments || []);
            })
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
              <Layers className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              8-Department Project Management
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Every venture on FoundersHub executes through 8 standardized, API-isolated departments.
            Builders collaborate on Kanban backlogs, commit code, and vest equity points with cryptographic accountability.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {user?.role === 'founder' && (
            <Link href="/dashboard/founder">
              <Button variant="glow" size="sm" className="flex items-center gap-1.5">
                <span>Manage in Founder Hub</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          )}
          {user?.role === 'developer' && (
            <Link href="/dashboard/developer">
              <Button variant="glow" size="sm" className="flex items-center gap-1.5">
                <span>Open Dev Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Active Department Workspaces (If any) */}
      {activeDepts.length > 0 && (
        <div className="p-6 rounded-2xl glass-panel-glow border border-indigo-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Active Sprint Workspaces</span>
            </h2>
            <span className="text-xs text-indigo-300 font-medium">
              {activeDepts.length} Departments Online
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {activeDepts.map(dept => (
              <Link
                key={dept._id}
                href={`/departments/${dept._id}`}
                className="p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-indigo-500/50 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {dept.name}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>{dept.memberCount} member{dept.memberCount === 1 ? '' : 's'}</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-indigo-400 font-semibold pt-2 border-t border-white/5">
                  <span>Open Kanban</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 8 Standardized Department Matrix */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">
            Standardized Sprint Departments
          </h2>
          <span className="text-xs text-slate-400">
            Isolated Kanbans • Dynamic Vesting • AI Mentors
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {STANDARD_DEPTS.map(dept => {
            const DeptIcon = dept.icon;
            return (
              <div
                key={dept.name}
                className={`p-5 rounded-2xl glass-panel border ${dept.accentBorder} flex flex-col justify-between space-y-4 hover:scale-[1.01] transition-transform`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${dept.color} flex items-center justify-center`}>
                      <DeptIcon className="w-5 h-5" />
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-white border border-white/10">
                      {dept.code}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white">{dept.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{dept.role}</p>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-white/5">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Key Deliverables
                    </span>
                    {dept.deliverables.map((d, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                        <CheckCircle2 className="w-3 h-3 text-indigo-400 shrink-0" />
                        <span className="truncate">{d}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Est. Sprint Points</span>
                  <span className="font-bold text-amber-400">~{dept.samplePoints} pts</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
