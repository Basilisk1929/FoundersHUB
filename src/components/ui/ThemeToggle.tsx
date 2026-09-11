'use client';

import React from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label="Toggle light or dark theme"
      className="p-2 rounded-xl border border-white/10 hover:border-indigo-500/50 bg-white/5 hover:bg-white/10 transition-all duration-200 text-slate-300 hover:text-white relative overflow-hidden"
    >
      <motion.div
        key={theme}
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 12, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="flex items-center justify-center"
      >
        {theme === 'dark' ? (
          <Sun className="w-4 h-4 text-amber-400" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-400" />
        )}
      </motion.div>
    </button>
  );
}
