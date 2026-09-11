'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Sparkles, Compass, HelpCircle, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  matches?: Array<{
    _id: string;
    name: string;
    tagline: string;
    sector: string;
    executionScore: number;
    matchReason: string;
  }>;
}

export function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'support' | 'matching'>('support');
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: '👋 Welcome to FoundersHub! How can I assist you today? You can ask me how sprints and equity work, or switch to **Startup Matching Mode** to discover projects curated for your profile.'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Matching Mode state
  const [matchingStep, setMatchingStep] = useState<number>(0);
  const [matchingRole, setMatchingRole] = useState<'developer' | 'investor'>('developer');
  const [matchingSector, setMatchingSector] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (customMessage?: string) => {
    const textToSend = customMessage || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = { sender: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/site-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'support',
          message: textToSend
        })
      });
      const data = await res.json();
      setMessages(prev => [
        ...prev,
        { sender: 'bot', text: data.text || 'I can help guide you through FoundersHub. Try asking about the Readiness Gate or Sprint Engine!' }
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        { sender: 'bot', text: 'Network connection error. Please try again.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerMatching = async (role: 'developer' | 'investor', sector: string) => {
    setIsLoading(true);
    setMessages(prev => [
      ...prev,
      { sender: 'user', text: `Match me with ${role === 'developer' ? 'builder' : 'investment'} opportunities in ${sector || 'all sectors'}` }
    ]);

    try {
      const res = await fetch('/api/ai/site-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'matching',
          answers: { role, sector, skills: 'fullstack ai backend frontend' }
        })
      });
      const data = await res.json();
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: data.text || 'Here are curated startup matches for your profile:',
          matches: data.matches
        }
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        { sender: 'bot', text: 'Failed to fetch recommendations. Please check the Discover page.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating launcher trigger */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500 text-white shadow-xl shadow-indigo-500/30 border border-white/20 font-medium text-sm hover:shadow-indigo-500/50 transition-shadow"
          aria-label="Open AI Assistant"
        >
          <Sparkles className="w-4 h-4 animate-spin-slow" />
          <span className="hidden sm:inline">FoundersHub AI</span>
          <MessageSquare className="w-4 h-4" />
        </motion.button>
      )}

      {/* Slide-in glass Drawer / Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="w-[92vw] sm:w-[420px] h-[580px] glass-panel-glow bg-[#0f172a]/95 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                    FoundersHub Assistant
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-500/20 text-indigo-300 font-normal">AI</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">Support & Startup Matching</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 p-1.5 bg-black/20 border-b border-white/5 text-xs">
              <button
                onClick={() => setMode('support')}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-medium transition-colors ${
                  mode === 'support' ? 'bg-indigo-600/30 text-white border border-indigo-500/40' : 'text-slate-400 hover:text-white'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                Support Mode
              </button>
              <button
                onClick={() => setMode('matching')}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-medium transition-colors ${
                  mode === 'matching' ? 'bg-indigo-600/30 text-white border border-indigo-500/40' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                Startup Matching
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs leading-relaxed">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 ${
                      m.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-white/5 border border-white/10 text-slate-200 rounded-bl-none whitespace-pre-line'
                    }`}
                  >
                    {m.text}

                    {/* Matched startups cards if present */}
                    {m.matches && m.matches.length > 0 && (
                      <div className="mt-3 space-y-2 pt-2 border-t border-white/10">
                        {m.matches.map(st => (
                          <a
                            key={st._id}
                            href={`/startups/${st._id}`}
                            className="block p-2.5 rounded-xl bg-black/40 border border-white/10 hover:border-indigo-500/40 transition-colors group"
                          >
                            <div className="flex items-center justify-between font-bold text-white group-hover:text-indigo-300">
                              <span>{st.name}</span>
                              <span className="text-[10px] text-emerald-400 font-semibold">{st.executionScore} score</span>
                            </div>
                            <div className="text-[10px] text-slate-400 line-clamp-1">{st.tagline}</div>
                            <div className="mt-1.5 text-[10px] text-indigo-300 italic flex items-center gap-1">
                              <span>Why match: {st.matchReason}</span>
                              <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-1.5 text-slate-400 text-xs py-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce delay-100" />
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce delay-200" />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Matching Interactive Prompt Drawer if Matching Mode */}
            {mode === 'matching' && (
              <div className="p-3 bg-white/[0.02] border-t border-white/10 space-y-2 text-xs">
                <div className="text-[11px] font-semibold text-slate-300">
                  Find Projects for your Profile:
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setMatchingRole('developer'); handleTriggerMatching('developer', 'AI / Software'); }}
                    className="flex-1 py-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 font-medium"
                  >
                    Builder (Earn Equity)
                  </button>
                  <button
                    onClick={() => { setMatchingRole('investor'); handleTriggerMatching('investor', 'AI / Software'); }}
                    className="flex-1 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 font-medium"
                  >
                    Investor (Fund Teams)
                  </button>
                </div>
              </div>
            )}

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3 border-t border-white/10 bg-black/30 flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={mode === 'support' ? 'Ask a question about FoundersHub...' : 'Describe what type of startup you seek...'}
                className="flex-1 glass-input px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
