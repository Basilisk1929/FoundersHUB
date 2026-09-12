'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Code2, 
  Zap, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Upload, 
  ArrowRight, 
  AlertCircle,
  TrendingUp,
  FileText,
  User,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { useAuth } from '@/components/auth/AuthContext';
import { TaskDoc, ApplicationDoc } from '@/types';
import { DeveloperProfileView } from '@/components/developer/DeveloperProfileView';

function DeveloperDashboardContent() {
  const { user, refreshUser } = useAuth();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab');

  const [selectedView, setSelectedView] = useState<'workspace' | 'profile'>('workspace');
  const [applications, setApplications] = useState<ApplicationDoc[]>([]);
  const [tasks, setTasks] = useState<TaskDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [resumeUrl, setResumeUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    fetchDeveloperData();
  }, []);

  useEffect(() => {
    if (currentTab === 'profile') {
      setSelectedView('profile');
    } else if (currentTab) {
      setSelectedView('workspace');
      setTimeout(() => {
        const el = document.getElementById(currentTab);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    }
  }, [currentTab]);

  const fetchDeveloperData = async () => {
    setLoading(true);
    try {
      const appRes = await fetch('/api/applications');
      const appData = await appRes.json();
      setApplications(appData.applications || []);

      // If user is accepted into any department, fetch their tasks
      const accepted = appData.applications?.filter((a: any) => a.status === 'accepted') || [];
      if (accepted.length > 0) {
        const deptId = accepted[0].departmentId;
        const deptRes = await fetch(`/api/departments/${deptId}`);
        const deptData = await deptRes.json();
        setTasks(deptData.tasks || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, assigneeId: user?._id })
      });
      const data = await res.json();
      if (res.ok) {
        setTasks(prev => prev.map(t => t._id === taskId ? data.task : t));
        refreshUser();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.fileUrl) {
        setResumeUrl(data.fileUrl);
        setUploadSuccess(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUploading(false);
    }
  };

  const acceptedApps = applications.filter(a => a.status === 'accepted');
  const pendingApps = applications.filter(a => a.status === 'pending');
  const myCompletedTasks = tasks.filter(t => t.status === 'done' && t.assigneeId === user?._id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Developer Workspace</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/30">
              {user?.name || 'Priya Patel'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Claim deliverables, ship commits, and earn dynamically vested equity in active venture sprints.
          </p>
        </div>

        {/* Total Points & Est Equity Card */}
        <div id="vesting" className="flex items-center gap-4 p-3 rounded-2xl glass-panel-glow border border-sky-500/30">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center">
              ⚡
            </div>
            <div>
              <div className="text-base font-extrabold text-white">
                {user?.totalPoints || 85} <span className="text-xs text-sky-400">pts</span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium">Accumulated Velocity</div>
            </div>
          </div>

          <div className="h-8 w-px bg-white/10" />

          <div>
            <div className="text-base font-extrabold text-emerald-400">~12.8%</div>
            <div className="text-[10px] text-slate-400 font-medium">Est. Sprint Equity</div>
          </div>
        </div>
      </div>

      {/* Top Navigation View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedView('workspace')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              selectedView === 'workspace'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Dev Sprint Workspace</span>
          </button>

          <button
            onClick={() => setSelectedView('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              selectedView === 'profile'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/25'
                : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <User className="w-4 h-4 text-purple-400" />
            <span>GitHub & CodeChef Profile</span>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono flex items-center gap-0.5">
              <Star className="w-2.5 h-2.5 fill-amber-300" />
              <span>2184</span>
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => {
              setSelectedView('workspace');
              setTimeout(() => {
                document.getElementById('tasks')?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className="px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 transition-colors"
          >
            Active Backlog ({tasks.length})
          </button>
          <button
            onClick={() => {
              setSelectedView('workspace');
              setTimeout(() => {
                document.getElementById('vesting')?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className="px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 transition-colors"
          >
            Equity Ledger ({user?.totalPoints || 0} pts)
          </button>
        </div>
      </div>

      {selectedView === 'profile' ? (
        <DeveloperProfileView />
      ) : (
        <>
          {/* Single Department Restriction Notice */}
          <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-start gap-3 text-xs text-sky-200">
            <Layers className="w-5 h-5 shrink-0 text-sky-400 mt-0.5" />
            <div>
              <span className="font-bold text-white block">Strict Department Isolation Active:</span>
              <span>
                You are currently assigned to exactly one department per sprint to maximize focus. Access to code, chat, and files is scoped exclusively to your team. Multi-department participation requires founder approval.
              </span>
            </div>
          </div>

          {/* Main Grid: Active Department & Task Queue */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left 2 Cols: My Active Department & Tasks */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Active Joined Departments */}
              <div className="glass-panel p-6 border border-white/10 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-sky-400" />
                  <span>Active Sprint Department</span>
                </h3>

                {acceptedApps.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center space-y-3">
                    <p className="text-xs text-slate-400">
                      You are not currently joined to any startup execution department.
                    </p>
                    <a href="/discover">
                      <Button variant="primary" size="sm">
                        Explore Open Sprints
                      </Button>
                    </a>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {acceptedApps.map(app => (
                      <div key={app._id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white text-sm">{app.departmentName}</div>
                          <div className="text-xs text-slate-400">Startup: <span className="text-indigo-400 font-semibold">{app.startupName}</span></div>
                          <div className="text-[10px] text-emerald-400 font-semibold mt-1">✓ Active Builder Membership</div>
                        </div>

                        <a href={`/departments/${app.departmentId}`}>
                          <Button variant="primary" size="sm" className="flex items-center gap-1">
                            <span>Open Workspace</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* My Assigned Deliverables / Backlog Queue */}
              <div id="tasks" className="glass-panel p-6 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-400" />
                    <span>Department Task Backlog & Execution Queue</span>
                  </h3>
                  <span className="text-xs text-slate-400">{tasks.length} deliverables logged</span>
                </div>

                {tasks.length === 0 ? (
                  <p className="text-xs text-slate-500">No active tasks in your department backlog.</p>
                ) : (
                  <div className="space-y-3">
                    {tasks.map(task => {
                      const isAssignedToMe = task.assigneeId === user?._id;
                      const isDone = task.status === 'done';
                      const isInProgress = task.status === 'in_progress';

                      return (
                        <div 
                          key={task._id} 
                          className={`p-4 rounded-xl border transition-all ${
                            isDone 
                              ? 'bg-emerald-500/[0.03] border-emerald-500/20' 
                              : isInProgress 
                              ? 'bg-sky-500/[0.03] border-sky-500/20' 
                              : 'bg-white/[0.02] border-white/5'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-xs text-white">{task.title}</span>
                                <Badge variant="priority" priority={task.priority} />
                                <span className="text-[10px] font-mono text-amber-400 font-semibold">
                                  ⚡ {task.contributionPoints} pts
                                </span>
                              </div>
                              {task.description && (
                                <p className="text-[11px] text-slate-400">{task.description}</p>
                              )}
                            </div>

                            <div className="shrink-0 flex items-center gap-2">
                              {isDone ? (
                                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Done (+{task.contributionPoints} pts)</span>
                                </span>
                              ) : isInProgress ? (
                                <Button 
                                  variant="secondary" 
                                  size="sm" 
                                  onClick={() => handleTaskStatusChange(task._id, 'done')}
                                  className="text-xs"
                                >
                                  Submit Review
                                </Button>
                              ) : (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleTaskStatusChange(task._id, 'in_progress')}
                                  className="text-xs"
                                >
                                  Claim & Start
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Right Col: Builder Profile & Resume */}
            <div className="space-y-6">
              
              {/* Builder Resume & Portfolio Card */}
              <div className="glass-panel p-6 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-400" />
                    <span>Builder Résumé / Profile</span>
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 font-semibold">
                    Live
                  </span>
                </div>

                <p className="text-xs text-slate-400">
                  Founders inspect your verified credentials, GitHub repositories, and CodeChef ranking before accepting sprint applications.
                </p>

                <button
                  onClick={() => setSelectedView('profile')}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600/20 via-indigo-600/20 to-sky-600/20 hover:from-purple-600/30 hover:to-indigo-600/30 border border-purple-500/30 text-purple-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <User className="w-4 h-4 text-purple-400" />
                  <span>Open GitHub & CodeChef Profile</span>
                </button>

                <div className="p-4 rounded-xl border border-dashed border-white/20 hover:border-indigo-500/50 bg-black/30 text-center relative cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg"
                    onChange={handleResumeUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                  <div className="text-xs font-semibold text-white">
                    {isUploading ? 'Uploading...' : uploadSuccess ? 'Résumé Updated ✓' : 'Upload / Replace Résumé (PDF)'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Max file size 10MB</div>
                </div>

                {resumeUrl && (
                  <div className="text-xs text-indigo-400 flex items-center justify-between pt-1">
                    <span>View Stored Résumé:</span>
                    <a href={resumeUrl} target="_blank" rel="noreferrer" className="underline font-semibold">Preview File</a>
                  </div>
                )}
              </div>

              {/* Pending Applications */}
              <div className="glass-panel p-6 border border-white/10 space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Pending Applications ({pendingApps.length})
                </h3>

                {pendingApps.length === 0 ? (
                  <p className="text-xs text-slate-500">No pending department applications.</p>
                ) : (
                  <div className="space-y-2">
                    {pendingApps.map(app => (
                      <div key={app._id} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                        <div className="font-semibold text-white">{app.startupName}</div>
                        <div className="text-slate-400 text-[11px]">{app.departmentName} Department</div>
                        <div className="text-[10px] text-amber-400 font-semibold mt-1">Status: Pending Founder Review</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function DeveloperDashboardPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-20 text-center text-xs text-slate-400">Loading Developer Workspace...</div>}>
      <DeveloperDashboardContent />
    </Suspense>
  );
}
