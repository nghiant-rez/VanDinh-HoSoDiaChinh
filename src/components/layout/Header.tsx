'use client';

import { LogOut, User } from 'lucide-react';

export function Header() {
  return (
    <header className="h-16 bg-bg-card border-b border-border flex items-center justify-between px-6">
      <div className="flex-1">
        {/* Page title could go here, or handled by page content */}
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <User className="w-5 h-5 text-text-secondary" />
          <span className="text-sm font-medium text-text-primary">Tài khoản</span>
        </div>
        <button
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/login';
          }}
          className="p-2 text-text-secondary hover:text-danger transition-colors rounded-full hover:bg-danger/10"
          title="Đăng xuất"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
