'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/components/auth/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Auto-redirect if already logged in
  React.useEffect(() => {
    if (user) {
      if (user.role === 'founder') router.replace('/dashboard/founder');
      else if (user.role === 'developer') router.replace('/dashboard/developer');
      else if (user.role === 'investor') router.replace('/dashboard/investor');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(email, password);
    setIsLoading(false);

    if (result.success) {
      const role = result.user?.role || 'founder';
      if (role === 'founder') {
        router.push('/dashboard/founder');
      } else if (role === 'developer') {
        router.push('/dashboard/developer');
      } else if (role === 'investor') {
        router.push('/dashboard/investor');
      } else {
        router.push('/dashboard/founder');
      }
    } else {
      setError(result.error || 'Invalid credentials');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      
      {/* Ambient background glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/10 blur-[100px] pointer-events-none -z-10" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md glass-panel-glow border border-white/10 bg-[#0f172a]/95 p-8 rounded-3xl shadow-2xl relative overflow-hidden"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
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
            Welcome to Founders<span className="text-gradient-brand">Hub</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Email and password access to your venture dashboard
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="founder@founderhub.com"
                className="w-full glass-input pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full glass-input pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="glow"
            isLoading={isLoading}
            className="w-full mt-2 flex items-center justify-center gap-2"
          >
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        {/* Link to Signup */}
        <div className="mt-6 text-center text-xs text-slate-400">
          New to FoundersHub?{' '}
          <a href="/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4">
            Create an account
          </a>
        </div>

      </motion.div>
    </div>
  );
}
