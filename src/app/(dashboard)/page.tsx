import { StatCard } from '@/components/ui/StatCard';
import { FileText, Map as MapIcon } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-text-primary">Tổng quan hệ thống</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard 
          title="Tổng số hồ sơ" 
          value="0" 
          icon={FileText} 
          trend="0%" 
          trendUp={true} 
        />
        <StatCard 
          title="Thửa đất" 
          value="0" 
          icon={MapIcon} 
          trend="0%" 
          trendUp={true} 
        />

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-bg-card border border-border rounded-xl p-6 flex flex-col min-h-[150px]">
          <h3 className="font-semibold text-text-primary mb-4">Sơ đồ kho lưu trữ</h3>
          <div className="text-sm text-text-secondary flex-1 flex items-center justify-center italic">
            Chưa có dữ liệu
          </div>
        </div>

        <div className="bg-bg-card border border-border rounded-xl p-6 flex flex-col min-h-[150px]">
          <h3 className="font-semibold text-text-primary mb-4">Hoạt động gần đây</h3>
          <div className="text-sm text-text-secondary flex-1 flex items-center justify-center italic">
            Chưa có dữ liệu
          </div>
        </div>
      </div>
    </div>
  );
}
