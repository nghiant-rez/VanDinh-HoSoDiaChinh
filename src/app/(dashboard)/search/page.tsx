'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, ChevronDown, ChevronRight, Eye, RefreshCw, Folder, Plus, Loader2, Download, Upload, Edit, Trash2 } from 'lucide-react';
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

  const handleSearch = async () => {
    try {
      setLoading(true);
      const bodyParams: any = {
        query: searchTerm || undefined,
        limit: 50,
        offset: 0
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
        setResults(data);
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

  return (
    <div className="flex h-full bg-slate-50 overflow-hidden">
      {/* Sidebar Bộ Lọc Bên Trái */}
      <div className="w-80 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col h-full overflow-y-auto p-5 custom-scrollbar">
        {/* Tìm kiếm OCR */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm hồ sơ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-800"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
              <button 
                onClick={handleSearch}
                className="text-slate-400 hover:text-blue-500"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tree Loại hồ sơ */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
            <Folder className="w-4 h-4 mr-2 text-slate-500" />
            Loại hồ sơ
          </h3>
          <div className="space-y-3">
            {CATEGORY_TREE.map(cat => (
              <div key={cat.id} className="space-y-1">
                <button
                  onClick={() => toggleCategoryExpand(cat.id)}
                  className="flex items-center w-full text-left text-sm font-medium text-slate-700 hover:text-blue-600 py-1 transition-colors"
                >
                  {expandedCategories[cat.id] ? (
                    <ChevronDown className="w-4 h-4 mr-1 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 mr-1 text-slate-400" />
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
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
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
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Tờ bản đồ / Số thửa</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input
                type="text"
                placeholder="Số tờ..."
                value={toBanDo}
                onChange={(e) => setToBanDo(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Số thửa..."
                value={soThua}
                onChange={(e) => setSoThua(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Chủ sở hữu */}
        <div className="mb-6 border-t border-slate-100 pt-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Chủ sở hữu</h3>
          <div>
            <input
              type="text"
              placeholder="Nhập tên chủ sở hữu..."
              value={chuSoHuu}
              onChange={(e) => setChuSoHuu(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
            />
          </div>
        </div>

        {/* Vị trí vật lý */}
        <div className="mb-6 border-t border-slate-100 pt-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Vị trí lưu trữ vật lý</h3>
          <div className="space-y-3">
            <select
              value={selectedKho}
              onChange={(e) => {
                setSelectedKho(e.target.value);
                setSelectedKe('');
              }}
              className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
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
              className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 disabled:bg-slate-50 disabled:text-slate-400"
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
          onClick={handleSearch}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm hover:shadow-md transition-all active:scale-[0.98] mt-auto"
        >
          Áp dụng bộ lọc
        </button>
      </div>

      {/* Danh Sách Kết Quả Bên Phải */}
      <div className="flex-1 flex flex-col h-full overflow-hidden p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-slate-600 text-sm font-medium">
            Tìm thấy <span className="text-blue-600 font-bold">{results.length}</span> hồ sơ
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="px-4 py-2 bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-200 flex items-center transition-all active:scale-[0.98]"
            >
              <Download className="w-4 h-4 mr-1" />
              Tải mẫu
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-emerald-700 hover:shadow flex items-center transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {importing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
              {importing ? 'Đang import...' : 'Import Excel'}
            </button>
            <input type="file" hidden ref={fileInputRef} accept=".xlsx, .xls" onChange={handleImportExcel} />
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-blue-700 hover:shadow flex items-center transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 mr-1" />
              Thêm mới
            </button>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
          <div className="overflow-x-auto flex-1 custom-scrollbar">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Mã hồ sơ</th>
                  <th className="px-6 py-4 font-semibold">Tên hồ sơ</th>
                  <th className="px-6 py-4 font-semibold">Chủ sở hữu</th>
                  <th className="px-6 py-4 font-semibold">Đất liên quan</th>
                  <th className="px-6 py-4 font-semibold">Vị trí lưu trữ</th>
                  <th className="px-6 py-4 font-semibold text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-500" />
                      Đang tải kết quả tìm kiếm...
                    </td>
                  </tr>
                ) : results.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
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
                      <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                        {/* Mã hồ sơ */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => router.push(`/hoso/${row.id}`)}
                            className="text-blue-600 hover:text-blue-800 font-semibold text-sm outline-none text-left"
                          >
                            {row.mahoso}
                          </button>
                          <div className="text-slate-400 text-xs mt-0.5">05/06/2026</div>
                        </td>

                        {/* Tên hồ sơ */}
                        <td className="px-6 py-4 max-w-xs">
                          <div className="font-semibold text-slate-800 line-clamp-2">{row.tenhoso}</div>
                          <div className="text-slate-400 text-xs mt-0.5">{loaiHosoText}</div>
                        </td>

                        {/* Chủ sở hữu */}
                        <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                          {row.chusohuu || 'Không xác định'}
                        </td>

                        {/* Đất liên quan */}
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                          {row.thua_dat ? (
                            <span>Tờ {row.thua_dat.tobando}, Thửa {row.thua_dat.sothua}</span>
                          ) : (
                            <span className="text-slate-400 text-xs">Chưa liên kết thửa</span>
                          )}
                        </td>

                        {/* Vị trí vật lý */}
                        <td className="px-6 py-4 text-xs text-slate-600">
                          {row.kho_luu_tru ? (
                            <div className="space-y-0.5">
                              <div>{row.kho_luu_tru?.tenkho}</div>
                              {row.ke_luu_tru && <div className="text-slate-400">- {row.ke_luu_tru?.tenke}</div>}
                              {row.tang_luu_tru && <div className="text-slate-400">- {row.tang_luu_tru?.tentang}</div>}
                              {row.hop_so && <div className="text-slate-400">- Hộp {row.hop_so?.tenhopso}</div>}
                            </div>
                          ) : (
                            <span className="text-slate-400">Chưa xếp vị trí</span>
                          )}
                        </td>



                        {/* Thao tác */}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => router.push(`/hoso/${row.id}`)}
                              title="Xem chi tiết"
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setHosoToEdit(row);
                                setIsEditModalOpen(true);
                              }}
                              title="Sửa hồ sơ"
                              className="text-amber-500 hover:text-amber-700 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(row.id)}
                              title="Xóa hồ sơ"
                              className="text-red-500 hover:text-red-700 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
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
