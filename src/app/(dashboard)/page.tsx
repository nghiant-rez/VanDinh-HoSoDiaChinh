'use client';

import { useState, useEffect } from 'react';
import { StatCard } from '@/components/ui/StatCard';
import { FileText, Map as MapIcon, Database, Box, Layers, Archive, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/dashboard/stats', {
          headers: { 'x-user-id': '1' }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="flex flex-col items-center text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-4" />
          <p>Đang tải dữ liệu tổng quan...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-[50vh] text-red-500">
        Không thể tải dữ liệu Dashboard. Vui lòng thử lại sau.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Tổng quan hệ thống</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard 
          title="Tổng số hồ sơ" 
          value={stats.total_hoso.toString()} 
          icon={FileText} 
          trend="0%" 
          trendUp={true} 
        />
        <StatCard 
          title="Thửa đất" 
          value={stats.total_thuadat.toString()} 
          icon={MapIcon} 
          trend="0%" 
          trendUp={true} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 flex flex-col min-h-[150px]">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center">
            <Database className="w-5 h-5 mr-2 text-indigo-500" />
            Cấu trúc kho lưu trữ
          </h3>
          <div className="grid grid-cols-2 gap-4 flex-1">
            <div className="flex items-center p-4 bg-slate-50 rounded-lg border border-slate-100">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-lg mr-4">
                <Archive className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-700">{stats.storage_stats.kho}</p>
                <p className="text-sm font-medium text-slate-500">Kho</p>
              </div>
            </div>
            
            <div className="flex items-center p-4 bg-slate-50 rounded-lg border border-slate-100">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg mr-4">
                <Box className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-700">{stats.storage_stats.ke}</p>
                <p className="text-sm font-medium text-slate-500">Kệ</p>
              </div>
            </div>
            
            <div className="flex items-center p-4 bg-slate-50 rounded-lg border border-slate-100">
              <div className="p-3 bg-amber-100 text-amber-600 rounded-lg mr-4">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-700">{stats.storage_stats.tang}</p>
                <p className="text-sm font-medium text-slate-500">Tầng</p>
              </div>
            </div>

            <div className="flex items-center p-4 bg-slate-50 rounded-lg border border-slate-100">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-lg mr-4">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-700">{stats.storage_stats.hop}</p>
                <p className="text-sm font-medium text-slate-500">Hộp số</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 flex flex-col min-h-[150px]">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center">
            <RefreshCw className="w-5 h-5 mr-2 text-blue-500" />
            Hồ sơ tạo mới gần đây
          </h3>
          
          {stats.recent_activities && stats.recent_activities.length > 0 ? (
            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2">
              {stats.recent_activities.map((hoso: any) => (
                <Link key={hoso.id} href={`/hoso/${hoso.id}`}>
                  <div className="group flex flex-col p-3 border border-slate-100 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-slate-700 group-hover:text-blue-700 line-clamp-1">{hoso.mahoso}</span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 whitespace-nowrap">
                        {hoso.trangthai || "N/A"}
                      </span>
                    </div>
                    <div className="text-sm text-slate-500 line-clamp-1 mb-1">{hoso.tenhoso}</div>
                    <div className="text-xs text-slate-400">
                      {hoso.chusohuu ? `Chủ: ${hoso.chusohuu}` : "Chưa có thông tin chủ"}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-sm text-slate-400 flex-1 flex flex-col items-center justify-center italic bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <FileText className="w-8 h-8 mb-2 text-slate-300" />
              Chưa có hồ sơ nào được tạo
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
