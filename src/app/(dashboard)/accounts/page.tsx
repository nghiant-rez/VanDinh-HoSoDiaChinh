'use client';

import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';

export default function AccountsPage() {
  const columns = [
    { key: 'username', header: 'Tài khoản' },
    { key: 'full_name', header: 'Họ và tên' },
    { key: 'role', header: 'Quyền hạn' },
    { 
      key: 'status', 
      header: 'Trạng thái',
      render: (row: any) => (
        <Badge variant={row.is_active ? 'success' : 'danger'}>
          {row.is_active ? 'Hoạt động' : 'Khóa'}
        </Badge>
      )
    },
  ];

  const dummyData = [
    { id: 1, username: 'admin', full_name: 'Quản trị viên', role: 'ADMIN', is_active: true },
    { id: 2, username: 'staff', full_name: 'Cán bộ xã', role: 'STAFF', is_active: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-text-primary">Quản lý tài khoản</h2>
        <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark">
          + Thêm tài khoản
        </button>
      </div>

      <DataTable columns={columns} data={dummyData} />
    </div>
  );
}
