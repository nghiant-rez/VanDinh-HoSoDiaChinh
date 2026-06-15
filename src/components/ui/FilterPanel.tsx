import React from 'react';
import { Search, Filter } from 'lucide-react';

interface FilterPanelProps {
  children?: React.ReactNode;
  onSearch?: (value: string) => void;
  searchPlaceholder?: string;
  title?: string;
}

export function FilterPanel({ children, onSearch, searchPlaceholder = 'Tìm kiếm...', title = 'Bộ lọc' }: FilterPanelProps) {
  return (
    <div className="bg-bg-card rounded-xl border border-border p-5 space-y-4">
      <div className="flex items-center space-x-2 pb-2 border-b border-border">
        <Filter className="w-5 h-5 text-text-secondary" />
        <h3 className="font-semibold text-text-primary">{title}</h3>
      </div>
      
      {onSearch && (
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-text-secondary" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-border rounded-lg text-sm bg-bg-main text-text-primary focus:ring-primary focus:border-primary placeholder-text-secondary"
            placeholder={searchPlaceholder}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      )}
      
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}
