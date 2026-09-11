'use client';

import React, { useState } from 'react';
import Link from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '../auth/AuthContext';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Button } from '../ui/Button';
import { 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  LogOut, 
  User, 
  Compass, 
  Menu, 
  X 
} from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const getDashboardHref = () => {
    if (!user) return '/login';
    if (user.role === 'founder') return '/dashboard/founder';
    if (user.role === 'developer') return '/dashboard/developer';
    return '/dashboard/investor';
  };

  return (
    <nav className="sticky top-0 z-40 backdrop-blur-xl bg-[#0b0f19]/80 border-b border-white/10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <a href="/" className="flex items-center gap-3 group">
              <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Image
                  src="/brand/website-logo.png"
                  alt="FoundersHub Logo"
                  fill
                  sizes="36px"
                  className="object-cover"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                  Founders<span className="text-gradient-brand">Hub</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium -mt-1 hidden sm:inline">
                  Delivery is the Currency
                </span>
              </div>
            </a>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
              <a href="/discover" className="hover:text-white flex items-center gap-1.5 transition-colors">
                <Compass className="w-4 h-4 text-indigo-400" />
                Discover Ideas
              </a>
              <a href="/how-it-works" className="hover:text-white flex items-center gap-1.5 transition-colors">
                <Layers className="w-4 h-4 text-sky-400" />
                Sprint Engine
              </a>
              <a href="/trust" className="hover:text-white flex items-center gap-1.5 transition-colors">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Trust & DPIIT
              </a>
              <a href="/pricing" className="hover:text-white flex items-center gap-1.5 transition-colors">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Pricing
              </a>
            </div>
          </div>

          {/* Right Section: Theme toggle, Auth */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />

            {user ? (
              <div className="flex items-center gap-3 pl-2 border-l border-white/10">
                <a href={getDashboardHref()}>
                  <Button variant="glow" size="sm" className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>My Dashboard</span>
                  </Button>
                </a>
                <button
                  onClick={logout}
                  title="Log out"
                  className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                <a href="/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </a>
                <a href="/signup">
                  <Button variant="glow" size="sm">Get Started</Button>
                </a>
              </div>
            )}
          </div>

          {/* Mobile hamburger menu */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#0f172a] border-b border-white/10 px-4 pt-2 pb-6 space-y-3">
          <a href="/discover" className="block py-2 text-slate-200 hover:text-white font-medium" onClick={() => setIsMenuOpen(false)}>
            Discover Ideas
          </a>
          <a href="/how-it-works" className="block py-2 text-slate-200 hover:text-white font-medium" onClick={() => setIsMenuOpen(false)}>
            Sprint Engine
          </a>
          <a href="/trust" className="block py-2 text-slate-200 hover:text-white font-medium" onClick={() => setIsMenuOpen(false)}>
            Trust & DPIIT
          </a>
          <a href="/pricing" className="block py-2 text-slate-200 hover:text-white font-medium" onClick={() => setIsMenuOpen(false)}>
            Pricing
          </a>

          {user ? (
            <div className="pt-4 border-t border-white/10 space-y-2">
              <a href={getDashboardHref()} className="block w-full" onClick={() => setIsMenuOpen(false)}>
                <Button variant="glow" className="w-full">Open Dashboard ({user.role})</Button>
              </a>
              <Button variant="secondary" className="w-full text-red-400" onClick={() => { logout(); setIsMenuOpen(false); }}>
                Log Out
              </Button>
            </div>
          ) : (
            <div className="pt-4 border-t border-white/10 flex gap-2">
              <a href="/login" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                <Button variant="secondary" className="w-full">Sign In</Button>
              </a>
              <a href="/signup" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                <Button variant="glow" className="w-full">Join Hub</Button>
              </a>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
