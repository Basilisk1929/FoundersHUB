'use client';

import React, { Suspense } from 'react';
import { CollapsibleSidebar } from './CollapsibleSidebar';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex flex-1 min-h-[calc(100vh-4rem)]">
      {/* Left Collapsible Column Bar */}
      <Suspense fallback={<aside className="hidden lg:block w-[68px] bg-[#0d121f] shrink-0" />}>
        <CollapsibleSidebar />
      </Suspense>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}
