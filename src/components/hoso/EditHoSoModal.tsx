'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronRight, ChevronLeft, Check, Save, Upload, Trash2, FileText } from 'lucide-react';

interface StorageItem {
  id: number;
  tenkho?: string;
  tenke?: string;
  tentang?: string;
  tenhopso?: string;
  kes?: any[];
  tangs?: any[];
  hop_sos?: any[];
}

interface EditHoSoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  hosoData: any;
}

export default function EditHoSoModal({ isOpen, onClose, onSuccess, hosoData }: EditHoSoModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [storageTree, setStorageTree] = useState<any[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  
  // Form Data
  const [formData, setFormData] = useState({
    mahoso: '',
    tenhoso: '',
    loaihosoid: '',
    chusohuu: '',
    trangthai: 'Hoàn thành',
    tobando: '',
    sothua: '',
    dientich: '',
    kholuutruid: '',
    keluutruid: '',
    tangluutruid: '',
    hopsoluutruid: '',
    mahoso_cha: '',
    ghichu: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchStorageTree();
      setStep(1);
      setFiles([]);
      if (hosoData) {
        setFormData({
          mahoso: hosoData.mahoso || '',
          tenhoso: hosoData.tenhoso || '',
          loaihosoid: hosoData.loaihosoid ? String(hosoData.loaihosoid) : '',
          chusohuu: hosoData.chusohuu || '',
          trangthai: hosoData.trangthai || 'Hoàn thành',
          tobando: hosoData.thua_dat?.tobando || '',
          sothua: hosoData.thua_dat?.sothua || '',
          dientich: hosoData.thua_dat?.dientich ? String(hosoData.thua_dat.dientich) : '',
          kholuutruid: hosoData.kholuutruid ? String(hosoData.kholuutruid) : '',
          keluutruid: hosoData.keluutruid ? String(hosoData.keluutruid) : '',
          tangluutruid: hosoData.tangluutruid ? String(hosoData.tangluutruid) : '',
          hopsoluutruid: hosoData.hopsoluutruid ? String(hosoData.hopsoluutruid) : '',
          mahoso_cha: '', // Cannot easily resolve mahoso_cha, keep it empty or load from backend
          ghichu: hosoData.ghichu || ''
        });
      }
    }
  }, [isOpen, hosoData]);

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
      console.error('Lỗi tải kho/kệ:', err);
    }
  };



  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const bodyParams: any = {
        mahoso: formData.mahoso,
        tenhoso: formData.tenhoso,
        chusohuu: formData.chusohuu,
        trangthai: formData.trangthai,
      };
      
      if (formData.loaihosoid) bodyParams.loaihosoid = Number(formData.loaihosoid);
      if (formData.tobando) bodyParams.tobando = formData.tobando;
      if (formData.sothua) bodyParams.sothua = formData.sothua;
      if (formData.dientich) bodyParams.dientich = Number(formData.dientich);
      if (formData.kholuutruid) bodyParams.kholuutruid = Number(formData.kholuutruid);
      if (formData.keluutruid) bodyParams.keluutruid = Number(formData.keluutruid);
      if (formData.tangluutruid) bodyParams.tangluutruid = Number(formData.tangluutruid);
      if (formData.hopsoluutruid) bodyParams.hopsoluutruid = Number(formData.hopsoluutruid);
      if (formData.mahoso_cha) bodyParams.mahoso_cha = formData.mahoso_cha;
      if (formData.ghichu) bodyParams.ghichu = formData.ghichu;

      const res = await fetch(`http://localhost:8000/api/hoso/${hosoData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': '1'
        },
        body: JSON.stringify(bodyParams)
      });

      if (res.ok) {
        const updatedHoso = await res.json();
        
        if (files.length > 0 && updatedHoso.id) {
          const formDataToUpload = new FormData();
          files.forEach(file => {
            formDataToUpload.append('files', file);
          });
          
          await fetch(`http://localhost:8000/api/hoso/${updatedHoso.id}/attachments`, {
            method: 'POST',
            headers: { 'x-user-id': '1' },
            body: formDataToUpload
          });
        }
        
        onSuccess();
        onClose();
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.detail || 'Có lỗi xảy ra khi lưu hồ sơ');
      }
    } catch (err) {
      console.error(err);
      alert('Không thể kết nối đến máy chủ');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Lọc danh sách kho kệ tầng hộp
  const kes = storageTree.find(k => k.id === Number(formData.kholuutruid))?.kes || [];
  const tangs = kes.find((k: any) => k.id === Number(formData.keluutruid))?.tangs || [];
  const hops = tangs.find((t: any) => t.id === Number(formData.tangluutruid))?.hop_sos || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Cập nhật hồ sơ</h2>
            <p className="text-sm text-slate-500 mt-1">Chỉnh sửa thông tin hồ sơ</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Wizard Steps */}
        <div className="px-8 py-6 bg-white border-b border-slate-100">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 rounded-full -z-10"></div>
            <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 rounded-full -z-10 transition-all duration-500`} style={{ width: `${((step - 1) / 3) * 100}%` }}></div>
            
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className={`flex flex-col items-center w-10 bg-white`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-300 ${step > s ? 'bg-blue-600 text-white' : step === s ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-slate-100 text-slate-400'}`}>
                  {step > s ? <Check className="w-4 h-4" /> : s}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs font-medium text-slate-500">
            <span className={step >= 1 ? 'text-blue-700' : ''}>Thông tin chung</span>
            <span className={step >= 2 ? 'text-blue-700' : ''}>Thửa đất & Dự án</span>
            <span className={step >= 3 ? 'text-blue-700' : ''}>Vị trí lưu trữ</span>
            <span className={step >= 4 ? 'text-blue-700' : ''}>Tài liệu đính kèm</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
          {step === 1 && (
            <div className="space-y-5 animate-in slide-in-from-right-4 fade-in">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mã hồ sơ *</label>
                  <input type="text" name="mahoso" value={formData.mahoso} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="Ví dụ: HS-2023-001" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Loại hồ sơ</label>
                  <select name="loaihosoid" value={formData.loaihosoid} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                    <option value="">-- Chọn loại --</option>
                    <option value="1">Xử lý vi phạm</option>
                    <option value="2">Đơn từ</option>
                    <option value="3">Dự án</option>
                    <option value="4">Cấp đất</option>
                    <option value="5">Giao đất / Thuê đất</option>
                    <option value="6">Khác</option>
                    <option value="7">Tài nguyên môi trường</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên hồ sơ *</label>
                <input type="text" name="tenhoso" value={formData.tenhoso} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="Nhập tên hồ sơ..." />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Chủ sở hữu</label>
                  <input type="text" name="chusohuu" value={formData.chusohuu} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="Ông A, Bà B..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
                  <select name="trangthai" value={formData.trangthai} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                    <option value="Hoàn thành">Hoàn thành</option>
                    <option value="Đang xử lý">Đang xử lý</option>
                    <option value="Lưu trữ">Lưu trữ</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mã Hồ sơ gốc (Nguồn gốc - nếu có)</label>
                <input type="text" name="mahoso_cha" value={formData.mahoso_cha} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="Nhập mã hồ sơ cha (Ví dụ: HS-2023-001)..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả / Ghi chú (Toàn văn tài liệu)</label>
                <textarea name="ghichu" value={formData.ghichu} onChange={(e: any) => handleInputChange(e)} rows={4} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all custom-scrollbar" placeholder="Nhập mô tả hoặc ghi chú..."></textarea>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-in slide-in-from-right-4 fade-in">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tờ bản đồ</label>
                  <input type="text" name="tobando" value={formData.tobando} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="Số tờ..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Số thửa</label>
                  <input type="text" name="sothua" value={formData.sothua} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="Số thửa..." />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Diện tích (m2)</label>
                <input type="number" step="any" name="dientich" value={formData.dientich} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="Nhập diện tích..." />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 animate-in slide-in-from-right-4 fade-in">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kho lưu trữ</label>
                  <select name="kholuutruid" value={formData.kholuutruid} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                    <option value="">-- Chọn Kho --</option>
                    {storageTree.map((k: any) => (
                      <option key={k.id} value={k.id}>{k.tenkho}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kệ lưu trữ</label>
                  <select name="keluutruid" value={formData.keluutruid} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white" disabled={!formData.kholuutruid}>
                    <option value="">-- Chọn Kệ --</option>
                    {kes.map((k: any) => (
                      <option key={k.id} value={k.id}>{k.tenke}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tầng lưu trữ</label>
                  <select name="tangluutruid" value={formData.tangluutruid} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white" disabled={!formData.keluutruid}>
                    <option value="">-- Chọn Tầng --</option>
                    {tangs.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.tentang}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Hộp số lưu trữ</label>
                  <select name="hopsoluutruid" value={formData.hopsoluutruid} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white" disabled={!formData.tangluutruid}>
                    <option value="">-- Chọn Hộp --</option>
                    {hops.map((h: any) => (
                      <option key={h.id} value={h.id}>{h.tenhopso}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5 animate-in slide-in-from-right-4 fade-in">
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => document.getElementById('file-upload')?.click()}>
                <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-700">Nhấn hoặc kéo thả file vào đây để tải lên</p>
                <p className="text-xs text-slate-500 mt-1">Hỗ trợ PDF, PNG, JPG, JPEG, DOCX...</p>
                <input 
                  id="file-upload" 
                  type="file" 
                  multiple 
                  className="hidden" 
                  onChange={(e) => {
                    if (e.target.files) {
                      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                    }
                  }} 
                />
              </div>

              {files.length > 0 && (
                <div className="space-y-3 mt-4">
                  <h4 className="text-sm font-medium text-slate-700">Tệp đã chọn ({files.length})</h4>
                  <div className="max-h-48 overflow-y-auto space-y-2 custom-scrollbar">
                    {files.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                        <div className="flex items-center space-x-3 overflow-hidden">
                          <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                          <div className="truncate">
                            <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                            <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-between items-center">
          <button 
            onClick={() => setStep(step - 1)} 
            disabled={step === 1}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:hover:bg-white flex items-center transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Quay lại
          </button>
          
          {step < 4 ? (
            <button 
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && (!formData.mahoso || !formData.tenhoso)}
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center shadow-sm transition-all"
            >
              Tiếp tục <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 disabled:opacity-70 flex items-center shadow-md transition-all"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Hoàn tất & Lưu
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
