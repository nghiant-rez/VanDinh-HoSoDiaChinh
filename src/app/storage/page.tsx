'use client';

import React, { useEffect, useState } from 'react';
import StorageExplorer from '@/components/storage/StorageExplorer';

export default function StoragePage() {
  const [treeData, setTreeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('ADMIN'); // Giả lập role, thực tế lấy từ JWT/Auth Context

  const fetchStorageTree = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:8000/api/storage/tree', {
        headers: {
          'x-user-id': '1' // Giả lập truyền token user admin
        }
      });
      if (res.ok) {
        const data = await res.json();
        setTreeData(data);
      } else {
        console.error('Failed to fetch storage tree');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStorageTree();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800">Quản Lý Kho Lưu Trữ Vật Lý</h1>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Giả lập Role:</span>
            <select 
              value={userRole} 
              onChange={(e) => setUserRole(e.target.value)}
              className="border border-slate-300 rounded-md px-2 py-1 text-sm outline-none"
            >
              <option value="ADMIN">ADMIN</option>
              <option value="STAFF">STAFF</option>
            </select>
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-20 text-slate-500">Đang tải dữ liệu sơ đồ kho...</div>
        ) : (
          <StorageExplorer 
            treeData={treeData} 
            userRole={userRole} 
            onRefresh={fetchStorageTree}
          />
        )}
      </div>
    </div>
  );
}
