import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
}

export function StatCard({ title, value, icon: Icon, trend, trendUp }: StatCardProps) {
  return (
    <div className="bg-bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-text-secondary mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-text-primary">{value}</h3>
          
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${trendUp ? 'text-success' : 'text-danger'}`}>
              <span className="font-medium">{trend}</span>
              <span className="text-text-secondary ml-2">so với tháng trước</span>
            </div>
          )}
        </div>
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
