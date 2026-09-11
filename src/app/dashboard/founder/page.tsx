'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { 
  Sparkles, 
  Layers, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Send, 
  Users, 
  Briefcase, 
  DollarSign, 
  ArrowRight,
  ShieldCheck,
  Check,
  X,
  Bot,
  Edit3,
  Trash2,
  Settings2,
  PauseCircle,
  PlayCircle,
  PlusCircle,
  UserMinus
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { useAuth } from '@/components/auth/AuthContext';
import { StartupDoc, SprintDoc, DepartmentDoc, ApplicationDoc, FundingRequestDoc } from '@/types';

function FounderDashboardContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialStartupId = searchParams.get('startupId');

  const [startups, setStartups] = useState<StartupDoc[]>([]);
  const [selectedStartup, setSelectedStartup] = useState<StartupDoc | null>(null);
  const [sprint, setSprint] = useState<SprintDoc | null>(null);
  const [departments, setDepartments] = useState<DepartmentDoc[]>([]);
  const [applications, setApplications] = useState<ApplicationDoc[]>([]);
  const [fundingRequests, setFundingRequests] = useState<FundingRequestDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // New Startup Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTagline, setNewTagline] = useState('');
  const [newSector, setNewSector] = useState('AI / Software');
  const [newProblem, setNewProblem] = useState('');
  const [newValidation, setNewValidation] = useState('');
  const [newEquitySplit, setNewEquitySplit] = useState({ 'Founder': 70, 'Builders Pool': 30 });

  // Edit Startup Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editTagline, setEditTagline] = useState('');
  const [editSector, setEditSector] = useState('AI / Software');
  const [editProblem, setEditProblem] = useState('');
  const [editValidation, setEditValidation] = useState('');
  const [editFounderEquity, setEditFounderEquity] = useState(70);
  const [editBuildersEquity, setEditBuildersEquity] = useState(30);
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Startup Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Founder Control Center State
  const [isFundingPaused, setIsFundingPaused] = useState(false);
  const [minTicketSize, setMinTicketSize] = useState('25000');
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskDeptId, setTaskDeptId] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [taskPoints, setTaskPoints] = useState(20);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  // Sprint Launcher Modal
  const [sprintModalOpen, setSprintModalOpen] = useState(false);
  const [sprintDuration, setSprintDuration] = useState<14 | 21 | 30>(21);
  const [commitmentType, setCommitmentType] = useState<'hours' | 'deposit'>('hours');
  const [commitmentValue, setCommitmentValue] = useState('25');

  // AI Copilot Modal
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [copilotInput, setCopilotInput] = useState('');
  const [copilotLogs, setCopilotLogs] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    { role: 'assistant', text: '👋 Greetings! I am your AI Founder Copilot, grounded in your real sprint tasks, department progress, and burn rate. What would you like to analyze or prioritize today?' }
  ]);
  const [copilotStreaming, setCopilotStreaming] = useState(false);

  useEffect(() => {
    fetchFounderData();
  }, [initialStartupId]);

  const fetchFounderData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/startups?founderOnly=true');
      const data = await res.json();
      const list: StartupDoc[] = data.startups || [];
      setStartups(list);

      const target = initialStartupId 
        ? list.find(s => s._id === initialStartupId) || list[0] 
        : list[0];

      if (target) {
        selectStartup(target);
      }
    } catch {
      setStartups([]);
    } finally {
      setLoading(false);
    }
  };

  const selectStartup = async (st: StartupDoc) => {
    setSelectedStartup(st);
    setEditName(st.name || '');
    setEditTagline(st.tagline || '');
    setEditSector(st.sector || 'AI / Software');
    setEditProblem(st.problemStatement || '');
    setEditValidation(st.validationEvidence || '');
    setEditFounderEquity(st.proposedEquitySplit?.['Founder'] ?? 70);
    setEditBuildersEquity(st.proposedEquitySplit?.['Builders Pool'] ?? 30);
    setIsFundingPaused(Boolean(st.isFundingPaused));
    setMinTicketSize(String(st.minTicketSize || 25000));
    try {
      const detailRes = await fetch(`/api/startups/${st._id}`);
      const detailData = await detailRes.json();
      setSprint(detailData.sprint || null);
      setDepartments(detailData.departments || []);
      if (detailData.departments && detailData.departments.length > 0) {
        setTaskDeptId(detailData.departments[0]._id);
      }

      // Fetch applications
      const appRes = await fetch('/api/applications');
      const appData = await appRes.json();
      setApplications(appData.applications?.filter((a: any) => a.startupId === st._id) || []);

      // Fetch funding requests
      const fundRes = await fetch(`/api/funding?startupId=${st._id}`);
      const fundData = await fundRes.json();
      setFundingRequests(fundData.fundingRequests || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenEditModal = () => {
    if (!selectedStartup) return;
    setEditName(selectedStartup.name || '');
    setEditTagline(selectedStartup.tagline || '');
    setEditSector(selectedStartup.sector || 'AI / Software');
    setEditProblem(selectedStartup.problemStatement || '');
    setEditValidation(selectedStartup.validationEvidence || '');
    setEditFounderEquity(selectedStartup.proposedEquitySplit?.['Founder'] ?? 70);
    setEditBuildersEquity(selectedStartup.proposedEquitySplit?.['Builders Pool'] ?? 30);
    setEditModalOpen(true);
  };

  const handleUpdateStartup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStartup) return;
    setIsUpdating(true);
    try {
      const fEq = Number(editFounderEquity);
      const bEq = Number(editBuildersEquity);
      const iEq = Math.max(0, 100 - fEq - bEq);
      const split: Record<string, number> = {
        'Founder': fEq,
        'Builders Pool': bEq
      };
      if (iEq > 0) split['Investors'] = iEq;

      const res = await fetch(`/api/startups/${selectedStartup._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          tagline: editTagline,
          sector: editSector,
          problemStatement: editProblem,
          validationEvidence: editValidation,
          proposedEquitySplit: split
        })
      });
      const data = await res.json();
      if (res.ok && data.startup) {
        setSelectedStartup(data.startup);
        setStartups(prev => prev.map(s => s._id === data.startup._id ? data.startup : s));
        setEditModalOpen(false);

        // If it now satisfies readiness and was in draft, auto-trigger readiness publish
        const probOk = Boolean(data.startup.problemStatement && data.startup.problemStatement.length >= 30);
        const valOk = Boolean(data.startup.validationEvidence && data.startup.validationEvidence.length >= 20);
        if (probOk && valOk && data.startup.stage === 'draft') {
          await fetch(`/api/startups/${data.startup._id}/readiness`, { method: 'POST' });
          const refreshed = await (await fetch(`/api/startups/${data.startup._id}`)).json();
          if (refreshed.startup) {
            setSelectedStartup(refreshed.startup);
            setStartups(prev => prev.map(s => s._id === refreshed.startup._id ? refreshed.startup : s));
          }
        }
      }
    } catch (e) {
      console.error('Update idea error:', e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteStartup = async () => {
    if (!selectedStartup) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/startups/${selectedStartup._id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const remaining = startups.filter(s => s._id !== selectedStartup._id);
        setStartups(remaining);
        setDeleteModalOpen(false);
        if (remaining.length > 0) {
          selectStartup(remaining[0]);
        } else {
          setSelectedStartup(null);
        }
      }
    } catch (e) {
      console.error('Delete idea error:', e);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleFundingPause = async () => {
    if (!selectedStartup) return;
    const nextPaused = !isFundingPaused;
    try {
      const res = await fetch(`/api/startups/${selectedStartup._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isFundingPaused: nextPaused,
          minTicketSize: Number(minTicketSize)
        })
      });
      if (res.ok) {
        setIsFundingPaused(nextPaused);
        setSelectedStartup(prev => prev ? { ...prev, isFundingPaused: nextPaused, minTicketSize: Number(minTicketSize) } : prev);
      }
    } catch (e) {
      console.error('Toggle funding pause error:', e);
    }
  };

  const handleUpdateMinTicket = async () => {
    if (!selectedStartup) return;
    try {
      const res = await fetch(`/api/startups/${selectedStartup._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          minTicketSize: Number(minTicketSize)
        })
      });
      if (res.ok) {
        setSelectedStartup(prev => prev ? { ...prev, minTicketSize: Number(minTicketSize) } : prev);
      }
    } catch (e) {
      console.error('Update min ticket error:', e);
    }
  };

  const handleInjectTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStartup || !taskDeptId || !taskTitle.trim()) return;
    setIsSubmittingTask(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departmentId: taskDeptId,
          title: taskTitle.trim(),
          description: taskDescription.trim(),
          priority: taskPriority,
          contributionPoints: Number(taskPoints)
        })
      });
      if (res.ok) {
        setTaskModalOpen(false);
        setTaskTitle('');
        setTaskDescription('');
        selectStartup(selectedStartup);
      }
    } catch (e) {
      console.error('Inject task error:', e);
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const handleUnassignBuilder = async (departmentId: string, memberId: string) => {
    if (!confirm('Unassign this builder from this department?')) return;
    try {
      const res = await fetch(`/api/departments/${departmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove_member', memberId })
      });
      if (res.ok && selectedStartup) {
        selectStartup(selectedStartup);
      }
    } catch (e) {
      console.error('Unassign builder error:', e);
    }
  };

  const handleCreateStartup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/startups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          tagline: newTagline,
          sector: newSector,
          problemStatement: newProblem,
          validationEvidence: newValidation,
          proposedEquitySplit: newEquitySplit
        })
      });
      const data = await res.json();
      if (res.ok && data.startup) {
        setStartups(prev => [data.startup, ...prev]);
        selectStartup(data.startup);
        setCreateModalOpen(false);
        setNewName('');
        setNewTagline('');
        setNewProblem('');
        setNewValidation('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePublishReadiness = async () => {
    if (!selectedStartup) return;
    try {
      const res = await fetch(`/api/startups/${selectedStartup._id}/readiness`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.startup) {
        setSelectedStartup(data.startup);
        setStartups(prev => prev.map(s => s._id === data.startup._id ? data.startup : s));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLaunchSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStartup) return;
    try {
      const res = await fetch('/api/sprints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startupId: selectedStartup._id,
          durationDays: sprintDuration,
          commitmentType,
          commitmentValue
        })
      });
      const data = await res.json();
      if (res.ok && data.sprint) {
        setSprint(data.sprint);
        setDepartments(data.departments || []);
        setSelectedStartup(prev => prev ? { ...prev, stage: 'sprint_active' } : prev);
        setSprintModalOpen(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCompleteSprint = async () => {
    if (!sprint || !selectedStartup) return;
    if (!confirm('Finalize sprint? This seals your Execution Score, vests builder equity, and UNLOCKS investor funding!')) return;

    try {
      const res = await fetch(`/api/sprints/${sprint._id}/complete`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSprint(prev => prev ? { ...prev, status: 'completed' } : prev);
        setSelectedStartup(prev => prev ? {
          ...prev,
          stage: 'sprint_completed',
          executionScore: data.finalExecutionScore,
          vestedEquitySplit: data.vestedEquitySplit
        } : prev);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReviewApplication = async (appId: string, status: 'accepted' | 'rejected') => {
    try {
      const res = await fetch(`/api/applications/${appId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setApplications(prev => prev.map(a => a._id === appId ? { ...a, status } : a));
        if (selectedStartup) selectStartup(selectedStartup);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRespondFunding = async (fundId: string, status: 'accepted' | 'rejected') => {
    try {
      const res = await fetch(`/api/funding/${fundId}/respond`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setFundingRequests(prev => prev.map(f => f._id === fundId ? { ...f, status } : f));
        if (selectedStartup) selectStartup(selectedStartup);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAskCopilot = async (customQuestion?: string, isWhatNext?: boolean) => {
    const q = customQuestion || copilotInput;
    if (!q.trim() && !isWhatNext) return;

    setCopilotLogs(prev => [...prev, { role: 'user', text: isWhatNext ? 'What should I do next?' : q }]);
    setCopilotInput('');
    setCopilotStreaming(true);

    try {
      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startupId: selectedStartup?._id,
          message: q,
          isWhatNext,
          history: copilotLogs.slice(-6).map(l => ({
            role: l.role === 'assistant' ? 'model' : 'user',
            content: l.text
          }))
        })
      });

      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantResponse = '';

      setCopilotLogs(prev => [...prev, { role: 'assistant', text: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.replace('data: ', '').trim();
            if (jsonStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.content) {
                assistantResponse += parsed.content;
                setCopilotLogs(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: 'assistant', text: assistantResponse };
                  return updated;
                });
              }
            } catch {}
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCopilotStreaming(false);
    }
  };

  // Readiness checklist computation
  const hasProblem = Boolean(selectedStartup?.problemStatement && selectedStartup.problemStatement.length >= 30);
  const hasValidation = Boolean(selectedStartup?.validationEvidence && selectedStartup.validationEvidence.length >= 20);
  const hasEquity = Boolean(selectedStartup?.proposedEquitySplit && Object.keys(selectedStartup.proposedEquitySplit).length > 0);
  const readinessCount = (hasProblem ? 1 : 0) + (hasValidation ? 1 : 0) + (hasEquity ? 1 : 0);
  const canPublish = readinessCount === 3;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Top Bar: Title, Switcher, Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Founder Workspace</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30">
              Aarav Sharma
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Validate ideas through the Readiness Gate, lead 8-dept sprints, and manage builder equity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* AI Copilot Trigger */}
          <Button
            variant="glow"
            size="sm"
            onClick={() => setCopilotOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Bot className="w-4 h-4" />
            <span>AI Founder Copilot</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Idea</span>
          </Button>
        </div>
      </div>

      {/* Startups Selector Horizontal Carousel */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        {startups.map(st => {
          const isSelected = selectedStartup?._id === st._id;
          return (
            <button
              key={st._id}
              onClick={() => selectStartup(st)}
              className={`p-3.5 rounded-2xl text-left border min-w-[240px] transition-all ${
                isSelected
                  ? 'glass-panel-glow border-indigo-500/50 bg-[#1e1b4b]/30'
                  : 'glass-panel border-white/5 hover:border-white/10 opacity-70 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-white text-xs truncate max-w-[140px]">{st.name}</span>
                <Badge variant="stage" stage={st.stage} />
              </div>
              <div className="text-[11px] text-slate-400 line-clamp-1">{st.tagline}</div>
              <div className="mt-2 text-[10px] text-indigo-400 font-semibold flex items-center justify-between">
                <span>Execution Score:</span>
                <span>{st.executionScore}/100</span>
              </div>
            </button>
          );
        })}
      </div>

      {selectedStartup && (
        <div className="space-y-8">
          
          {/* Main Status & Controls Header */}
          <div className="glass-panel p-6 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-bold text-white">{selectedStartup.name}</h2>
                <Badge variant="stage" stage={selectedStartup.stage} />
                <button
                  type="button"
                  onClick={handleOpenEditModal}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Edit Idea Details"
                >
                  <Edit3 className="w-4 h-4 text-indigo-400" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(true)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  title="Delete Idea"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl">{selectedStartup.tagline}</p>
              <div className="text-[11px] text-slate-400 flex items-center gap-3 pt-1">
                <span>Sector: <b className="text-white">{selectedStartup.sector}</b></span>
                <span>•</span>
                <span>Total Capital: <b className="text-emerald-400">₹{(selectedStartup.totalFundedAmount || 0).toLocaleString()}</b></span>
              </div>
            </div>

            {/* Quick Action / Sprint controls based on stage */}
            <div className="flex items-center gap-3">
              {selectedStartup.stage === 'draft' && (
                <div className="text-right">
                  <div className="text-xs text-amber-400 font-semibold mb-1">
                    {readinessCount} of 3 Readiness Items Complete
                  </div>
                  <Button
                    variant="glow"
                    size="sm"
                    disabled={!canPublish}
                    onClick={handlePublishReadiness}
                    className="flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Publish with SHA-256 Proof</span>
                  </Button>
                </div>
              )}

              {selectedStartup.stage === 'published' && (
                <Button
                  variant="glow"
                  size="md"
                  onClick={() => setSprintModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Layers className="w-4 h-4" />
                  <span>Launch 8-Dept Sprint</span>
                </Button>
              )}

              {selectedStartup.stage === 'sprint_active' && (
                <div className="flex items-center gap-3">
                  <div className="text-right text-xs">
                    <span className="text-slate-400 block">Sprint Active</span>
                    <span className="text-purple-400 font-bold">{sprint?.durationDays || 21} Days Window</span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCompleteSprint}
                    className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Complete Sprint</span>
                  </Button>
                </div>
              )}

              {(selectedStartup.stage === 'sprint_completed' || selectedStartup.stage === 'funded') && (
                <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Investor Funding Unlocked</span>
                </div>
              )}
            </div>
          </div>

          {/* Readiness Gate Card if in draft or published */}
          {(selectedStartup.stage === 'draft' || selectedStartup.stage === 'published') && (
            <div className="glass-panel p-6 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    <span>Readiness Gate Verification ({readinessCount}/3)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Guarantees high conviction before publishing. Generates a timestamped SHA-256 ownership record.
                  </p>
                </div>
                {selectedStartup.ownershipHash && (
                  <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                    Hash: {selectedStartup.ownershipHash.slice(0, 16)}...
                  </span>
                )}
              </div>

              {/* If readiness gate failed / incomplete, show alert & improve button */}
              {selectedStartup.stage === 'draft' && !canPublish && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3 text-xs text-amber-300">
                    <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
                    <div>
                      <div className="font-bold text-sm text-white">Idea Incomplete — Readiness Gate Blocked</div>
                      <div className="text-slate-300 text-[11px] mt-1 space-y-0.5">
                        {!hasProblem && (
                          <div>• Problem statement is too short: currently <b>{selectedStartup.problemStatement?.length || 0}</b> characters (minimum 30 required).</div>
                        )}
                        {!hasValidation && (
                          <div>• Validation evidence is too short: currently <b>{selectedStartup.validationEvidence?.length || 0}</b> characters (minimum 20 required).</div>
                        )}
                        {!hasEquity && (
                          <div>• Initial proposed equity split is missing.</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="glow"
                    onClick={handleOpenEditModal}
                    className="whitespace-nowrap flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Improve Idea & Re-verify</span>
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                
                <div className={`p-4 rounded-xl border transition-colors ${hasProblem ? 'bg-emerald-500/[0.03] border-emerald-500/30' : 'bg-white/[0.02] border-white/5'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white">1. Problem Statement</span>
                    {hasProblem ? <Check className="w-4 h-4 text-emerald-400" /> : <Clock className="w-4 h-4 text-slate-500" />}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-3">
                    {selectedStartup.problemStatement || 'Missing problem statement.'}
                  </p>
                </div>

                <div className={`p-4 rounded-xl border transition-colors ${hasValidation ? 'bg-emerald-500/[0.03] border-emerald-500/30' : 'bg-white/[0.02] border-white/5'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white">2. Validation Evidence</span>
                    {hasValidation ? <Check className="w-4 h-4 text-emerald-400" /> : <Clock className="w-4 h-4 text-slate-500" />}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-3">
                    {selectedStartup.validationEvidence || 'Missing validation evidence.'}
                  </p>
                </div>

                <div className={`p-4 rounded-xl border transition-colors ${hasEquity ? 'bg-emerald-500/[0.03] border-emerald-500/30' : 'bg-white/[0.02] border-white/5'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white">3. Proposed Equity Split</span>
                    {hasEquity ? <Check className="w-4 h-4 text-emerald-400" /> : <Clock className="w-4 h-4 text-slate-500" />}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Founder: {selectedStartup.proposedEquitySplit?.['Founder'] || 70}% / Builders Pool: {selectedStartup.proposedEquitySplit?.['Builders Pool'] || 30}%
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* 8-Department Sprint Workspace Grid (if sprint active or completed) */}
          {(selectedStartup.stage === 'sprint_active' || selectedStartup.stage === 'sprint_completed' || selectedStartup.stage === 'funded') && (
            <div className="glass-panel p-6 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-sky-400" />
                    <span>8 Specialized Department Workspaces</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    As founder, you have full administrative oversight and Kanban access across all departments.
                  </p>
                </div>
                <div className="text-xs text-indigo-400 font-semibold">
                  Execution Score: {selectedStartup.executionScore}/100
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                {departments.map((dept) => (
                  <a
                    key={dept._id}
                    href={`/departments/${dept._id}`}
                    className="p-4 rounded-2xl glass-panel border border-white/5 hover:border-indigo-500/40 hover:bg-white/[0.04] transition-all group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-white group-hover:text-indigo-300 transition-colors">
                        {dept.name}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <Users className="w-3 h-3 text-slate-500" />
                      <span>{dept.memberIds?.length || 1} member{dept.memberIds?.length === 1 ? '' : 's'}</span>
                    </div>
                    <div className="mt-3 text-[10px] text-indigo-400 font-medium">
                      Open Kanban & Tools →
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Builder Applications Inbox & Funding Requests */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Applicant Review Queue */}
            <div className="glass-panel p-6 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-400" />
                  <span>Applicant Review Queue ({applications.filter(a => a.status === 'pending').length})</span>
                </h3>
              </div>

              {applications.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No developer applications received yet.</p>
              ) : (
                <div className="space-y-3">
                  {applications.map((app) => (
                    <div key={app._id} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-white">{app.developerName}</span>
                          <span className="text-[11px] text-sky-400 ml-2">→ {app.departmentName}</span>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          app.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-400' :
                          app.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {app.status.toUpperCase()}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-300 italic">&ldquo;{app.coverNote}&rdquo;</p>

                      {app.status === 'pending' && (
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            onClick={() => handleReviewApplication(app._id, 'rejected')}
                            className="px-2.5 py-1 rounded text-[11px] bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => handleReviewApplication(app._id, 'accepted')}
                            className="px-2.5 py-1 rounded text-[11px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-semibold"
                          >
                            Accept to Dept
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Funding & Sponsorship Inbox */}
            <div className="glass-panel p-6 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Funding & Brand Sponsorships ({fundingRequests.length})</span>
                </h3>
              </div>

              {fundingRequests.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  {selectedStartup.stage === 'sprint_completed' || selectedStartup.stage === 'funded'
                    ? 'No investor commitments received yet.'
                    : 'Funding unlocks automatically once the sprint completes.'}
                </p>
              ) : (
                <div className="space-y-3">
                  {fundingRequests.map((fund) => (
                    <div key={fund._id} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-white">{fund.investorName}</span>
                          <span className="text-[11px] text-emerald-400 font-bold ml-2">
                            ₹{(fund.amount || 0).toLocaleString()} ({fund.type === 'investment' ? 'Investment' : 'Branding Partner'})
                          </span>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          fund.status === 'accepted' || fund.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                          fund.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {fund.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400">
                        1% Platform fee: <span className="text-indigo-400 font-medium">₹{(fund.platformFeeAmount || 0).toLocaleString()}</span>
                      </div>

                      {fund.status === 'pending' && (
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            onClick={() => handleRespondFunding(fund._id, 'rejected')}
                            className="px-2.5 py-1 rounded text-[11px] bg-red-500/10 text-red-400 border border-red-500/20"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => handleRespondFunding(fund._id, 'accepted')}
                            className="px-2.5 py-1 rounded text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold"
                          >
                            Accept Commitment
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Founder Control Center & Governance Panel */}
          <div className="glass-panel p-6 border border-white/10 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-purple-400" />
                  <span>Founder Control Center & Venture Governance</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Manage capital intake gating, minimum ticket sizes, branding partnerships, and sprint backlog injection.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Card 1: Capital Intake & Ticket Size */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span>Capital Intake Gating</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                    isFundingPaused 
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' 
                      : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  }`}>
                    {isFundingPaused ? 'PAUSED' : 'ACTIVE'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300">
                  {isFundingPaused 
                    ? 'Funding commitments are currently blocked for investors. FoundersHub checkout will reject new orders.'
                    : 'Investors can commit test capital post-sprint with 1% platform fee verification.'}
                </p>

                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant={isFundingPaused ? 'glow' : 'secondary'}
                    onClick={handleToggleFundingPause}
                    className="flex items-center gap-1.5 text-xs cursor-pointer"
                  >
                    {isFundingPaused ? (
                      <>
                        <PlayCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Resume Capital Intake</span>
                      </>
                    ) : (
                      <>
                        <PauseCircle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Pause Capital Intake</span>
                      </>
                    )}
                  </Button>
                </div>

                <div className="pt-3 border-t border-white/5 space-y-1.5">
                  <label className="block text-[11px] font-semibold text-slate-300">
                    Minimum Investment Ticket Size (₹)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="5000"
                      min="5000"
                      value={minTicketSize}
                      onChange={(e) => setMinTicketSize(e.target.value)}
                      className="w-40 glass-input px-3 py-1.5 text-xs text-white"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleUpdateMinTicket}
                      className="text-xs cursor-pointer"
                    >
                      Save Ticket Minimum
                    </Button>
                  </div>
                </div>
              </div>

              {/* Card 2: 30-Day Branding Partner Strip & Backlog Injection */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-400" />
                    <span>30-Day Branding Partner Strip</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {(selectedStartup.brandingPartnerships?.length || 0)} Active
                  </span>
                </div>

                {selectedStartup.brandingPartnerships && selectedStartup.brandingPartnerships.length > 0 ? (
                  <div className="space-y-2">
                    {selectedStartup.brandingPartnerships.map((bp, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5 text-xs">
                        <div className="flex items-center gap-2.5">
                          <img src={bp.brandingLogoUrl} alt={bp.brandName} className="w-6 h-6 rounded object-contain bg-white/10 p-0.5" />
                          <div>
                            <span className="font-semibold text-white">{bp.brandName}</span>
                            <span className="text-[10px] text-slate-400 block">{bp.sponsorshipDurationDays} days sponsorship</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-emerald-400">Live on Profile</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    No active branding partner strip currently configured. Investors can sponsor your venture with a &ldquo;Powered by [Brand]&rdquo; strip post-sprint.
                  </p>
                )}

                <div className="pt-3 border-t border-white/5">
                  <Button
                    size="sm"
                    variant="glow"
                    onClick={() => setTaskModalOpen(true)}
                    className="flex items-center gap-1.5 text-xs w-full justify-center cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Inject Backlog Deliverable to Department</span>
                  </Button>
                </div>
              </div>

            </div>

            {/* Department Builder Roster with Unassign Actions */}
            {departments.length > 0 && (
              <div className="pt-2 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Department Builder Rosters & Oversight</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {departments.reduce((acc, d) => acc + (d.memberIds?.length || 0), 0)} total builder seats
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {departments.map((d) => (
                    <div key={d._id} className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-2 text-xs">
                      <div className="font-semibold text-white truncate">{d.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {d.memberIds?.length || 0} active builder{d.memberIds?.length === 1 ? '' : 's'}
                      </div>
                      {d.memberIds && d.memberIds.length > 0 ? (
                        <div className="space-y-1 pt-1 border-t border-white/5">
                          {d.memberIds.map((mId) => (
                            <div key={mId} className="flex items-center justify-between text-[10px] py-0.5">
                              <span className="text-slate-300 truncate max-w-[120px]">{mId}</span>
                              <button
                                type="button"
                                onClick={() => handleUnassignBuilder(d._id, mId)}
                                className="text-red-400 hover:text-red-300 p-0.5 hover:bg-red-500/10 rounded cursor-pointer"
                                title="Unassign Builder"
                              >
                                <UserMinus className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-500 italic">No builders assigned yet</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Modal: Create New Idea */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Submit New Venture Idea"
        subtitle="Starts in Draft mode. Fulfill the 3-point Readiness Gate to publish publicly."
      >
        <form onSubmit={handleCreateStartup} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Startup Name</label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. ApexAI Logistics"
              className="w-full glass-input px-3 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Tagline</label>
            <input
              type="text"
              required
              value={newTagline}
              onChange={(e) => setNewTagline(e.target.value)}
              placeholder="e.g. Autonomous route orchestration for electric freight"
              className="w-full glass-input px-3 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Sector</label>
            <select
              value={newSector}
              onChange={(e) => setNewSector(e.target.value)}
              className="w-full glass-input px-3 py-2 text-xs text-white bg-slate-900"
            >
              <option value="AI / Software">AI / Software</option>
              <option value="FinTech">FinTech</option>
              <option value="CleanTech">CleanTech</option>
              <option value="HealthTech">HealthTech</option>
              <option value="B2B SaaS">B2B SaaS</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Problem Statement</label>
            <textarea
              required
              rows={3}
              value={newProblem}
              onChange={(e) => setNewProblem(e.target.value)}
              placeholder="Describe the exact friction and market inefficiency..."
              className="w-full glass-input p-2.5 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Validation Evidence</label>
            <textarea
              required
              rows={2}
              value={newValidation}
              onChange={(e) => setNewValidation(e.target.value)}
              placeholder="Metrics, waitlist signups, or customer interviews proving demand..."
              className="w-full glass-input p-2.5 text-xs text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="glow">Create Draft Venture</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Sprint Launcher */}
      <Modal
        isOpen={sprintModalOpen}
        onClose={() => setSprintModalOpen(false)}
        title="Launch Execution Sprint"
        subtitle="Spins up 8 specialized departments and enables builder equity tracking."
      >
        <form onSubmit={handleLaunchSprint} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Sprint Duration</label>
            <div className="grid grid-cols-3 gap-2">
              {[14, 21, 30].map(d => (
                <button
                  type="button"
                  key={d}
                  onClick={() => setSprintDuration(d as any)}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                    sprintDuration === d ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  {d} Days
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Founder Skin-in-the-Game Commitment</label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                type="button"
                onClick={() => setCommitmentType('hours')}
                className={`py-2 rounded-xl text-xs font-semibold border ${commitmentType === 'hours' ? 'bg-purple-600 text-white border-purple-500' : 'bg-white/5 border-white/10 text-slate-400'}`}
              >
                Hours / Week
              </button>
              <button
                type="button"
                onClick={() => setCommitmentType('deposit')}
                className={`py-2 rounded-xl text-xs font-semibold border ${commitmentType === 'deposit' ? 'bg-purple-600 text-white border-purple-500' : 'bg-white/5 border-white/10 text-slate-400'}`}
              >
                Refundable Deposit
              </button>
            </div>

            <input
              type="number"
              required
              value={commitmentValue}
              onChange={(e) => setCommitmentValue(e.target.value)}
              placeholder={commitmentType === 'hours' ? 'e.g. 25 hrs/week' : 'e.g. 25000 INR'}
              className="w-full glass-input px-3 py-2 text-xs text-white"
            />
          </div>

          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300">
            ⚡ Automatically provisions: Development, Marketing, Design (UI/UX), Product, Sales, Support, Operations, and Finance departments.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setSprintModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="glow">Launch 8-Dept Sprint Now</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Full-Screen AI Founder Copilot */}
      <Modal
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        title="AI Founder Copilot"
        subtitle={`Live intelligence grounded in ${selectedStartup?.name || 'startup'} metrics & execution progress.`}
        maxWidth="2xl"
      >
        <div className="h-[480px] flex flex-col justify-between">
          
          {/* Quick Action Prompt Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/10">
            <button
              onClick={() => handleAskCopilot(undefined, true)}
              className="px-3 py-1 rounded-full text-[11px] font-bold bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap hover:scale-105 transition-transform flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>🎯 What Should I Do Next?</span>
            </button>
            <button
              onClick={() => handleAskCopilot('What should I prioritize today across all departments?')}
              className="px-3 py-1 rounded-full text-[11px] bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 whitespace-nowrap"
            >
              Prioritize Today
            </button>
            <button
              onClick={() => handleAskCopilot('Draft an investor pitch from our current sprint data.')}
              className="px-3 py-1 rounded-full text-[11px] bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 whitespace-nowrap"
            >
              Draft Sprint Pitch
            </button>
          </div>

          {/* Conversation Stream */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3 text-xs leading-relaxed">
            {copilotLogs.map((log, idx) => (
              <div key={idx} className={`flex flex-col ${log.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[90%] rounded-2xl p-3.5 ${
                  log.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-white/5 border border-white/10 text-slate-200 rounded-bl-none whitespace-pre-line'
                }`}>
                  {log.text}
                </div>
              </div>
            ))}
            {copilotStreaming && (
              <div className="text-xs text-indigo-400 flex items-center gap-1.5 py-1">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>Copilot is analyzing real sprint telemetry...</span>
              </div>
            )}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAskCopilot();
            }}
            className="pt-3 border-t border-white/10 flex items-center gap-2"
          >
            <input
              type="text"
              value={copilotInput}
              onChange={(e) => setCopilotInput(e.target.value)}
              placeholder="Ask about department velocity, runway, or sprint bottlenecks..."
              className="flex-1 glass-input px-3 py-2.5 text-xs text-white"
            />
            <Button type="submit" variant="glow" size="sm" isLoading={copilotStreaming}>
              <Send className="w-3.5 h-3.5" />
            </Button>
          </form>

        </div>
      </Modal>

      {/* Modal: Edit Idea Details & Re-verify */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit & Improve Venture Idea"
        subtitle="Refine your problem statement, validation evidence, or equity split to clear the Readiness Gate."
      >
        <form onSubmit={handleUpdateStartup} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Startup Name</label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full glass-input px-3 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Tagline</label>
            <input
              type="text"
              required
              value={editTagline}
              onChange={(e) => setEditTagline(e.target.value)}
              className="w-full glass-input px-3 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Sector</label>
            <select
              value={editSector}
              onChange={(e) => setEditSector(e.target.value)}
              className="w-full glass-input px-3 py-2 text-xs text-white bg-slate-900"
            >
              <option value="AI / Software">AI / Software</option>
              <option value="FinTech">FinTech</option>
              <option value="CleanTech">CleanTech</option>
              <option value="HealthTech">HealthTech</option>
              <option value="B2B SaaS">B2B SaaS</option>
              <option value="EdTech">EdTech</option>
              <option value="Logistics">Logistics</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">Problem Statement</label>
              <span className={`text-[10px] font-mono ${editProblem.length >= 30 ? 'text-emerald-400' : 'text-amber-400 font-bold'}`}>
                {editProblem.length}/30 min chars {editProblem.length >= 30 ? '✓' : `(Needs ${30 - editProblem.length} more)`}
              </span>
            </div>
            <textarea
              required
              rows={3}
              value={editProblem}
              onChange={(e) => setEditProblem(e.target.value)}
              placeholder="Clearly define the customer pain point and market inefficiency (minimum 30 characters)..."
              className={`w-full glass-input p-2.5 text-xs text-white ${editProblem.length < 30 ? 'border-amber-500/50' : 'border-emerald-500/40'}`}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">Validation Evidence</label>
              <span className={`text-[10px] font-mono ${editValidation.length >= 20 ? 'text-emerald-400' : 'text-amber-400 font-bold'}`}>
                {editValidation.length}/20 min chars {editValidation.length >= 20 ? '✓' : `(Needs ${20 - editValidation.length} more)`}
              </span>
            </div>
            <textarea
              required
              rows={3}
              value={editValidation}
              onChange={(e) => setEditValidation(e.target.value)}
              placeholder="Interviews, prototype signals, waitlist metrics, or LOIs (minimum 20 characters)..."
              className={`w-full glass-input p-2.5 text-xs text-white ${editValidation.length < 20 ? 'border-amber-500/50' : 'border-emerald-500/40'}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-black/40 border border-white/5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Founder Equity (%)</label>
              <input
                type="number"
                min="30"
                max="90"
                value={editFounderEquity}
                onChange={(e) => setEditFounderEquity(Number(e.target.value))}
                className="w-full glass-input px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Builders Pool (%)</label>
              <input
                type="number"
                min="10"
                max="60"
                value={editBuildersEquity}
                onChange={(e) => setEditBuildersEquity(Number(e.target.value))}
                className="w-full glass-input px-3 py-1.5 text-xs text-white"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">Min 10% for sprint builders</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setEditModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="glow" isLoading={isUpdating} disabled={editProblem.length < 30 || editValidation.length < 20}>
              Save & Re-verify
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Delete Startup Confirmation */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={`Delete "${selectedStartup?.name}"?`}
        subtitle="This action is irreversible and permanently deletes this idea, sprint workspace, and tasks."
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <div>
              <b>Permanent Deletion Warning:</b> All associated sprint records, Kanban tasks, builder applications, and funding commitments for this venture will be permanently erased.
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button
              type="button"
              variant="secondary"
              isLoading={isDeleting}
              onClick={handleDeleteStartup}
              className="text-red-400 border-red-500/30 hover:bg-red-500/20 cursor-pointer"
            >
              Confirm Permanent Deletion
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Inject Deliverable to Department */}
      <Modal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        title="Inject Deliverable to Department Backlog"
        subtitle="Directly inject high-priority sprint tasks into any department's Kanban board."
      >
        <form onSubmit={handleInjectTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Target Department</label>
            <select
              required
              value={taskDeptId}
              onChange={(e) => setTaskDeptId(e.target.value)}
              className="w-full glass-input px-3 py-2 text-xs text-white bg-slate-900"
            >
              {departments.map(d => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Task Title</label>
            <input
              type="text"
              required
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="e.g. Implement resilient Redis cache layer"
              className="w-full glass-input px-3 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description & Acceptance Criteria</label>
            <textarea
              rows={3}
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="What specifically needs to be built and verified?"
              className="w-full glass-input p-2.5 text-xs text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Priority</label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as any)}
                className="w-full glass-input px-3 py-2 text-xs text-white bg-slate-900"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Contribution Points</label>
              <input
                type="number"
                min="10"
                max="50"
                value={taskPoints}
                onChange={(e) => setTaskPoints(Number(e.target.value))}
                className="w-full glass-input px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setTaskModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="glow" isLoading={isSubmittingTask}>
              Commit to Backlog
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}

export default function FounderDashboardPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-20 text-center text-xs text-slate-400">Loading Founder Command Center...</div>}>
      <FounderDashboardContent />
    </Suspense>
  );
}
