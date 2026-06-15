'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Map as MapIcon, History } from 'lucide-react';

const navItems = [
  { name: 'Trang chủ', href: '/', icon: Home },
  { name: 'Tra cứu', href: '/search', icon: Search },
  { name: 'Bản đồ số', href: '/map', icon: MapIcon },
  { name: 'Nhật ký', href: '/logs', icon: History },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-bg-sidebar border-r border-border h-full flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-primary">Hệ thống Lưu trữ</h1>
        <p className="text-sm text-text-secondary">Xã Vạn Đình</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-text-secondary hover:bg-bg-main hover:text-text-primary'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        {/* User profile block at bottom */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
            U
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">Người dùng</p>
            <p className="text-xs text-text-secondary">Xem hồ sơ</p>
          </div>
        </div>
      </div>
    </div>
  );
}
