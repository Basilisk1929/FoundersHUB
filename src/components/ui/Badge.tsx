import React from 'react';
import { StartupStage, TaskPriority } from '@/types';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'stage' | 'priority' | 'default' | 'verified' | 'points';
  stage?: StartupStage;
  priority?: TaskPriority | string;
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  stage,
  priority,
  className = ''
}: BadgeProps) {
  if (variant === 'stage' && stage) {
    const stageConfig: Record<StartupStage, { text: string; bg: string; border: string; color: string }> = {
      draft: { text: 'Draft / Private', bg: 'bg-slate-500/10', border: 'border-slate-500/20', color: 'text-slate-400' },
      readiness_gate: { text: 'In Review', bg: 'bg-amber-500/10', border: 'border-amber-500/30', color: 'text-amber-400' },
      published: { text: 'Published Idea', bg: 'bg-blue-500/10', border: 'border-blue-500/30', color: 'text-blue-400' },
      sprint_active: { text: 'Sprint Active ⚡', bg: 'bg-purple-500/10', border: 'border-purple-500/30', color: 'text-purple-400' },
      sprint_completed: { text: 'Sprint Completed 🎯', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', color: 'text-emerald-400' },
      funded: { text: 'Syndicated / Funded 🚀', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', color: 'text-indigo-400' },
      closed: { text: 'Closed', bg: 'bg-slate-500/10', border: 'border-slate-500/20', color: 'text-slate-400' }
    };

    const cfg = stageConfig[stage] || stageConfig.draft;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.border} ${cfg.color} ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
        {cfg.text}
      </span>
    );
  }

  if (variant === 'priority' && priority) {
    const priorityConfig: Record<string, { text: string; bg: string }> = {
      critical: { text: 'Critical', bg: 'bg-red-500/20 text-red-400 border-red-500/30' },
      urgent: { text: 'Urgent', bg: 'bg-red-500/20 text-red-400 border-red-500/30' },
      high: { text: 'High', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
      medium: { text: 'Medium', bg: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      low: { text: 'Low', bg: 'bg-slate-500/20 text-slate-400 border-slate-500/30' }
    };

    const cfg = priorityConfig[priority] || priorityConfig.medium;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${cfg.bg} ${className}`}>
        {cfg.text}
      </span>
    );
  }

  if (variant === 'verified') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 ${className}`}>
        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        {children || 'Verified'}
      </span>
    );
  }

  if (variant === 'points') {
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 ${className}`}>
        <span>⚡</span>
        {children} pts
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border border-white/10 bg-white/5 text-slate-300 ${className}`}>
      {children}
    </span>
  );
}
