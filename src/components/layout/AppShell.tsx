'use client';

import React from 'react';
import { CollapsibleSidebar } from './CollapsibleSidebar';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex flex-1 min-h-[calc(100vh-4rem)]">
      {/* Left Collapsible Column Bar */}
      <CollapsibleSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}
