'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Briefcase, Code2, TrendingUp, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/components/auth/AuthContext';
import { UserRole } from '@/types';

const SKILLS_OPTIONS = [
  'React / Next.js', 'Node.js', 'Python / AI', 'TypeScript',
  'UI/UX Design', 'Solidity / Web3', 'DevOps / Cloud', 'Growth Marketing'
];

const SECTOR_OPTIONS = [
  'AI / Software', 'FinTech', 'CleanTech', 'HealthTech', 'B2B SaaS', 'EdTech'
];

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signup } = useAuth();

  const [role, setRole] = useState<UserRole>('founder');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'founder' || roleParam === 'developer' || roleParam === 'investor') {
      setRole(roleParam);
    }
  }, [searchParams]);

  const toggleSkill = (skill: string) => {
    setSkills(prev => 
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const toggleSector = (sector: string) => {
    setSectors(prev => 
      prev.includes(sector) ? prev.filter(s => s !== sector) : [...prev, sector]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    const result = await signup({
      name,
      email,
      password,
      role,
      bio,
      skills,
      sectorsOfInterest: sectors
    });
    setIsLoading(false);

    if (result.success) {
      if (role === 'founder') router.push('/dashboard/founder');
      else if (role === 'developer') router.push('/dashboard/developer');
      else router.push('/dashboard/investor');
    } else {
      setError(result.error || 'Failed to create account');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-purple-600/10 blur-[100px] pointer-events-none -z-10" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-lg glass-panel-glow border border-white/10 bg-[#0f172a]/95 p-8 rounded-3xl shadow-2xl relative overflow-hidden"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="relative w-12 h-12 mx-auto mb-3 rounded-2xl overflow-hidden shadow-lg shadow-indigo-500/20">
            <Image
              src="/brand/website-logo.png"
              alt="FoundersHub"
              fill
              sizes="48px"
              className="object-cover"
            />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Create your account
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Choose your ecosystem role to begin delivering
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl glass-panel mb-6">
          <button
            type="button"
            onClick={() => setRole('founder')}
            className={`flex flex-col items-center py-2.5 px-2 rounded-xl text-xs font-semibold transition-all ${
              role === 'founder'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Briefcase className="w-4 h-4 mb-1" />
            <span>Founder</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('developer')}
            className={`flex flex-col items-center py-2.5 px-2 rounded-xl text-xs font-semibold transition-all ${
              role === 'developer'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code2 className="w-4 h-4 mb-1" />
            <span>Developer</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('investor')}
            className={`flex flex-col items-center py-2.5 px-2 rounded-xl text-xs font-semibold transition-all ${
              role === 'investor'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4 mb-1" />
            <span>Investor</span>
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aarav Sharma"
                className="w-full glass-input pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full glass-input pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password (min 8 characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full glass-input pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500"
              />
            </div>
          </div>

          {/* Role specific inputs */}
          {role === 'developer' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Technical Skills & Specializations
              </label>
              <div className="flex flex-wrap gap-1.5">
                {SKILLS_OPTIONS.map(skill => {
                  const selected = skills.includes(skill);
                  return (
                    <button
                      type="button"
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                        selected
                          ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {role === 'investor' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Sectors of Interest
              </label>
              <div className="flex flex-wrap gap-1.5">
                {SECTOR_OPTIONS.map(sec => {
                  const selected = sectors.includes(sec);
                  return (
                    <button
                      type="button"
                      key={sec}
                      onClick={() => toggleSector(sec)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                        selected
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      {sec}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Bio / Past Experience
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell other members briefly about your background..."
              className="w-full glass-input p-2.5 text-xs text-white placeholder-slate-500"
            />
          </div>

          <Button
            type="submit"
            variant="glow"
            isLoading={isLoading}
            className="w-full mt-4 flex items-center justify-center gap-2"
          >
            <span>Create {role.charAt(0).toUpperCase() + role.slice(1)} Account</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <a href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4">
            Sign In
          </a>
        </div>

      </motion.div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-[85vh] flex items-center justify-center text-xs text-slate-400">Loading signup...</div>}>
      <SignupForm />
    </Suspense>
  );
}
