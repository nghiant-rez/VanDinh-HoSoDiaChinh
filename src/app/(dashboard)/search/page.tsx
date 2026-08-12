'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, ChevronDown, ChevronRight, ChevronLeft, Eye, RefreshCw, Folder, Plus, Loader2, Download, Upload, Edit, Trash2, MoreVertical, FileSpreadsheet } from 'lucide-react';
import CreateHoSoModal from '@/components/hoso/CreateHoSoModal';
import EditHoSoModal from '@/components/hoso/EditHoSoModal';

interface StorageItem {
  id: number;
  tenkho?: string;
  tenke?: string;
  kes?: StorageItem[];
}

const CATEGORY_TREE = [
  {
    id: 'dia-chinh',
    name: 'Hồ sơ địa chính',
    children: [
      { id: 1, name: 'Xử lý vi phạm' },
      { id: 2, name: 'Đơn từ' },
      { id: 3, name: 'Dự án' },
      { id: 4, name: 'Cấp đất' },
      { id: 5, name: 'Giao đất/Thuê đất' },
      { id: 6, name: 'Khác' },
    ]
  },
  {
    id: 'tai-nguyen-moi-truong',
    name: 'Tài nguyên môi trường',
    children: [
      { id: 7, name: 'Tài nguyên môi trường' }
    ]
  }
];

export default function SearchPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [toBanDo, setToBanDo] = useState('');
  const [soThua, setSoThua] = useState('');
  const [chuSoHuu, setChuSoHuu] = useState('');
  const [nam, setNam] = useState('');
  const [selectedKho, setSelectedKho] = useState<string>('');
  const [selectedKe, setSelectedKe] = useState<string>('');
  
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [storageTree, setStorageTree] = useState<StorageItem[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'dia-chinh': true // Mặc định mở rộng hồ sơ địa chính
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [hosoToEdit, setHosoToEdit] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedHosoIds, setSelectedHosoIds] = useState<number[]>([]);
  const [exportingSync, setExportingSync] = useState(false);
  const [importingSync, setImportingSync] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const [pageInput, setPageInput] = useState('');
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const pageSize = 50;

  // Fetch danh sách kho/kệ cho dropdown bộ lọc
  useEffect(() => {
    const fetchStorageTree = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/storage/tree', {
          headers: { 'x-user-id': '1' }
        });
        if (res.ok) {
          const data = await res.json();
          setStorageTree(data);
        }
      } catch (err) {
        console.error('Không thể tải danh sách kho/kệ:', err);
      }
    };
    fetchStorageTree();
  }, []);

  const handleSearch = async (page: number = 1) => {
    try {
      setLoading(true);
      const bodyParams: any = {
        query: searchTerm || undefined,
        limit: pageSize,
        offset: (page - 1) * pageSize
      };

      if (selectedCategories.length > 0) {
        bodyParams.loaihosoids = selectedCategories;
      }
      if (toBanDo.trim()) {
        bodyParams.tobando = toBanDo.trim();
      }
      if (soThua.trim()) {
        bodyParams.sothua = soThua.trim();
      }
      if (chuSoHuu.trim()) {
        bodyParams.chusohuu = chuSoHuu.trim();
      }
      if (nam.trim()) {
        bodyParams.nam = Number(nam.trim());
      }
      if (selectedKho) {
        bodyParams.kholuutruid = Number(selectedKho);
      }
      if (selectedKe) {
        bodyParams.keluutruid = Number(selectedKe);
      }

      const res = await fetch('http://localhost:8000/api/hoso/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': '1'
        },
        body: JSON.stringify(bodyParams)
      });

      if (res.ok) {
        const data = await res.json();
        // Fallback for older backend which might return array directly
        if (Array.isArray(data)) {
            setResults(data);
            setTotalCount(data.length);
        } else {
            setResults(data.items || []);
            setTotalCount(data.total || 0);
        }
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Lỗi khi tra cứu hồ sơ:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleDownloadTemplate = () => {
    window.open('http://localhost:8000/api/hoso/import-template', '_blank');
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/api/hoso/import", {
          method: "POST",
          headers: { 'x-user-id': '1' },
          body: formData,
      });
      const result = await res.json();
      
      if (res.ok && result.success) {
          let msg = `Import thành công ${result.success_count} hồ sơ.\n`;
          if (result.errors && result.errors.length > 0) {
            msg += `\nLỗi:\n${result.errors.join('\n')}`;
          }
          alert(msg);
          handleSearch();
      } else {
          alert("Lỗi khi import: " + (result.detail || result.error || "Không xác định"));
      }
    } catch (error) {
      console.error("Import Error:", error);
      alert("Không thể kết nối đến API Import.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa hồ sơ này? Tất cả file đính kèm cũng sẽ bị xóa.')) return;
    try {
      const res = await fetch(`http://localhost:8000/api/hoso/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': '1' }
      });
      if (res.ok) {
        alert('Xóa hồ sơ thành công');
        handleSearch();
      } else {
        const err = await res.json().catch(()=>({}));
        alert(err.detail || 'Lỗi khi xóa hồ sơ');
      }
    } catch (error) {
      console.error('Lỗi khi xóa:', error);
      alert('Không thể kết nối máy chủ');
    }
  };

  const handleExportSync = async () => {
    try {
      setExportingSync(true);
      const res = await fetch('http://localhost:8000/api/sync/export-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': '1' },
        body: JSON.stringify({ hoso_ids: selectedHosoIds })
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sync_data_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Lỗi khi xuất dữ liệu đồng bộ');
      }
    } catch (err) {
      console.error(err);
      alert('Không thể kết nối đến máy chủ');
    } finally {
      setExportingSync(false);
    }
  };

  const handleImportSync = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportingSync(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/api/sync/import-json", {
          method: "POST",
          headers: { 'x-user-id': '1' },
          body: formData,
      });
      const result = await res.json();
      
      if (res.ok && result.success) {
          let msg = `Đồng bộ thành công ${result.success_count} hồ sơ.\n`;
          if (result.errors && result.errors.length > 0) {
            msg += `\nLỗi:\n${result.errors.join('\n')}`;
          }
          alert(msg);
          handleSearch();
      } else {
          alert("Lỗi khi đồng bộ: " + (result.detail || result.error || "Không xác định"));
      }
    } catch (error) {
      console.error("Sync Import Error:", error);
      alert("Không thể kết nối đến API Import Sync.");
    } finally {
      setImportingSync(false);
      if (jsonInputRef.current) jsonInputRef.current.value = '';
    }
  };

  // Tự động tìm kiếm lần đầu
  useEffect(() => {
    handleSearch();
  }, []);

  const toggleCategoryExpand = (catId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const handleCategoryCheckboxChange = (id: number) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Lấy danh sách kệ tương ứng với kho đã chọn
  const currentKeList = storageTree.find(k => k.id === Number(selectedKho))?.kes || [];

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const handleJumpPage = () => {
    const p = parseInt(pageInput, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      handleSearch(p);
      setPageInput('');
    }
  };

  return (
    <div className="flex h-full bg-transparent overflow-hidden">
      {/* Sidebar Bộ Lọc Bên Trái */}
      <div className={`flex-shrink-0 bg-white/95 backdrop-blur-md border-r border-slate-200/80 flex flex-col h-full overflow-y-auto custom-scrollbar transition-all duration-300 ${isSidebarOpen ? 'w-80 p-5' : 'w-0 p-0 border-none overflow-hidden opacity-0'}`}>
        {/* Tìm kiếm OCR */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm hồ sơ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(1)}
              className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-800 bg-white shadow-sm"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
              <button 
                onClick={() => handleSearch(1)}
                className="text-slate-400 hover:text-indigo-600"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tree Loại hồ sơ */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center tracking-tight">
            <Folder className="w-4 h-4 mr-2 text-indigo-600" />
            Loại hồ sơ
          </h3>
          <div className="space-y-3">
            {CATEGORY_TREE.map(cat => (
              <div key={cat.id} className="space-y-1">
                <button
                  onClick={() => toggleCategoryExpand(cat.id)}
                  className="flex items-center w-full text-left text-sm font-semibold text-slate-700 hover:text-indigo-700 py-1 transition-colors"
                >
                  {expandedCategories[cat.id] ? (
                    <ChevronDown className="w-4 h-4 mr-1 text-indigo-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 mr-1 text-indigo-500" />
                  )}
                  {cat.name}
                </button>
                
                {expandedCategories[cat.id] && (
                  <div className="pl-6 space-y-2 pt-1">
                    {cat.children.map(sub => (
                      <label key={sub.id} className="flex items-start space-x-2 text-sm text-slate-600 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(sub.id)}
                          onChange={() => handleCategoryCheckboxChange(sub.id)}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>{sub.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Thửa đất */}
        <div className="mb-6 border-t border-slate-100 pt-5">
          <h3 className="text-sm font-bold text-slate-800 mb-3 tracking-tight">Tờ bản đồ / Số thửa</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input
                type="text"
                placeholder="Số tờ..."
                value={toBanDo}
                onChange={(e) => setToBanDo(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 bg-white"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Số thửa..."
                value={soThua}
                onChange={(e) => setSoThua(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Chủ sở hữu */}
        <div className="mb-6 border-t border-slate-100 pt-5">
          <h3 className="text-sm font-bold text-slate-800 mb-3 tracking-tight">Chủ sở hữu</h3>
          <div>
            <input
              type="text"
              placeholder="Nhập tên chủ sở hữu..."
              value={chuSoHuu}
              onChange={(e) => setChuSoHuu(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 bg-white"
            />
          </div>
        </div>

        {/* Năm */}
        <div className="mb-6 border-t border-slate-100 pt-5">
          <h3 className="text-sm font-bold text-slate-800 mb-3 tracking-tight">Năm</h3>
          <div>
            <input
              type="number"
              placeholder="Năm..."
              value={nam}
              onChange={(e) => setNam(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 bg-white"
            />
          </div>
        </div>

        {/* Vị trí vật lý */}
        <div className="mb-6 border-t border-slate-100 pt-5">
          <h3 className="text-sm font-bold text-slate-800 mb-3 tracking-tight">Vị trí lưu trữ vật lý</h3>
          <div className="space-y-3">
            <select
              value={selectedKho}
              onChange={(e) => {
                setSelectedKho(e.target.value);
                setSelectedKe('');
              }}
              className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 bg-white"
            >
              <option value="">Tất cả kho</option>
              {storageTree.map(kho => (
                <option key={kho.id} value={kho.id}>{kho.tenkho}</option>
              ))}
            </select>

            <select
              value={selectedKe}
              disabled={!selectedKho}
              onChange={(e) => setSelectedKe(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 bg-white disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">Tất cả kệ</option>
              {currentKeList.map(ke => (
                <option key={ke.id} value={ke.id}>{ke.tenke}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Button Áp dụng */}
        <button
          onClick={() => handleSearch(1)}
          className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-500/20 transition-all active:scale-[0.98] mt-auto"
        >
          Áp dụng bộ lọc
        </button>
      </div>

      {/* Danh Sách Kết Quả Bên Phải */}
      <div className="flex-1 flex flex-col h-full overflow-hidden p-5">
        <div className="mb-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2 rounded-xl transition-all shadow-sm border ${isSidebarOpen ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50' : 'bg-slate-900 text-white border-slate-800 hover:bg-slate-800'}`}
              title="Ẩn/hiện bộ lọc"
            >
              <Filter className="w-5 h-5" />
            </button>
            <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 px-3.5 py-1.5 rounded-xl text-slate-700 text-sm font-medium shadow-sm flex items-center gap-1.5">
              <span>Tìm thấy</span>
              <span className="text-indigo-600 font-extrabold text-base">{totalCount}</span>
              <span>hồ sơ</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Icon Nổi Thao tác (Tải mẫu, Import Excel, Xuất/Nhập JSON) */}
            <div className="relative inline-block text-left">
              <button
                onClick={() => setIsActionsMenuOpen(!isActionsMenuOpen)}
                className="w-10 h-10 bg-white border border-slate-200/90 hover:bg-emerald-50 text-slate-700 rounded-full shadow-md shadow-slate-200/50 hover:shadow-lg transition-all active:scale-95 flex items-center justify-center relative"
                title="Thao tác dữ liệu (Tải mẫu, Import Excel, Xuất/Nhập JSON)"
              >
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              </button>

              {isActionsMenuOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setIsActionsMenuOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-30 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-1.5 text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                      Thao tác Excel
                    </div>

                    <button
                      onClick={() => { setIsActionsMenuOpen(false); handleDownloadTemplate(); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-indigo-50/60 flex items-center gap-3 transition-colors"
                    >
                      <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                        <Download className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">Tải mẫu Excel</div>
                        <div className="text-xs text-slate-400">Tải file mẫu nhập hồ sơ</div>
                      </div>
                    </button>

                    <button
                      onClick={() => { setIsActionsMenuOpen(false); fileInputRef.current?.click(); }}
                      disabled={importing}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-indigo-50/60 flex items-center gap-3 transition-colors disabled:opacity-50"
                    >
                      <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                        {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">{importing ? 'Đang import...' : 'Import Excel'}</div>
                        <div className="text-xs text-slate-400">Nhập danh sách từ file Excel</div>
                      </div>
                    </button>

                    <div className="my-1.5 border-t border-slate-100"></div>

                    <div className="px-4 py-1.5 text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                      Đồng bộ dữ liệu (JSON)
                    </div>

                    <button
                      onClick={() => { setIsActionsMenuOpen(false); handleExportSync(); }}
                      disabled={exportingSync}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-indigo-50/60 flex items-center gap-3 transition-colors disabled:opacity-50"
                    >
                      <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                        {exportingSync ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">Xuất JSON (Đồng bộ)</div>
                        <div className="text-xs text-slate-400">Tải file đồng bộ hệ thống</div>
                      </div>
                    </button>

                    <button
                      onClick={() => { setIsActionsMenuOpen(false); jsonInputRef.current?.click(); }}
                      disabled={importingSync}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-indigo-50/60 flex items-center gap-3 transition-colors disabled:opacity-50"
                    >
                      <div className="p-2 rounded-lg bg-sky-50 text-sky-600">
                        {importingSync ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">Nhập JSON (Đồng bộ)</div>
                        <div className="text-xs text-slate-400">Đồng bộ từ file JSON</div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>

            <input type="file" hidden ref={fileInputRef} accept=".xlsx, .xls" onChange={handleImportExcel} />
            <input type="file" hidden ref={jsonInputRef} accept=".json" onChange={handleImportSync} />

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-500/20 flex items-center transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 mr-1" />
              Thêm mới
            </button>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-200/40 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-x-hidden overflow-y-auto custom-scrollbar">
            <table className="w-full text-xs text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-slate-900 text-slate-100 text-[11px] font-bold uppercase tracking-wider">
                  <th className="px-2 py-3 font-bold w-9 text-center">
                    <input 
                      type="checkbox" 
                      className="h-3.5 w-3.5 rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                      checked={results.length > 0 && selectedHosoIds.length === results.length}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedHosoIds(results.map(r => r.id));
                        else setSelectedHosoIds([]);
                      }}
                    />
                  </th>
                  <th className="px-3 py-3 font-bold w-[14%]">Mã hồ sơ</th>
                  <th className="px-3 py-3 font-bold w-[27%]">Tên hồ sơ</th>
                  <th className="px-2 py-3 font-bold w-[7%] text-center">Năm</th>
                  <th className="px-3 py-3 font-bold w-[17%]">Chủ sở hữu</th>
                  <th className="px-3 py-3 font-bold w-[16%]">Đất liên quan</th>
                  <th className="px-3 py-3 font-bold w-[14%]">Vị trí lưu trữ</th>
                  <th className="px-2 py-3 font-bold w-12 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-600" />
                      Đang tải kết quả tìm kiếm...
                    </td>
                  </tr>
                ) : results.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                      Không tìm thấy hồ sơ nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  results.map((row) => {
                    // Xác định nhãn loại hồ sơ
                    let loaiHosoText = 'Hồ sơ khác';
                    for (const cat of CATEGORY_TREE) {
                      const child = cat.children.find(c => c.id === row.loaihosoid);
                      if (child) {
                        loaiHosoText = child.name;
                        break;
                      }
                    }

                    return (
                      <tr key={row.id} className="odd:bg-white even:bg-slate-50/50 hover:bg-indigo-50/40 transition-colors border-b border-slate-100/70 last:border-0">
                        <td className="px-2 py-2.5 text-center">
                          <input 
                            type="checkbox" 
                            className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            checked={selectedHosoIds.includes(row.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedHosoIds([...selectedHosoIds, row.id]);
                              else setSelectedHosoIds(selectedHosoIds.filter(id => id !== row.id));
                            }}
                          />
                        </td>
                        {/* Mã hồ sơ */}
                        <td className="px-3 py-2.5 break-words">
                          <button
                            onClick={() => router.push(`/hoso/${row.id}`)}
                            className="text-indigo-600 hover:text-indigo-800 font-bold text-xs outline-none text-left break-all hover:underline"
                          >
                            {row.mahoso}
                          </button>
                          <div className="text-slate-400 text-[11px] mt-0.5">05/06/2026</div>
                        </td>

                        {/* Tên hồ sơ */}
                        <td className="px-3 py-2.5">
                          <div className="font-semibold text-slate-800 text-xs line-clamp-2 leading-snug">{row.tenhoso}</div>
                          <div className="text-slate-400 text-[11px] mt-0.5 truncate">{loaiHosoText}</div>
                        </td>

                        {/* Năm */}
                        <td className="px-2 py-2.5 text-center text-xs text-slate-700">
                          {row.nam || 'N/A'}
                        </td>

                        {/* Chủ sở hữu */}
                        <td className="px-3 py-2.5 text-xs text-slate-700 break-words">
                          {row.chusohuu || 'Không xác định'}
                        </td>

                        {/* Đất liên quan */}
                        <td className="px-3 py-2.5 text-xs text-slate-600 break-words">
                          {row.thua_dat ? (
                            <span className="bg-sky-50 text-sky-700 border border-sky-200/70 rounded-md px-2 py-0.5 font-medium text-[11px] inline-block">
                              Tờ {row.thua_dat.tobando}, Thửa {row.thua_dat.sothua}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Chưa liên kết thửa</span>
                          )}
                        </td>

                        {/* Vị trí vật lý */}
                        <td className="px-3 py-2.5 text-[11px] text-slate-600 break-words">
                          {row.kho_luu_tru ? (
                            <div className="space-y-0.5 leading-tight">
                              <div className="font-semibold text-slate-800">{row.kho_luu_tru?.tenkho}</div>
                              {row.ke_luu_tru && <div className="text-slate-500">- {row.ke_luu_tru?.tenke}</div>}
                              {row.tang_luu_tru && <div className="text-slate-400">- {row.tang_luu_tru?.tentang}</div>}
                              {row.hop_so && <div className="text-slate-400">- Hộp {row.hop_so?.tenhopso}</div>}
                            </div>
                          ) : (
                            <span className="text-slate-400">Chưa xếp vị trí</span>
                          )}
                        </td>

                        {/* Thao tác */}
                        <td className="px-2 py-2.5 text-center">
                          <div className="relative inline-block text-left">
                            <button
                              onClick={() => setOpenDropdownId(openDropdownId === row.id ? null : row.id)}
                              className="p-1.5 text-slate-400 hover:text-indigo-700 hover:bg-indigo-50 rounded-full transition-colors"
                              title="Thao tác"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            
                            {openDropdownId === row.id && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setOpenDropdownId(null)}></div>
                                <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-20">
                                  <button
                                    onClick={() => { setOpenDropdownId(null); router.push(`/hoso/${row.id}`); }}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 flex items-center"
                                  >
                                    <Eye className="w-4 h-4 mr-2 text-indigo-500" />
                                    Xem chi tiết
                                  </button>
                                  <button
                                    onClick={() => { setOpenDropdownId(null); setHosoToEdit(row); setIsEditModalOpen(true); }}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 flex items-center"
                                  >
                                    <Edit className="w-4 h-4 mr-2 text-amber-500" />
                                    Chỉnh sửa
                                  </button>
                                  <button
                                    onClick={() => { setOpenDropdownId(null); handleDelete(row.id); }}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2 text-red-500" />
                                    Xóa hồ sơ
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {/* Phân trang */}
          {totalCount > 0 && (
            <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-600">
                Hiển thị từ <span className="font-semibold text-slate-800">{((currentPage - 1) * pageSize) + 1}</span> đến{' '}
                <span className="font-semibold text-slate-800">{Math.min(currentPage * pageSize, totalCount)}</span> trong tổng số{' '}
                <span className="font-semibold text-indigo-600 font-bold">{totalCount}</span> hồ sơ
              </div>

              <div className="flex items-center gap-3">
                {/* Nút các số trang 1, 2, 3... */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleSearch(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="p-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent transition-all"
                    title="Trang trước"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {getPageNumbers().map((p, idx) => (
                    typeof p === 'number' ? (
                      <button
                        key={idx}
                        onClick={() => handleSearch(p)}
                        disabled={loading}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                          currentPage === p
                            ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/20'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-indigo-50/60'
                        }`}
                      >
                        {p}
                      </button>
                    ) : (
                      <span key={idx} className="px-1 text-xs text-slate-400 font-semibold select-none">...</span>
                    )
                  ))}

                  <button
                    onClick={() => handleSearch(currentPage + 1)}
                    disabled={currentPage >= totalPages || loading}
                    className="p-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent transition-all"
                    title="Trang sau"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Tìm / nhảy đến trang */}
                <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
                  <span className="text-xs text-slate-600 font-medium">Đến trang:</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleJumpPage()}
                    placeholder={`${currentPage}`}
                    className="w-12 h-7 px-1.5 text-xs text-center border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800 bg-white"
                  />
                  <button
                    onClick={handleJumpPage}
                    className="px-2.5 py-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all active:scale-95"
                  >
                    Đi
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <CreateHoSoModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSuccess={() => {
          handleSearch();
        }} 
      />
      {isEditModalOpen && (
        <EditHoSoModal 
          isOpen={isEditModalOpen} 
          onClose={() => {
            setIsEditModalOpen(false);
            setHosoToEdit(null);
          }} 
          onSuccess={() => {
            handleSearch();
          }}
          hosoData={hosoToEdit}
        />
      )}
    </div>
  );
}
