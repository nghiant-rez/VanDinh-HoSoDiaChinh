'use client';

import React from 'react';
import { GitCommit, GitMerge, FileText, ArrowDown } from 'lucide-react';

interface LinkedDossier {
  id: number;
  mahoso: string;
  tenhoso: string;
  loailienket: string; // e.g. "Gốc", "Tách thửa", "Cấp đổi"
  date: string;
  isCurrent?: boolean;
}

interface GenealogyTimelineProps {
  links: LinkedDossier[];
}

export function GenealogyTimeline({ links }: GenealogyTimelineProps) {
  if (!links || links.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-slate-500">
        <GitCommit className="w-12 h-12 mb-3 text-slate-300" />
        <p>Không có dữ liệu liên kết hồ sơ (Gia phả).</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6">
      <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
        <GitMerge className="w-5 h-5 text-indigo-600" /> Cây Gia Phả Hồ Sơ
      </h3>
      
      <div className="space-y-4">
        {links.map((link, index) => (
          <div key={link.id} className="relative">
            {/* Đường nối timeline */}
            {index !== links.length - 1 && (
              <div className="absolute top-10 left-6 bottom-[-30px] w-0.5 bg-indigo-200" />
            )}
            
            <div className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${link.isCurrent ? 'bg-indigo-50 border-indigo-300 shadow-md ring-1 ring-indigo-200' : 'bg-white border-slate-200 hover:border-indigo-300'}`}>
              
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 z-10 border-4 ${link.isCurrent ? 'bg-indigo-600 border-indigo-100 text-white' : 'bg-white border-indigo-100 text-indigo-500'}`}>
                {index === 0 ? <GitCommit className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
              </div>
              
              <div className="flex-1 pt-1">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${link.isCurrent ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-100 text-slate-600'}`}>
                    {link.loailienket}
                  </span>
                  <span className="text-xs text-slate-500">{link.date}</span>
                </div>
                <h4 className={`text-base font-semibold ${link.isCurrent ? 'text-indigo-900' : 'text-slate-800'}`}>
                  {link.tenhoso}
                </h4>
                <div className="flex items-center gap-2 mt-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-mono text-slate-600">{link.mahoso}</span>
                </div>
              </div>
              
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
