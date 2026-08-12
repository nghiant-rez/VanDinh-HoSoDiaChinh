'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Map as MapIcon, History, Building2, LogOut, ChevronLeft, ChevronRight, Archive } from 'lucide-react';

const navItems = [
  { name: 'Trang chủ', href: '/', icon: Home },
  { name: 'Tra cứu', href: '/search', icon: Search },
  { name: 'Bản đồ số', href: '/map', icon: MapIcon },
  { name: 'Nhật ký', href: '/logs', icon: History },
  { name: 'Kho lưu trữ', href: '/storage', icon: Building2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`bg-slate-900 border-r border-slate-800/80 text-slate-300 h-full flex flex-col transition-all duration-300 select-none ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Header & Nút ẩn/hiện Sidebar */}
      <div className={`p-4 border-b border-slate-800 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && (
          <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20 shrink-0">
              <Archive className="w-5 h-5 text-white" />
            </div>
            <div className="overflow-hidden">
              <h1 className="text-base font-bold text-white tracking-tight truncate">Hệ thống Lưu trữ</h1>
              <p className="text-[11px] text-slate-400 font-medium truncate">Xã Vân Đình</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0"
          title={isCollapsed ? "Mở rộng thanh menu" : "Thu gọn thanh menu"}
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5 text-emerald-400" /> : <ChevronLeft className="w-5 h-5 text-slate-400" />}
        </button>
      </div>

      {/* Menu items */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              title={isCollapsed ? item.name : undefined}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all ${
                isCollapsed ? 'justify-center px-0' : ''
              } ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600/30 to-emerald-500/20 text-emerald-300 font-semibold shadow-inner border-l-4 border-emerald-400'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
              }`}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
              {!isCollapsed && <span className="text-sm truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer / User info */}
      <div className="p-3 border-t border-slate-800">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} group`}>
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
              U
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-slate-200 truncate">Người dùng</p>
                <p className="text-xs text-slate-400 truncate">Xem hồ sơ</p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' });
                window.location.href = '/login';
              }}
              className="p-1.5 text-slate-400 hover:text-red-400 transition-colors rounded-lg hover:bg-slate-800 opacity-0 group-hover:opacity-100 flex-shrink-0"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


