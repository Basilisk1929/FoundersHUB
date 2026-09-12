'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  LayoutDashboard, 
  Rocket, 
  Layers, 
  Lightbulb, 
  Video, 
  Bot, 
  ShieldAlert, 
  PlusCircle, 
  Code2, 
  CheckSquare, 
  Kanban, 
  Award, 
  Sparkles, 
  TrendingUp, 
  Compass, 
  Briefcase, 
  CreditCard, 
  ShieldCheck, 
  ExternalLink,
  ChevronDown,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Users
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

interface NavSection {
  id: string;
  title: string;
  role: 'founder' | 'developer' | 'investor' | 'all';
  accentColor: string;
  items: NavItem[];
}

export function CollapsibleSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Initialize collapse preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('foundershub_sidebar_collapsed');
      if (saved !== null) {
        setIsCollapsed(saved === 'true');
      }
    } catch {}
  }, []);

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    try {
      localStorage.setItem('foundershub_sidebar_collapsed', String(next));
    } catch {}
  };

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname, searchParams]);

  const sections: NavSection[] = [
    {
      id: 'founder',
      title: 'Founder Suite',
      role: 'founder',
      accentColor: 'from-purple-500/20 to-indigo-500/10 text-purple-400 border-purple-500/30',
      items: [
        { name: 'Command Center', href: '/dashboard/founder', icon: LayoutDashboard, badge: 'Hub' },
        { name: 'View Ideas & Gates', href: '/dashboard/founder?tab=ideas', icon: Lightbulb },
        { name: '8-Dept Project Tools', href: '/departments', icon: Layers, badge: '8 Depts' },
        { name: 'Pitch & Media Assets', href: '/dashboard/founder?tab=media', icon: Video, badge: 'YT / PPT' },
        { name: 'Department Rosters', href: '/dashboard/founder?tab=team', icon: Users, badge: 'Team' },
        { name: 'AI Founder Copilot', href: '/dashboard/founder?tab=copilot', icon: Bot, badge: 'Gemini' },
        { name: 'Governance & Intake', href: '/dashboard/founder?tab=governance', icon: ShieldAlert },
        { name: 'Submit New Idea', href: '/dashboard/founder?tab=new-idea', icon: PlusCircle },
      ]
    },
    {
      id: 'developer',
      title: 'Developer Suite',
      role: 'developer',
      accentColor: 'from-sky-500/20 to-blue-500/10 text-sky-400 border-sky-500/30',
      items: [
        { name: 'Dev Workspace', href: '/dashboard/developer', icon: Code2, badge: 'Sprint' },
        { name: 'Active Backlog Tasks', href: '/dashboard/developer?tab=tasks', icon: CheckSquare },
        { name: 'Department Kanbans', href: '/departments', icon: Kanban, badge: 'Boards' },
        { name: 'Dynamic Equity Points', href: '/dashboard/developer?tab=vesting', icon: Award, badge: 'Ledger' },
        { name: 'Explore Sprints', href: '/discover', icon: Compass },
      ]
    },
    {
      id: 'investor',
      title: 'Investor Suite',
      role: 'investor',
      accentColor: 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30',
      items: [
        { name: 'Investor Dealroom', href: '/dashboard/investor', icon: TrendingUp, badge: 'Live' },
        { name: 'Verified Ventures', href: '/discover?stage=sprint_completed', icon: Compass },
        { name: 'Escrow Commitments', href: '/dashboard/investor?tab=portfolio', icon: CreditCard, badge: 'Razorpay' },
        { name: 'Branding Partner Strip', href: '/dashboard/investor?tab=branding', icon: Briefcase, badge: '30-Day' },
        { name: 'Trust & SPV Shield', href: '/trust', icon: ShieldCheck },
      ]
    },
    {
      id: 'platform',
      title: 'Platform & Explore',
      role: 'all',
      accentColor: 'from-slate-500/20 to-slate-700/10 text-slate-300 border-slate-700/30',
      items: [
        { name: 'Discover Ventures', href: '/discover', icon: Compass },
        { name: 'Sprint Engine Flow', href: '/how-it-works', icon: Layers },
        { name: 'DPIIT & Safe Harbor', href: '/trust', icon: ShieldCheck },
        { name: 'Economics & Pricing', href: '/pricing', icon: Sparkles },
      ]
    }
  ];

  // Role-strict filtering: Developer only sees Developer suite, Founder sees Founder, Investor sees Investor
  const userRole = user?.role;
  const filteredSections = sections.filter(sec => {
    if (sec.id === 'platform') return true;
    if (!userRole) return false;
    return sec.id === userRole;
  });

  // Calculate exact active state so only one item is selected
  const currentTab = searchParams.get('tab');
  const fullCurrentPath = currentTab ? `${pathname}?tab=${currentTab}` : pathname;

  const isItemActive = (itemHref: string) => {
    if (itemHref.includes('?tab=')) {
      return fullCurrentPath === itemHref;
    }
    return pathname === itemHref && !currentTab;
  };

  const content = (
    <div className="flex flex-col h-full bg-[#0d121f]/95 backdrop-blur-xl border-r border-white/10 select-none">
      
      {/* Top Bar / Collapse Toggle */}
      <div className="flex items-center justify-between p-3.5 border-b border-white/10 h-16 shrink-0">
        {!isCollapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-500/20 shrink-0">
              FH
            </div>
            <div className="flex flex-col truncate">
              <span className="font-bold text-xs text-white tracking-tight">FoundersHub</span>
              <span className="text-[10px] text-slate-400 truncate capitalize">
                {userRole ? `${userRole} Portal` : 'Platform Portal'}
              </span>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="mx-auto">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-indigo-500/20">
              FH
            </div>
          </div>
        )}

        <button
          onClick={toggleCollapse}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 hidden lg:flex items-center justify-center cursor-pointer"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>

        {/* Mobile close */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors lg:hidden cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Role Banner Badge */}
      {!isCollapsed && (
        <div className="px-3 py-2 border-b border-white/5 bg-black/20">
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/[0.03] border border-white/5">
            <span className={`w-2 h-2 rounded-full ${
              userRole === 'founder' ? 'bg-purple-400' :
              userRole === 'developer' ? 'bg-sky-400' :
              userRole === 'investor' ? 'bg-emerald-400' : 'bg-slate-400'
            }`} />
            <span className="text-[11px] font-semibold text-slate-300 capitalize">
              {userRole ? `${userRole} Workspace` : 'Guest Explorer'}
            </span>
          </div>
        </div>
      )}

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2.5 space-y-5 scrollbar-thin scrollbar-thumb-white/10">
        {filteredSections.map(sec => {
          return (
            <div key={sec.id} className="space-y-1">
              {!isCollapsed ? (
                <div className="px-2 pb-1 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {sec.title}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full border bg-gradient-to-r font-mono ${sec.accentColor}`}>
                    {sec.role}
                  </span>
                </div>
              ) : (
                <div className="w-full flex justify-center py-1">
                  <div className="w-5 h-0.5 rounded-full bg-white/10" />
                </div>
              )}

              <div className="space-y-0.5">
                {sec.items.map(item => {
                  const ItemIcon = item.icon;
                  const active = isItemActive(item.href);

                  return (
                    <div
                      key={item.name}
                      className="relative"
                      onMouseEnter={() => setHoveredItem(item.name)}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-medium transition-all ${
                          active
                            ? 'bg-indigo-600/25 text-white border border-indigo-500/50 shadow-md shadow-indigo-500/15 font-semibold'
                            : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <ItemIcon className={`w-4 h-4 shrink-0 transition-colors ${
                          active ? 'text-indigo-400' : 'text-slate-400 group-hover:text-white'
                        }`} />

                        {!isCollapsed && (
                          <div className="flex items-center justify-between w-full truncate">
                            <span className="truncate">{item.name}</span>
                            {item.badge && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/10 text-slate-300 font-mono shrink-0 ml-1.5 border border-white/5">
                                {item.badge}
                              </span>
                            )}
                          </div>
                        )}
                      </Link>

                      {/* Tooltip in Collapsed Mode */}
                      {isCollapsed && hoveredItem === item.name && (
                        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
                          <div className="bg-[#131b2e] border border-white/15 text-white text-xs px-2.5 py-1.5 rounded-xl shadow-xl shadow-black/50 whitespace-nowrap flex items-center gap-2">
                            <span>{item.name}</span>
                            {item.badge && (
                              <span className="text-[9px] px-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                {item.badge}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* User Role Pill & Footer Indicator */}
      <div className="p-3 border-t border-white/10 shrink-0 bg-black/30">
        {!isCollapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-slate-300 text-xs shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold text-white truncate">
                  {user?.name || 'Guest User'}
                </div>
                <div className="text-[10px] text-slate-400 capitalize flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    user?.role === 'founder' ? 'bg-purple-400' :
                    user?.role === 'developer' ? 'bg-sky-400' :
                    user?.role === 'investor' ? 'bg-emerald-400' : 'bg-slate-400'
                  }`} />
                  <span>{user?.role || 'Visitor'}</span>
                </div>
              </div>
            </div>

            <button
              onClick={toggleCollapse}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Collapse"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={toggleCollapse}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Column Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 sticky top-16 h-[calc(100vh-4rem)] z-30 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-[68px]' : 'w-[260px]'
        }`}
      >
        {content}
      </aside>

      {/* Mobile Floating Toggle Button */}
      <div className="lg:hidden fixed bottom-5 left-5 z-40">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-3 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/40 border border-indigo-400/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          title="Open Navigation Column"
        >
          <PanelLeftOpen className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Off-canvas Drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="lg:hidden fixed inset-y-0 left-0 w-[280px] z-50 shadow-2xl"
            >
              {content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
