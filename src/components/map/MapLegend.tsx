'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const LAND_TYPES = [
  { code: 'LUC', label: 'Đất lúa nước', color: '#22c55e' },
  { code: 'ODT', label: 'Đất ở', color: '#ef4444' },
  { code: 'BHK', label: 'Đất bằng hoang', color: '#f59e0b' },
  { code: 'CLN', label: 'Cây lâu năm', color: '#84cc16' },
  { code: 'DGT', label: 'Giao thông', color: '#6b7280' },
  { code: 'DTL', label: 'Thủy lợi', color: '#3b82f6' },
  { code: 'NTS', label: 'Nuôi trồng thủy sản', color: '#06b6d4' },
  { code: 'TMD', label: 'Thương mại dịch vụ', color: '#a855f7' },
  { code: 'SKC', label: 'Sản xuất kinh doanh', color: '#f97316' },
  { code: 'CQP', label: 'Quốc phòng', color: '#64748b' },
];

interface MapLegendProps {
  parcelCount: number;
}

export function MapLegend({ parcelCount }: MapLegendProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="absolute bottom-4 right-12 bg-bg-card rounded-xl shadow-lg border border-border z-10 overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-text-primary hover:bg-bg-main transition-colors"
      >
        <span>
          Chú giải
          {parcelCount > 0 && (
            <span className="ml-2 text-xs font-normal text-text-secondary">
              ({parcelCount.toLocaleString('vi-VN')} thửa)
            </span>
          )}
        </span>
        {collapsed ? (
          <ChevronUp className="w-4 h-4 text-text-secondary" />
        ) : (
          <ChevronDown className="w-4 h-4 text-text-secondary" />
        )}
      </button>

      {!collapsed && (
        <div className="px-4 pb-3 space-y-1.5">
          {LAND_TYPES.map((type) => (
            <div
              key={type.code}
              className="flex items-center space-x-2 text-xs text-text-secondary"
            >
              <div
                className="w-3 h-3 rounded-full border border-white/50 flex-shrink-0"
                style={{ backgroundColor: type.color }}
              />
              <span className="font-mono text-[10px] w-7 text-text-secondary/70">
                {type.code}
              </span>
              <span>{type.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
