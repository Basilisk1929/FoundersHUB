'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Code2, 
  Star, 
  GitFork, 
  BookOpen, 
  ExternalLink, 
  FileText, 
  Download, 
  Eye, 
  Upload, 
  Edit3, 
  Plus, 
  MapPin, 
  Clock, 
  Globe, 
  Award, 
  Zap, 
  TrendingUp, 
  X, 
  Check, 
  Sparkles,
  Layers,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Trash2,
  Pin
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DeveloperProfile, PastProject, WorkExperience, EducationItem, ContributionDay } from '@/types';

interface DeveloperProfileViewProps {
  initialUserId?: string;
  isOwner?: boolean;
}

export function DeveloperProfileView({ initialUserId, isOwner = true }: DeveloperProfileViewProps) {
  const [profile, setProfile] = useState<DeveloperProfile | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'resume' | 'activity'>('overview');

  // Modals state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [isPreviewResumeOpen, setIsPreviewResumeOpen] = useState(false);
  const [isUploadResumeOpen, setIsUploadResumeOpen] = useState(false);
  const [hoveredDay, setHoveredDay] = useState<ContributionDay | null>(null);

  // Form states
  const [editForm, setEditForm] = useState<any>({});
  const [newProjectForm, setNewProjectForm] = useState<Partial<PastProject>>({
    primaryLanguage: 'TypeScript',
    languageColor: '#3178C6',
    techStack: ['TypeScript', 'React'],
    isPinned: true
  });
  const [customTechInput, setCustomTechInput] = useState('');
  const [resumeUploadUrl, setResumeUploadUrl] = useState('');
  const [resumeFileNameInput, setResumeFileNameInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, [initialUserId]);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const url = initialUserId ? `/api/developer/profile?userId=${initialUserId}` : '/api/developer/profile';
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.profile) {
        setProfile(data.profile);
        setUserData(data.user);
        setEditForm({
          handle: data.profile.handle || '',
          headline: data.profile.headline || '',
          location: data.profile.location || '',
          githubUsername: data.profile.githubUsername || '',
          codechefUsername: data.profile.codechefUsername || '',
          linkedinUrl: data.profile.linkedinUrl || '',
          websiteUrl: data.profile.websiteUrl || '',
          resumeUrl: data.profile.resumeUrl || '',
          resumeSummary: data.profile.resumeSummary || '',
          bio: data.user?.bio || '',
          rating: data.profile.rating || 2184,
          division: data.profile.division || 'Division 1'
        });
      }
    } catch (e) {
      console.error('Failed to fetch developer profile', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch('/api/developer/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (res.ok && data.profile) {
        setProfile(data.profile);
        setSaveMessage('Profile saved successfully!');
        setTimeout(() => {
          setIsEditProfileOpen(false);
          setSaveMessage(null);
        }, 1200);
      }
    } catch (e) {
      console.error('Save error', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectForm.title) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/developer/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_project',
          project: newProjectForm
        })
      });
      const data = await res.json();
      if (res.ok && data.profile) {
        setProfile(data.profile);
        setIsAddProjectOpen(false);
        setNewProjectForm({
          primaryLanguage: 'TypeScript',
          languageColor: '#3178C6',
          techStack: ['TypeScript'],
          isPinned: true
        });
      }
    } catch (e) {
      console.error('Add project error', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to remove this project from your profile?')) return;
    try {
      const res = await fetch('/api/developer/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_project',
          projectId
        })
      });
      const data = await res.json();
      if (res.ok && data.profile) {
        setProfile(data.profile);
      }
    } catch (e) {
      console.error('Delete project error', e);
    }
  };

  const handleTogglePin = async (projectId: string) => {
    try {
      const res = await fetch('/api/developer/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_pin',
          projectId
        })
      });
      const data = await res.json();
      if (res.ok && data.profile) {
        setProfile(data.profile);
      }
    } catch (e) {
      console.error('Toggle pin error', e);
    }
  };

  const handleSaveResume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeUploadUrl) return;
    setIsSaving(true);
    try {
      const fileName = resumeFileNameInput || 'Developer_Resume.pdf';
      const res = await fetch('/api/developer/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeUrl: resumeUploadUrl,
          resumeFilename: fileName,
          resumeLastUpdated: new Date().toISOString().split('T')[0]
        })
      });
      const data = await res.json();
      if (res.ok && data.profile) {
        setProfile(data.profile);
        setIsUploadResumeOpen(false);
      }
    } catch (e) {
      console.error('Update resume error', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFileNameInput(file.name);
      // Create local object URL for preview or upload
      const localUrl = URL.createObjectURL(file);
      setResumeUploadUrl(localUrl);
    }
  };

  // Organize heatmap into 52 weeks x 7 days
  const heatmapWeeks = useMemo(() => {
    if (!profile?.contributionHeatmap) return [];
    const days = profile.contributionHeatmap;
    const weeks: ContributionDay[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  }, [profile?.contributionHeatmap]);

  const totalContributionsYear = useMemo(() => {
    if (!profile?.contributionHeatmap) return 612;
    return profile.contributionHeatmap.reduce((sum, d) => sum + d.count, 0);
  }, [profile?.contributionHeatmap]);

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <span className="text-xs text-slate-400">Loading GitHub & CodeChef Profile...</span>
        </div>
      </div>
    );
  }

  const pinnedProjects = (profile?.pastProjects || []).filter(p => p.isPinned);
  const otherProjects = (profile?.pastProjects || []).filter(p => !p.isPinned);

  return (
    <div className="space-y-6 text-slate-200">
      
      {/* 1. HERO HEADER: GitHub Profile Banner */}
      <div className="relative rounded-2xl bg-gradient-to-b from-[#161b22] to-[#0d1117] border border-[#30363d] p-6 lg:p-8 shadow-xl overflow-hidden">
        {/* Background glow lines */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          {/* Avatar & Identifiers */}
          <div className="flex items-start sm:items-center gap-5">
            <div className="relative shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-white/20 bg-slate-800 shadow-2xl ring-4 ring-indigo-500/20">
                <img 
                  src={userData?.photoUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80'} 
                  alt={userData?.name || 'Developer'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-[#1f6feb] text-[10px] font-bold text-white border border-[#0d1117] flex items-center gap-1 shadow">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>ACTIVE</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {userData?.name || 'Priya Sharma'}
                </h1>
                <span className="text-sm font-medium text-slate-400">
                  @{profile?.handle || 'priyasharma'}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">
                  she/her
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  <Zap className="w-3 h-3" />
                  <span>Open to Sprints</span>
                </span>
              </div>

              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                {profile?.headline || 'Senior Full-Stack & Distributed Systems Engineer | ex-Stripe'}
              </p>

              {/* Meta pills & Social links */}
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-400">
                {profile?.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{profile.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>09:30 AM Local Time</span>
                </div>
                {profile?.githubUsername && (
                  <a 
                    href={`https://github.com/${profile.githubUsername}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 hover:underline transition-colors"
                  >
                    <span>github/{profile.githubUsername}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {profile?.codechefUsername && (
                  <a 
                    href={`https://codechef.com/users/${profile.codechefUsername}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-1 text-amber-400 hover:text-amber-300 hover:underline transition-colors"
                  >
                    <span>codechef/{profile.codechefUsername}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {profile?.websiteUrl && (
                  <a 
                    href={profile.websiteUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-1 text-slate-300 hover:text-white hover:underline transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5 text-slate-500" />
                    <span>Portfolio</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Action CTAs: Edit & Resume */}
          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
            <button
              onClick={() => setIsPreviewResumeOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 font-semibold text-xs flex items-center gap-2 transition-all shadow-sm"
            >
              <FileText className="w-4 h-4 text-purple-400" />
              <span>View Résumé</span>
            </button>

            {isOwner && (
              <button
                onClick={() => setIsEditProfileOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-sm"
              >
                <Edit3 className="w-4 h-4 text-slate-400" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab navigation within profile */}
        <div className="flex items-center gap-2 border-t border-[#30363d] mt-6 pt-4 text-xs font-semibold">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'overview' ? 'bg-white/10 text-white border border-white/10' : 'text-slate-400 hover:text-white'}`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>
          <button 
            onClick={() => setActiveTab('projects')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'projects' ? 'bg-white/10 text-white border border-white/10' : 'text-slate-400 hover:text-white'}`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Past Projects ({profile?.pastProjects?.length || 0})</span>
          </button>
          <button 
            onClick={() => setActiveTab('resume')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'resume' ? 'bg-white/10 text-white border border-white/10' : 'text-slate-400 hover:text-white'}`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Résumé & Vault</span>
          </button>
          <button 
            onClick={() => setActiveTab('activity')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'activity' ? 'bg-white/10 text-white border border-white/10' : 'text-slate-400 hover:text-white'}`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Sprint Heatmap</span>
          </button>
        </div>
      </div>

      {/* 2. CODECHEF RATING & COMPETITIVE CODING BANNER */}
      <div className="rounded-2xl bg-gradient-to-r from-[#1c1829] via-[#161b28] to-[#121f2d] border border-white/10 p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          
          {/* Star rating & Elo score */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest text-amber-400 font-bold flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                <span>CodeChef & Sprint Rating</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                {profile?.division || 'Division 1'}
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
                {profile?.rating || 2184}
              </span>
              <div className="flex items-center text-amber-400">
                {[...Array(profile?.starsRating || 5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <span className="text-xs text-slate-400">
                (Peak: <span className="text-slate-200 font-semibold">2240</span>)
              </span>
            </div>

            <p className="text-xs text-slate-300">
              Ranked in the top <strong className="text-amber-300">1.2%</strong> of all builders across competitive algorithmic contests and startup execution sprints.
            </p>
          </div>

          {/* Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-center space-y-0.5">
              <div className="text-[10px] uppercase font-bold text-slate-400">Global Rank</div>
              <div className="text-lg font-bold text-white">#{profile?.globalRank || 142}</div>
              <div className="text-[10px] text-emerald-400 font-medium">Top Tier</div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-center space-y-0.5">
              <div className="text-[10px] uppercase font-bold text-slate-400">Country Rank</div>
              <div className="text-lg font-bold text-white">#{profile?.countryRank || 28}</div>
              <div className="text-[10px] text-sky-400 font-medium">India (IN)</div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-center space-y-0.5">
              <div className="text-[10px] uppercase font-bold text-slate-400">Equity Points</div>
              <div className="text-lg font-bold text-amber-400 font-mono">{userData?.totalPoints || 210} pts</div>
              <div className="text-[10px] text-amber-300/80 font-medium">~12.8% Est. Equity</div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-center space-y-0.5">
              <div className="text-[10px] uppercase font-bold text-slate-400">Sprints Finished</div>
              <div className="text-lg font-bold text-indigo-400">6 Sprints</div>
              <div className="text-[10px] text-indigo-300/80 font-medium">100% On-Time</div>
            </div>
          </div>
        </div>

        {/* Breakdown bar: Task difficulties & Primary Languages */}
        <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Difficulty Solved distribution */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span>Sprint Deliverables & Problems Solved:</span>
              <span className="text-white font-semibold">104 Total Solved</span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden flex">
              <div style={{ width: '46%' }} className="bg-emerald-500 h-full" title="Easy: 48" />
              <div style={{ width: '33%' }} className="bg-amber-500 h-full" title="Medium: 34" />
              <div style={{ width: '13%' }} className="bg-purple-500 h-full" title="Hard: 14" />
              <div style={{ width: '8%' }} className="bg-rose-500 h-full" title="Critical: 8" />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Easy: 48</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Med: 34</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Hard: 14</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Critical: 8</span>
            </div>
          </div>

          {/* Primary Language breakdown */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span>Codebase Language Breakdown:</span>
              <span className="text-white font-semibold">4 Primary Stacks</span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden flex">
              <div style={{ width: '42%' }} className="bg-[#3178C6] h-full" title="TypeScript: 42%" />
              <div style={{ width: '28%' }} className="bg-[#00ADD8] h-full" title="Go: 28%" />
              <div style={{ width: '18%' }} className="bg-[#DEA584] h-full" title="Rust: 18%" />
              <div style={{ width: '12%' }} className="bg-[#3572A5] h-full" title="Python: 12%" />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#3178C6]" /> TypeScript 42%</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#00ADD8]" /> Go 28%</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#DEA584]" /> Rust 18%</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#3572A5]" /> Python 12%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. GITHUB CONTRIBUTION HEATMAP MATRIX */}
      <div className="rounded-2xl bg-[#0d1117] border border-[#30363d] p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#21262d] pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>{totalContributionsYear} Contributions in the last year</span>
            </h3>
            <p className="text-xs text-slate-400">
              Verified sprint task completions, git commits, code reviews, and architectural deliverables.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="text-slate-400">
              Current Streak: <strong className="text-emerald-400 font-mono">{profile?.streakDays || 19} days</strong>
            </div>
            <div className="text-slate-400">
              Longest Streak: <strong className="text-white font-mono">{profile?.longestStreak || 48} days</strong>
            </div>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto py-2">
          <div className="min-w-[760px]">
            {/* Months Header */}
            <div className="flex justify-between text-[10px] text-slate-500 pb-1.5 px-1 font-mono">
              <span>Sep</span>
              <span>Oct</span>
              <span>Nov</span>
              <span>Dec</span>
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
              <span>Jul</span>
              <span>Aug</span>
              <span>Sep</span>
            </div>

            {/* Matrix: 52 columns x 7 rows */}
            <div className="flex gap-[3px]">
              {heatmapWeeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-[3px]">
                  {week.map((day, dIdx) => {
                    const colorClass = 
                      day.level === 4 ? 'bg-[#39d353] border-[#39d353]' :
                      day.level === 3 ? 'bg-[#26a641] border-[#26a641]' :
                      day.level === 2 ? 'bg-[#006d32] border-[#006d32]' :
                      day.level === 1 ? 'bg-[#0e4429] border-[#0e4429]' :
                      'bg-[#161b22] border-[#21262d]';

                    return (
                      <div
                        key={dIdx}
                        onMouseEnter={() => setHoveredDay(day)}
                        onMouseLeave={() => setHoveredDay(null)}
                        className={`w-3 h-3 rounded-[2.5px] border cursor-pointer transition-transform hover:scale-125 ${colorClass}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Heatmap Footer Legend & Hover State */}
            <div className="flex items-center justify-between text-xs pt-3 text-slate-400">
              <div className="text-[11px] h-4">
                {hoveredDay ? (
                  <span className="font-medium text-white">
                    <strong className="text-emerald-400">{hoveredDay.count} contribution{hoveredDay.count === 1 ? '' : 's'}</strong> on {hoveredDay.date}
                  </span>
                ) : (
                  <span>Hover over squares to inspect daily velocity</span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                <span>Less</span>
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#161b22] border border-[#21262d]" />
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#0e4429]" />
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#006d32]" />
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#26a641]" />
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#39d353]" />
                <span>More</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. PINNED PAST PROJECTS (GitHub Repository Cards) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Pin className="w-4 h-4 text-indigo-400" />
              <span>Pinned Past Projects & Repositories</span>
            </h2>
            <span className="text-xs text-slate-400">
              ({pinnedProjects.length} Pinned)
            </span>
          </div>

          {isOwner && (
            <button
              onClick={() => setIsAddProjectOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Past Project</span>
            </button>
          )}
        </div>

        {pinnedProjects.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#0d1117] border border-[#30363d] text-center space-y-2">
            <p className="text-sm text-slate-400">No pinned projects yet.</p>
            {isOwner && (
              <Button onClick={() => setIsAddProjectOpen(true)} variant="secondary" size="sm">
                Add Your First Project
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pinnedProjects.map(project => (
              <div 
                key={project.id}
                className="group p-5 rounded-xl bg-[#0d1117] hover:bg-[#161b22] border border-[#30363d] hover:border-[#8b949e] transition-all flex flex-col justify-between space-y-3 relative shadow-sm"
              >
                <div className="space-y-2">
                  {/* Title and badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                      <a 
                        href={project.githubUrl || project.liveUrl || '#'} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-sm font-bold text-[#58a6ff] hover:underline"
                      >
                        {project.title}
                      </a>
                      <span className="px-2 py-0.2 rounded-full border border-[#30363d] text-[10px] text-slate-400 font-mono">
                        Public
                      </span>
                    </div>

                    {isOwner && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleTogglePin(project.id)}
                          title="Unpin project"
                          className="p-1 rounded text-slate-400 hover:text-amber-400 hover:bg-white/5"
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          title="Delete project"
                          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-white/5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-[#8b949e] leading-relaxed line-clamp-2">
                    {project.description}
                  </p>

                  {/* Tech stack badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {project.techStack.map((tech, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-white/[0.04] text-[10px] text-slate-300 font-mono">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer metrics: Language dot, stars, forks, and links */}
                <div className="pt-2 border-t border-[#21262d] flex items-center justify-between text-xs text-[#8b949e]">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 font-medium text-slate-300">
                      <span 
                        className="w-2.5 h-2.5 rounded-full shrink-0" 
                        style={{ backgroundColor: project.languageColor || '#3178C6' }} 
                      />
                      <span>{project.primaryLanguage}</span>
                    </span>

                    {project.stars !== undefined && project.stars > 0 && (
                      <span className="flex items-center gap-1 hover:text-white transition-colors">
                        <Star className="w-3.5 h-3.5" />
                        <span>{project.stars}</span>
                      </span>
                    )}

                    {project.forks !== undefined && project.forks > 0 && (
                      <span className="flex items-center gap-1 hover:text-white transition-colors">
                        <GitFork className="w-3.5 h-3.5" />
                        <span>{project.forks}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 font-semibold">
                    {project.liveUrl && (
                      <a 
                        href={project.liveUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 hover:underline"
                      >
                        <span>Demo</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {project.githubUrl && (
                      <a 
                        href={project.githubUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-slate-300 hover:text-white flex items-center gap-1 hover:underline"
                      >
                        <span>Source</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. INTERACTIVE RÉSUMÉ & PORTFOLIO VAULT */}
      <div className="rounded-2xl bg-gradient-to-b from-[#131822] to-[#0c1017] border border-white/10 p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-400" />
              <span>Builder Résumé & Verified Credentials</span>
            </h2>
            <p className="text-xs text-slate-400">
              Founders and venture sponsors inspect this verified résumé when evaluating sprint applications.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsPreviewResumeOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/20"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview Document</span>
            </button>

            <a
              href={profile?.resumeUrl || '#'}
              download={profile?.resumeFilename || 'Priya_Sharma_Resume.pdf'}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-slate-300" />
              <span>Download PDF</span>
            </a>

            {isOwner && (
              <button
                onClick={() => setIsUploadResumeOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Upload className="w-3.5 h-3.5 text-slate-300" />
                <span>Upload / Replace</span>
              </button>
            )}
          </div>
        </div>

        {/* Résumé Metadata Card */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>{profile?.resumeFilename || 'Priya_Sharma_Resume.pdf'}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Aadhaar/PAN Verified</span>
                </span>
              </div>
              <div className="text-xs text-slate-400">
                PDF Document • 420 KB • Last updated: {profile?.resumeLastUpdated || '2026-09-08'}
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-400 max-w-sm">
            <span className="font-semibold text-slate-300">Executive Summary:</span> {profile?.resumeSummary}
          </div>
        </div>

        {/* Structured Experience & Education Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          
          {/* Work Experience */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Recent Experience & Venture Leadership</span>
            </h3>

            <div className="space-y-3">
              {(profile?.experience || []).map(exp => (
                <div key={exp.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-white">{exp.role}</h4>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">{exp.period}</span>
                  </div>
                  <div className="text-xs text-indigo-400 font-medium">{exp.company}</div>
                  <p className="text-xs text-slate-300 leading-relaxed">{exp.description}</p>
                  {exp.skills && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {exp.skills.map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-slate-400 font-mono">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Education & Core Competencies */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-purple-400" />
              <span>Education & Technical Competencies</span>
            </h3>

            <div className="space-y-3">
              {(profile?.education || []).map(edu => (
                <div key={edu.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-white">{edu.institution}</h4>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">{edu.year}</span>
                  </div>
                  <div className="text-xs text-purple-400 font-medium">{edu.degree}</div>
                  {edu.grade && (
                    <div className="text-[11px] text-emerald-400 font-medium">{edu.grade}</div>
                  )}
                </div>
              ))}

              {/* Skills Tags */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                <div className="text-xs font-bold text-white">Core Competencies:</div>
                <div className="flex flex-wrap gap-1.5">
                  {(userData?.skills || ['Kubernetes', 'Go', 'Rust', 'TypeScript', 'Next.js', 'eBPF', 'Prometheus', 'Docker', 'PostgreSQL']).map((skill: string, idx: number) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold font-mono">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: FULL-SCREEN RÉSUMÉ PREVIEW */}
      <AnimatePresence>
        {isPreviewResumeOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl max-h-[90vh] rounded-2xl bg-[#0f141e] border border-white/20 shadow-2xl flex flex-col overflow-hidden text-slate-200"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-400" />
                  <span className="font-bold text-sm text-white">{profile?.resumeFilename || 'Priya_Sharma_Resume.pdf'}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold">
                    Document Reader
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={profile?.resumeUrl || '#'}
                    download={profile?.resumeFilename || 'Priya_Sharma_Resume.pdf'}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                  <button 
                    onClick={() => setIsPreviewResumeOpen(false)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Document Body (Rendered PDF simulation) */}
              <div className="p-6 sm:p-10 overflow-y-auto space-y-8 bg-[#131722] text-slate-100">
                
                {/* PDF Header */}
                <div className="border-b border-white/10 pb-6 space-y-2">
                  <h1 className="text-2xl font-black text-white tracking-tight">{userData?.name || 'Priya Sharma'}</h1>
                  <p className="text-sm font-semibold text-indigo-400">{profile?.headline}</p>
                  <div className="flex flex-wrap gap-4 text-xs text-slate-400 pt-1">
                    <span>Email: {userData?.email || 'developer@founderhub.com'}</span>
                    <span>Location: {profile?.location || 'Bengaluru, IN'}</span>
                    <span>GitHub: github.com/{profile?.githubUsername}</span>
                    <span>CodeChef: codechef.com/users/{profile?.codechefUsername}</span>
                  </div>
                </div>

                {/* Professional Summary */}
                <div className="space-y-2">
                  <h3 className="text-xs uppercase font-bold text-purple-400 tracking-wider">Executive Summary</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{profile?.resumeSummary}</p>
                </div>

                {/* Experience */}
                <div className="space-y-3">
                  <h3 className="text-xs uppercase font-bold text-indigo-400 tracking-wider">Professional Experience</h3>
                  <div className="space-y-4">
                    {(profile?.experience || []).map(exp => (
                      <div key={exp.id} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <strong className="text-white">{exp.role} — <span className="text-indigo-300">{exp.company}</span></strong>
                          <span className="text-slate-400 font-mono">{exp.period}</span>
                        </div>
                        <p className="text-xs text-slate-300">{exp.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pinned Past Projects */}
                <div className="space-y-3">
                  <h3 className="text-xs uppercase font-bold text-emerald-400 tracking-wider">Key Engineering Projects & Open Source</h3>
                  <div className="space-y-3">
                    {(profile?.pastProjects || []).map(proj => (
                      <div key={proj.id} className="p-3 rounded-lg bg-black/30 border border-white/5 space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-white font-mono">{proj.title} ({proj.primaryLanguage})</span>
                          <span className="text-[11px] text-amber-400 font-mono">⭐ {proj.stars || 0} stars</span>
                        </div>
                        <p className="text-xs text-slate-300">{proj.description}</p>
                        {proj.stats && <div className="text-[11px] text-slate-400">Impact: {proj.stats}</div>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Education */}
                <div className="space-y-2">
                  <h3 className="text-xs uppercase font-bold text-amber-400 tracking-wider">Education</h3>
                  {(profile?.education || []).map(edu => (
                    <div key={edu.id} className="text-xs flex justify-between">
                      <div>
                        <div className="font-bold text-white">{edu.institution}</div>
                        <div className="text-slate-300">{edu.degree} — {edu.grade}</div>
                      </div>
                      <div className="font-mono text-slate-400">{edu.year}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: ADD PAST PROJECT */}
      <AnimatePresence>
        {isAddProjectOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl bg-[#0d1117] border border-[#30363d] shadow-2xl p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-[#21262d] pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">Add Pinned Past Project</h3>
                </div>
                <button onClick={() => setIsAddProjectOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddProject} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Repository / Project Title *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. distributed-kv-store"
                    value={newProjectForm.title || ''} 
                    onChange={e => setNewProjectForm({ ...newProjectForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Description *</label>
                  <textarea 
                    rows={3} 
                    required 
                    placeholder="Explain what the project does, algorithms used, and problem solved..."
                    value={newProjectForm.description || ''} 
                    onChange={e => setNewProjectForm({ ...newProjectForm, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-indigo-500 leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold">Primary Language</label>
                    <select
                      value={newProjectForm.primaryLanguage || 'TypeScript'}
                      onChange={e => {
                        const lang = e.target.value;
                        const colors: Record<string, string> = {
                          TypeScript: '#3178C6',
                          Go: '#00ADD8',
                          Rust: '#DEA584',
                          Python: '#3572A5',
                          JavaScript: '#F1E05A',
                          Solidity: '#AA6746',
                          C: '#555555'
                        };
                        setNewProjectForm({
                          ...newProjectForm,
                          primaryLanguage: lang,
                          languageColor: colors[lang] || '#3178C6'
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="TypeScript">TypeScript</option>
                      <option value="Go">Go</option>
                      <option value="Rust">Rust</option>
                      <option value="Python">Python</option>
                      <option value="JavaScript">JavaScript</option>
                      <option value="Solidity">Solidity</option>
                      <option value="C">C / C++</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold">GitHub Stars (approx)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={newProjectForm.stars || 0} 
                      onChange={e => setNewProjectForm({ ...newProjectForm, stars: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold">GitHub Repo URL</label>
                    <input 
                      type="url" 
                      placeholder="https://github.com/..."
                      value={newProjectForm.githubUrl || ''} 
                      onChange={e => setNewProjectForm({ ...newProjectForm, githubUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold">Live Demo URL</label>
                    <input 
                      type="url" 
                      placeholder="https://..."
                      value={newProjectForm.liveUrl || ''} 
                      onChange={e => setNewProjectForm({ ...newProjectForm, liveUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Key Outcome / Stats</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 5k+ weekly downloads, zero-downtime failover"
                    value={newProjectForm.stats || ''} 
                    onChange={e => setNewProjectForm({ ...newProjectForm, stats: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#21262d]">
                  <Button type="button" variant="secondary" size="sm" onClick={() => setIsAddProjectOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" disabled={isSaving}>
                    {isSaving ? 'Adding...' : 'Pin Project to Profile'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: EDIT PROFILE */}
      <AnimatePresence>
        {isEditProfileOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl max-h-[88vh] rounded-2xl bg-[#0d1117] border border-[#30363d] shadow-2xl p-6 space-y-5 overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-[#21262d] pb-3">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">Edit Developer Profile & Handles</h3>
                </div>
                <button onClick={() => setIsEditProfileOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {saveMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>{saveMessage}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold">Username Handle</label>
                    <input 
                      type="text" 
                      value={editForm.handle || ''} 
                      onChange={e => setEditForm({ ...editForm, handle: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold">Location</label>
                    <input 
                      type="text" 
                      value={editForm.location || ''} 
                      onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Headline (GitHub / CodeChef subtitle)</label>
                  <input 
                    type="text" 
                    value={editForm.headline || ''} 
                    onChange={e => setEditForm({ ...editForm, headline: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Bio</label>
                  <textarea 
                    rows={2} 
                    value={editForm.bio || ''} 
                    onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold">GitHub Username</label>
                    <input 
                      type="text" 
                      value={editForm.githubUsername || ''} 
                      onChange={e => setEditForm({ ...editForm, githubUsername: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold">CodeChef Username</label>
                    <input 
                      type="text" 
                      value={editForm.codechefUsername || ''} 
                      onChange={e => setEditForm({ ...editForm, codechefUsername: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold">LinkedIn URL</label>
                    <input 
                      type="url" 
                      value={editForm.linkedinUrl || ''} 
                      onChange={e => setEditForm({ ...editForm, linkedinUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold">Portfolio Website</label>
                    <input 
                      type="url" 
                      value={editForm.websiteUrl || ''} 
                      onChange={e => setEditForm({ ...editForm, websiteUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Executive Résumé Summary</label>
                  <textarea 
                    rows={2} 
                    value={editForm.resumeSummary || ''} 
                    onChange={e => setEditForm({ ...editForm, resumeSummary: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#21262d]">
                  <Button type="button" variant="secondary" size="sm" onClick={() => setIsEditProfileOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" disabled={isSaving}>
                    {isSaving ? 'Saving Changes...' : 'Save Profile'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: UPLOAD / REPLACE RÉSUMÉ */}
      <AnimatePresence>
        {isUploadResumeOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-[#0d1117] border border-[#30363d] shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#21262d] pb-3">
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-purple-400" />
                  <h3 className="text-sm font-bold text-white">Upload / Replace Résumé</h3>
                </div>
                <button onClick={() => setIsUploadResumeOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveResume} className="space-y-4 text-xs">
                <div className="p-6 rounded-xl border border-dashed border-white/20 hover:border-purple-500/50 bg-black/30 text-center relative cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <div className="text-xs font-semibold text-white">
                    {resumeFileNameInput ? resumeFileNameInput : 'Choose PDF file or drag and drop'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">PDF up to 10MB</div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Or Direct Cloud Document URL (Google Drive / GitHub / S3)</label>
                  <input 
                    type="url" 
                    placeholder="https://..."
                    value={resumeUploadUrl} 
                    onChange={e => setResumeUploadUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#21262d]">
                  <Button type="button" variant="secondary" size="sm" onClick={() => setIsUploadResumeOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" disabled={isSaving || !resumeUploadUrl}>
                    {isSaving ? 'Updating...' : 'Save Résumé'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
