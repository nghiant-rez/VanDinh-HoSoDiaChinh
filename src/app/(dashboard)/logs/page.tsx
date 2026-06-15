'use client';

import { FilterPanel } from '@/components/ui/FilterPanel';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';

export default function LogsPage() {
  const columns = [
    { key: 'created_at', header: 'Thời gian' },
    { key: 'username', header: 'Người dùng' },
    { 
      key: 'action', 
      header: 'Thao tác',
      render: (row: any) => {
        let variant: 'insert' | 'update' | 'export' | 'default' = 'default';
        if (row.action === 'INSERT') variant = 'insert';
        if (row.action === 'UPDATE') variant = 'update';
        if (row.action === 'EXPORT') variant = 'export';
        return <Badge variant={variant}>{row.action}</Badge>;
      }
    },
    { key: 'details', header: 'Chi tiết' },
  ];

  const dummyData = [
    { id: 1, created_at: '2026-06-15 10:30', username: 'admin', action: 'INSERT', details: 'Thêm hồ sơ HS-001' },
    { id: 2, created_at: '2026-06-15 09:15', username: 'staff', action: 'EXPORT', details: 'Xuất PDF hồ sơ HS-002' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-text-primary">Nhật ký hệ thống</h2>
      
      <div className="bg-bg-card p-4 rounded-xl border border-border mb-6 flex gap-4">
        {/* Simple inline filter for logs */}
        <input type="date" className="p-2 text-sm border border-border rounded" />
        <select className="p-2 text-sm border border-border rounded bg-bg-card">
          <option>Tất cả người dùng</option>
          <option>admin</option>
          <option>staff</option>
        </select>
      </div>

      <DataTable columns={columns} data={dummyData} />
    </div>
  );
}
