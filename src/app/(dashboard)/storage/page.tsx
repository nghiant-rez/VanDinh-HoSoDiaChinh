'use client';

import React, { useEffect, useState } from 'react';
import StorageExplorer from '@/components/storage/StorageExplorer';

export default function StoragePage() {
  const [treeData, setTreeData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStorageTree = async () => {
    try {
      if (treeData.length === 0) setLoading(true);
      const res = await fetch('http://localhost:8000/api/storage/tree', {
        headers: {
          'x-user-id': '1'
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
    <div className="h-full bg-white flex flex-col">
      <div className="flex-1 flex flex-col">
        {loading ? (
          <div className="text-center py-20 text-slate-500">Đang tải dữ liệu sơ đồ kho...</div>
        ) : (
          <StorageExplorer 
            treeData={treeData} 
            userRole="ADMIN" 
            onRefresh={fetchStorageTree}
          />
        )}
      </div>
    </div>
  );
}
