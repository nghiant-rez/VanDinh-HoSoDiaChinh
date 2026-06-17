'use client';

import React, { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { X } from 'lucide-react';

type FormValues = {
  makho?: string;
  ten: string;
};

type StorageModalProps = {
  isOpen: boolean;
  onClose: () => void;
  level: number;
  editData?: any | null;
  onSubmitSuccess: (data: FormValues) => void;
};

export default function StorageModal({ isOpen, onClose, level, editData, onSubmitSuccess }: StorageModalProps) {
  const getLevelName = () => {
    switch(level) {
      case 0: return 'Kho Lưu Trữ';
      case 1: return 'Kệ Lưu Trữ';
      case 2: return 'Tầng Lưu Trữ';
      case 3: return 'Hộp Số';
      default: return '';
    }
  };

  const isEdit = !!editData;
  const levelName = getLevelName();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>();

  useEffect(() => {
    if (isOpen) {
      if (isEdit && editData) {
        reset({
          makho: editData.makho || '',
          ten: editData.tenkho || editData.tenke || editData.tentang || editData.tenhopso || ''
        });
      } else {
        reset({ makho: '', ten: '' });
      }
    }
  }, [isOpen, isEdit, editData, reset]);

  const handleFormSubmit: SubmitHandler<FormValues> = async (data) => {
    try {
      await onSubmitSuccess(data);
      onClose();
    } catch (error) {
      console.error(error);
      alert('Đã xảy ra lỗi khi lưu!');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">
            {isEdit ? 'Chỉnh Sửa' : 'Thêm Mới'} {levelName}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">
          
          {level === 0 && (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Mã Kho <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="Ví dụ: KHO_01"
                className={`w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow ${errors.makho ? 'border-red-500' : 'border-slate-300'}`}
                {...register("makho", { 
                  required: "Mã kho là bắt buộc", 
                  maxLength: { value: 50, message: "Mã kho tối đa 50 ký tự" }
                })}
              />
              {errors.makho && <p className="text-red-500 text-xs mt-1">{errors.makho.message}</p>}
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">Tên {levelName} <span className="text-red-500">*</span></label>
            <input
              type="text"
              placeholder={`Nhập tên ${levelName.toLowerCase()}...`}
              className={`w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow ${errors.ten ? 'border-red-500' : 'border-slate-300'}`}
              {...register("ten", { 
                required: `Tên ${levelName.toLowerCase()} không được để trống`,
                minLength: { value: 3, message: "Tên phải có ít nhất 3 ký tự" }
              })}
            />
            {errors.ten && <p className="text-red-500 text-xs mt-1">{errors.ten.message}</p>}
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              Hủy bỏ
            </button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              {isSubmitting ? 'Đang lưu...' : 'Lưu thông tin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
