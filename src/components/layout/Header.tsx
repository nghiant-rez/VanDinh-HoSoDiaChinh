'use client';

import { LogOut, User } from 'lucide-react';

export function Header() {
  return (
    <header className="h-16 bg-bg-card border-b border-border flex items-center justify-between px-6">
      <div className="flex-1">
        {/* Page title could go here, or handled by page content */}
      </div>
    </header>
  );
}
