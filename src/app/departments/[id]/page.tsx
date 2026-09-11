'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  Layers, 
  Users, 
  Clock, 
  Plus, 
  FileText, 
  MessageSquare, 
  Bot, 
  Upload, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  MoreVertical,
  Paperclip,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/components/auth/AuthContext';
import { TaskDoc, DepartmentDoc } from '@/types';

export default function DepartmentWorkspacePage() {
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAuth();

  const [department, setDepartment] = useState<DepartmentDoc | null>(null);
  const [startup, setStartup] = useState<any>(null);
  const [sprint, setSprint] = useState<any>(null);
  const [tasks, setTasks] = useState<TaskDoc[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'kanban' | 'files' | 'chat' | 'mentor'>('kanban');
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  // New Task Modal
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [taskPoints, setTaskPoints] = useState('15');

  // Chat message state
  const [chatInput, setChatInput] = useState('');

  // AI Mentor state
  const [mentorInput, setMentorInput] = useState('');
  const [mentorLogs, setMentorLogs] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  const [mentorStreaming, setMentorStreaming] = useState(false);

  // File upload state
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchDeptData();
  }, [id]);

  const fetchDeptData = async () => {
    setLoading(true);
    setAccessDenied(false);
    try {
      const res = await fetch(`/api/departments/${id}`);
      if (res.status === 403) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.department) {
        setDepartment(data.department);
        setStartup(data.startup);
        setSprint(data.sprint);
        setTasks(data.tasks || []);
        setFiles(data.files || []);
        setMessages(data.messages || []);

        setMentorLogs([
          {
            role: 'assistant',
            text: `👋 Greetings! I am your AI Mentor specialized in **${data.department.name}**. I can review architecture, optimize growth funnels, generate standard operating procedures (SOPs), or draft sprint deliverables for your team.`
          }
        ]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!department) return;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startupId: department.startupId,
          departmentId: department._id,
          sprintId: department.sprintId,
          title: taskTitle,
          description: taskDesc,
          priority: taskPriority,
          contributionPoints: Number(taskPoints)
        })
      });
      const data = await res.json();
      if (res.ok && data.task) {
        setTasks(prev => [...prev, data.task]);
        setTaskModalOpen(false);
        setTaskTitle('');
        setTaskDesc('');
      }
    } catch (e) {
      console.error(e);
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
      if (res.ok && data.task) {
        setTasks(prev => prev.map(t => t._id === taskId ? data.task : t));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !department) return;

    const newMsg = {
      _id: `msg_${Date.now()}`,
      senderId: user?._id || 'usr_dev',
      senderName: user?.name || 'Priya Patel',
      senderRole: user?.role || 'developer',
      message: chatInput,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, newMsg]);
    const textToSend = chatInput;
    setChatInput('');

    try {
      await fetch(`/api/departments/${department._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'chat',
          message: textToSend
        })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleAskMentor = async (customPrompt?: string, actionType?: 'sop' | 'plan') => {
    const p = customPrompt || mentorInput;
    if (!p.trim() && !actionType) return;

    setMentorLogs(prev => [...prev, { role: 'user', text: actionType ? `Generate ${actionType.toUpperCase()}` : p }]);
    setMentorInput('');
    setMentorStreaming(true);

    try {
      const endpoint = actionType === 'sop' ? '/api/ai/sop' : actionType === 'plan' ? '/api/ai/planner' : '/api/ai/mentor';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startupId: department?.startupId,
          departmentId: department?._id,
          message: p,
          action: actionType
        })
      });

      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let streamText = '';

      setMentorLogs(prev => [...prev, { role: 'assistant', text: '' }]);

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
                streamText += parsed.content;
                setMentorLogs(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: 'assistant', text: streamText };
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
      setMentorStreaming(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !department) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('startupId', department.startupId);
    formData.append('departmentId', department._id);

    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.fileDoc) {
        setFiles(prev => [data.fileDoc, ...prev]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-slate-400">Loading department workspace & Kanban queue...</p>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="glass-panel p-8 rounded-3xl border border-red-500/30 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Department Access Restricted</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            FoundersHub enforces strict department isolation. You can only view and participate in departments where you are an accepted member or the venture founder.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <a href="/discover">
              <Button variant="secondary" size="sm">Browse Startups</Button>
            </a>
            <a href="/login">
              <Button variant="glow" size="sm">Switch Persona</Button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!department) return null;

  const kanbanColumns = [
    { id: 'backlog', label: 'Backlog', color: 'slate' },
    { id: 'in_progress', label: 'In Progress', color: 'sky' },
    { id: 'review', label: 'In Review', color: 'purple' },
    { id: 'done', label: 'Completed', color: 'emerald' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Workspace Header */}
      <div className="glass-panel p-6 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Startup:</span>
            <a href={`/startups/${department.startupId}`} className="text-xs font-bold text-indigo-400 hover:underline">
              {startup?.name || 'Startup'}
            </a>
            <span className="text-slate-600">•</span>
            <Badge variant="stage" stage={startup?.stage || 'sprint_active'} />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-sky-400" />
            <span>{department.name} Department</span>
          </h1>

          <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>{department.memberIds?.length || 1} Active Member(s)</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-purple-400">
              <Clock className="w-3.5 h-3.5" />
              <span>{sprint?.durationDays || 21}d Sprint Cycle</span>
            </span>
          </div>
        </div>

        {/* Tab Switcher Buttons */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl glass-panel text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('kanban')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              activeTab === 'kanban' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Kanban Deliverables
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              activeTab === 'files' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Vault & Files ({files.length})
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              activeTab === 'chat' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Team Sync ({messages.length})
          </button>
          <button
            onClick={() => setActiveTab('mentor')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              activeTab === 'mentor' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            AI {department.name} Mentor
          </button>
        </div>
      </div>

      {/* Tab 1: Kanban Board */}
      {activeTab === 'kanban' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-400">
              Drag or advance cards to claim points and contribute to sprint velocity.
            </div>
            <Button
              variant="glow"
              size="sm"
              onClick={() => setTaskModalOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Deliverable</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {kanbanColumns.map(col => {
              const colTasks = tasks.filter(t => t.status === col.id);

              return (
                <div key={col.id} className="glass-panel p-4 border border-white/5 rounded-2xl flex flex-col min-h-[500px]">
                  
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5">
                    <span className="font-bold text-xs text-white uppercase tracking-wider">
                      {col.label}
                    </span>
                    <span className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[10px] text-slate-300 font-bold">
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Task Cards */}
                  <div className="space-y-3 flex-1 overflow-y-auto">
                    {colTasks.map(task => (
                      <div
                        key={task._id}
                        className="p-3.5 rounded-xl bg-black/40 border border-white/10 hover:border-indigo-500/40 transition-colors space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-xs text-white leading-snug">
                            {task.title}
                          </span>
                          <Badge variant="priority" priority={task.priority} />
                        </div>

                        <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed">
                          {task.description}
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px]">
                          <Badge variant="points">{task.contributionPoints || 15}</Badge>

                          {/* Next status action */}
                          {col.id === 'backlog' && (
                            <button
                              onClick={() => handleTaskStatusChange(task._id, 'in_progress')}
                              className="text-sky-400 hover:text-sky-300 font-semibold"
                            >
                              Claim →
                            </button>
                          )}
                          {col.id === 'in_progress' && (
                            <button
                              onClick={() => handleTaskStatusChange(task._id, 'review')}
                              className="text-purple-400 hover:text-purple-300 font-semibold"
                            >
                              Review →
                            </button>
                          )}
                          {col.id === 'review' && (
                            <button
                              onClick={() => handleTaskStatusChange(task._id, 'done')}
                              className="text-emerald-400 hover:text-emerald-300 font-semibold"
                            >
                              Approve ✓
                            </button>
                          )}
                          {col.id === 'done' && (
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Delivered</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Vault & Files */}
      {activeTab === 'files' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 border border-white/10">
            <div>
              <h3 className="font-bold text-base text-white">Department Asset Vault</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Upload architecture diagrams, specifications, contracts, and code assets.
              </p>
            </div>

            <div className="relative">
              <input
                type="file"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Button variant="glow" size="sm" isLoading={isUploading} className="flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload to Vault</span>
              </Button>
            </div>
          </div>

          <div className="glass-panel p-6 border border-white/10 space-y-3">
            {files.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No files uploaded to this department yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {files.map(f => (
                  <a
                    key={f._id}
                    href={f.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/40 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-indigo-400" />
                      <div>
                        <div className="font-semibold text-xs text-white group-hover:text-indigo-300 transition-colors">
                          {f.fileName}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {f.uploaderName} • {new Date(f.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Team Communication Stream */}
      {activeTab === 'chat' && (
        <div className="glass-panel p-6 border border-white/10 h-[580px] flex flex-col justify-between">
          <div className="border-b border-white/10 pb-3 mb-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-sky-400" />
              <span>{department.name} Team Communication Channel</span>
            </h3>
            <p className="text-[11px] text-slate-400">Scoped exclusively to department members and founder.</p>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 text-xs">
            {messages.length === 0 ? (
              <p className="text-slate-400 text-center py-10">Start the conversation with your department teammates.</p>
            ) : (
              messages.map(m => (
                <div key={m._id} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-white">{m.senderName} ({m.senderRole})</span>
                    <span className="text-slate-500">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{m.message}</p>
                </div>
              ))
            )}
          </div>

          {/* Chat input */}
          <form onSubmit={handleSendChat} className="pt-3 border-t border-white/10 flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={`Message ${department.name} team...`}
              className="flex-1 glass-input px-3 py-2 text-xs text-white"
            />
            <Button type="submit" variant="glow" size="sm">
              <Send className="w-3.5 h-3.5" />
            </Button>
          </form>
        </div>
      )}

      {/* Tab 4: AI Mentor & Domain Copilot */}
      {activeTab === 'mentor' && (
        <div className="glass-panel p-6 border border-white/10 h-[620px] flex flex-col justify-between">
          {/* Header & Quick Action Buttons */}
          <div className="border-b border-white/10 pb-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">AI {department.name} Mentor</h3>
                  <p className="text-[11px] text-slate-400">Specialized knowledge base & sprint execution assistant</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAskMentor(undefined, 'plan')}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Sprint Plan</span>
                </button>
                <button
                  onClick={() => handleAskMentor(undefined, 'sop')}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Generate SOP Document</span>
                </button>
              </div>
            </div>
          </div>

          {/* Mentor Chat Stream */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3 text-xs leading-relaxed">
            {mentorLogs.map((log, idx) => (
              <div key={idx} className={`flex flex-col ${log.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[90%] rounded-2xl p-3.5 ${
                  log.role === 'user'
                    ? 'bg-purple-600 text-white rounded-br-none'
                    : 'bg-white/5 border border-white/10 text-slate-200 rounded-bl-none whitespace-pre-line'
                }`}>
                  {log.text}
                </div>
              </div>
            ))}
            {mentorStreaming && (
              <div className="text-xs text-purple-400 flex items-center gap-1.5 py-1">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>AI Mentor is drafting guidance for {department.name}...</span>
              </div>
            )}
          </div>

          {/* Mentor Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAskMentor();
            }}
            className="pt-3 border-t border-white/10 flex items-center gap-2"
          >
            <input
              type="text"
              value={mentorInput}
              onChange={(e) => setMentorInput(e.target.value)}
              placeholder={`Ask your ${department.name} Mentor anything...`}
              className="flex-1 glass-input px-3 py-2.5 text-xs text-white"
            />
            <Button type="submit" variant="glow" size="sm" isLoading={mentorStreaming}>
              <Send className="w-3.5 h-3.5" />
            </Button>
          </form>
        </div>
      )}

      {/* Modal: Add Task */}
      <Modal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        title={`Add Deliverable to ${department.name}`}
        subtitle="Specify deliverables, priority, and contribution points."
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Deliverable Title</label>
            <input
              type="text"
              required
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="e.g. Implement WebSocket live sync for Kanban"
              className="w-full glass-input px-3 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description & Acceptance Criteria</label>
            <textarea
              required
              rows={3}
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              placeholder="Detail the technical requirements and validation criteria..."
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
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Contribution Points</label>
              <input
                type="number"
                min="5"
                max="50"
                value={taskPoints}
                onChange={(e) => setTaskPoints(e.target.value)}
                className="w-full glass-input px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setTaskModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="glow">Create Deliverable</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
