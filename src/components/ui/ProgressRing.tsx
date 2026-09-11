'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ProgressRingProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  colorGradient?: 'brand' | 'emerald' | 'amber';
}

export function ProgressRing({
  value,
  size = 110,
  strokeWidth = 9,
  label,
  sublabel,
  colorGradient = 'brand'
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.min(100, Math.max(0, value));
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

  const gradientId = `ring_grad_${colorGradient}_${size}`;

  return (
    <div className="flex flex-col items-center justify-center relative">
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            {colorGradient === 'brand' && (
              <>
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="50%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#38bdf8" />
              </>
            )}
            {colorGradient === 'emerald' && (
              <>
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#059669" />
              </>
            )}
            {colorGradient === 'amber' && (
              <>
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#d97706" />
              </>
            )}
          </linearGradient>
        </defs>

        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Animated Progress Arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      {/* Center Value Text */}
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-bold tracking-tight text-white">
          {clampedValue}
          <span className="text-xs text-indigo-400 font-semibold">%</span>
        </span>
        {label && <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium mt-0.5">{label}</span>}
      </div>

      {sublabel && (
        <span className="text-xs text-slate-400 font-medium mt-2 text-center">{sublabel}</span>
      )}
    </div>
  );
}
