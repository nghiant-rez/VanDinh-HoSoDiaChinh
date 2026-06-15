'use client';

import { useState } from 'react';
import { FilterPanel } from '@/components/ui/FilterPanel';
import { DataTable } from '@/components/ui/DataTable';

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const columns = [
    { key: 'ma_ho_so', header: 'Mã hồ sơ' },
    { key: 'ten_ho_so', header: 'Tên hồ sơ' },
    { key: 'chu_so_huu', header: 'Chủ sở hữu' },
    { key: 'loai_ho_so', header: 'Loại hồ sơ' },
    { key: 'has_scan', header: 'Bản scan', render: (row: any) => row.has_scan ? 'Có' : 'Không' },
  ];

  const dummyData = [
    { id: 1, ma_ho_so: 'HS-001', ten_ho_so: 'Hồ sơ cấp mới GCN Nguyễn Văn A', chu_so_huu: 'Nguyễn Văn A', loai_ho_so: 'Cấp mới', has_scan: true },
    { id: 2, ma_ho_so: 'HS-002', ten_ho_so: 'Hồ sơ chuyển nhượng Trần Thị B', chu_so_huu: 'Trần Thị B', loai_ho_so: 'Chuyển nhượng', has_scan: false },
  ];

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-text-primary">Tra cứu hồ sơ</h2>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Left Filter Panel */}
        <div className="w-64 flex-shrink-0 overflow-y-auto pr-2">
          <FilterPanel 
            title="Bộ lọc tìm kiếm" 
            onSearch={setSearchTerm} 
            searchPlaceholder="Mã, tên hồ sơ, chủ..."
          >
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Loại hồ sơ</label>
              <div className="space-y-2 text-sm text-text-secondary">
                <label className="flex items-center"><input type="checkbox" className="mr-2" /> Cấp mới</label>
                <label className="flex items-center"><input type="checkbox" className="mr-2" /> Chuyển nhượng</label>
                <label className="flex items-center"><input type="checkbox" className="mr-2" /> Thừa kế</label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Thông tin thửa đất</label>
              <input type="text" placeholder="Số thửa" className="w-full mb-2 p-2 text-sm border border-border rounded" />
              <input type="text" placeholder="Tờ bản đồ" className="w-full p-2 text-sm border border-border rounded" />
            </div>
          </FilterPanel>
        </div>

        {/* Right Content */}
        <div className="flex-1 flex flex-col">
          <DataTable 
            columns={columns} 
            data={dummyData} 
            onRowClick={(row) => console.log('Clicked', row)}
          />
        </div>
      </div>
    </div>
  );
}
