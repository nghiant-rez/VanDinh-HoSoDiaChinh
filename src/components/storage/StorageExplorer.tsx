'use client';

import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Building2, Server, Layers, Archive, Plus, Edit, Trash2 } from 'lucide-react';
import StorageModal from './StorageModal';

// --- ĐỊNH NGHĨA KIỂU DỮ LIỆU ---
type HopSo = { id: number; tenhopso: string; tangluutruid: int };
type Tang = { id: number; tentang: string; keluutruid: int; hop_sos: HopSo[] };
type Ke = { id: number; tenke: string; kholuutruid: int; tangs: Tang[] };
type Kho = { id: number; makho: string; tenkho: string; kes: Ke[] };

const TreeNode = ({ 
  title, subtitle, icon: Icon, children, level, userRole, onAdd, onEdit, onDelete 
}: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const isLeaf = !children || children.length === 0;
  const paddingLeft = level * 24 + 16; 

  return (
    <div className="flex flex-col">
      <div 
        className="group flex items-center justify-between py-2.5 pr-4 border-b border-transparent hover:bg-slate-50 hover:border-slate-100 transition-colors cursor-pointer"
        style={{ paddingLeft: `${paddingLeft}px` }}
        onClick={() => !isLeaf && setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 text-slate-700">
          <span className="w-5 flex justify-center text-slate-400">
            {!isLeaf && (isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />)}
          </span>
          <Icon size={18} className={`${level === 0 ? 'text-indigo-600' : 'text-slate-500'}`} />
          <span className={`font-medium ${level === 0 ? 'text-base' : 'text-sm'}`}>
            {title}
          </span>
          {subtitle && (
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full ml-2">
              {subtitle}
            </span>
          )}
        </div>

        {userRole === 'ADMIN' && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {level < 3 && (
              <button 
                onClick={(e) => { e.stopPropagation(); onAdd(); }}
                className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md" 
                title="Thêm cấp con"
              >
                <Plus size={16} />
              </button>
            )}
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-1.5 text-amber-600 hover:bg-amber-100 rounded-md"
              title="Sửa"
            >
              <Edit size={16} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1.5 text-red-600 hover:bg-red-100 rounded-md"
              title="Xóa"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>
      {isOpen && children && (
        <div className="flex flex-col border-l-2 border-slate-100 ml-5 mt-1">
          {children}
        </div>
      )}
    </div>
  );
};

export default function StorageExplorer({ treeData, userRole, onRefresh }: { treeData: Kho[], userRole: string, onRefresh: () => void }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<{level: number, editData: any, parentId?: number}>({ level: 0, editData: null });

  const handleAdd = (level: number, parentId?: number) => {
    setModalConfig({ level, editData: null, parentId });
    setIsModalOpen(true);
  };

  const handleEdit = (level: number, data: any) => {
    setModalConfig({ level, editData: data });
    setIsModalOpen(true);
  };

  const handleDelete = async (level: number, id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa mục này?')) return;
    
    const endpoints = ['kho', 'ke', 'tang', 'hopso'];
    try {
      const res = await fetch(`http://localhost:8000/api/storage/${endpoints[level]}/${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': '1' // Giả lập Admin dummy (id=1)
        }
      });
      if (res.ok) {
        onRefresh();
      } else {
        const err = await res.json();
        alert(err.detail || 'Không thể xóa');
      }
    } catch (error) {
      console.error(error);
      alert('Lỗi kết nối Server');
    }
  };

  const handleModalSubmit = async (formData: any) => {
    const { level, editData, parentId } = modalConfig;
    const endpoints = ['kho', 'ke', 'tang', 'hopso'];
    const method = editData ? 'PUT' : 'POST';
    const url = `http://localhost:8000/api/storage/${endpoints[level]}${editData ? `/${editData.id}` : ''}`;
    
    let payload: any = { ...formData };
    // Thêm parent_id tương ứng
    if (!editData) {
      if (level === 1) payload.kholuutruid = parentId;
      if (level === 2) payload.keluutruid = parentId;
      if (level === 3) payload.tangluutruid = parentId;
    }

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': '1' // Giả lập Admin dummy (id=1)
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Lỗi server');
      }
      onRefresh();
    } catch (error: any) {
      console.error(error);
      alert(error.message);
      throw error;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden max-w-4xl mx-auto">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="text-indigo-600" /> Sơ Đồ Lưu Trữ Vật Lý
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý sơ đồ vị trí các hồ sơ giấy
          </p>
        </div>
        
        {userRole === 'ADMIN' && (
          <button 
            onClick={() => handleAdd(0)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow flex items-center gap-2"
          >
            <Plus size={18} /> Thêm Kho Mới
          </button>
        )}
      </div>

      <div className="py-2 min-h-[300px]">
        {treeData.length === 0 && <div className="p-6 text-center text-slate-500">Chưa có dữ liệu kho.</div>}
        {treeData.map((kho) => (
          <TreeNode 
            key={kho.id} level={0} userRole={userRole}
            title={kho.tenkho} subtitle={kho.makho} icon={Building2}
            onAdd={() => handleAdd(1, kho.id)}
            onEdit={() => handleEdit(0, kho)}
            onDelete={() => handleDelete(0, kho.id)}
          >
            {kho.kes?.map((ke) => (
              <TreeNode 
                key={ke.id} level={1} userRole={userRole}
                title={ke.tenke} icon={Server}
                onAdd={() => handleAdd(2, ke.id)}
                onEdit={() => handleEdit(1, ke)}
                onDelete={() => handleDelete(1, ke.id)}
              >
                {ke.tangs?.map((tang) => (
                  <TreeNode 
                    key={tang.id} level={2} userRole={userRole}
                    title={tang.tentang} icon={Layers}
                    onAdd={() => handleAdd(3, tang.id)}
                    onEdit={() => handleEdit(2, tang)}
                    onDelete={() => handleDelete(2, tang.id)}
                  >
                    {tang.hop_sos?.map((hop) => (
                      <TreeNode 
                        key={hop.id} level={3} userRole={userRole}
                        title={hop.tenhopso} icon={Archive}
                        onEdit={() => handleEdit(3, hop)}
                        onDelete={() => handleDelete(3, hop.id)}
                      />
                    ))}
                  </TreeNode>
                ))}
              </TreeNode>
            ))}
          </TreeNode>
        ))}
      </div>

      <StorageModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        level={modalConfig.level}
        editData={modalConfig.editData}
        onSubmitSuccess={handleModalSubmit}
      />
    </div>
  );
}
