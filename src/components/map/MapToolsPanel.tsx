import { Upload, Download } from 'lucide-react';

export function MapToolsPanel() {
  return (
    <div className="absolute top-4 left-4 bg-bg-card rounded-lg shadow-md border border-border overflow-hidden w-64 z-10">
      <div className="flex border-b border-border">
        <button className="flex-1 py-3 text-sm font-medium text-primary border-b-2 border-primary bg-bg-main">
          Nhập dữ liệu
        </button>
        <button className="flex-1 py-3 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-main transition-colors">
          Xuất dữ liệu
        </button>
      </div>
      <div className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Chọn file bản đồ (GeoJSON)</label>
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary cursor-pointer transition-colors">
            <Upload className="w-8 h-8 text-text-secondary mx-auto mb-2" />
            <span className="text-sm text-text-secondary">Kéo thả hoặc click để chọn file</span>
          </div>
        </div>
        <button className="w-full py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark">
          Tải lên bản đồ
        </button>
      </div>
    </div>
  );
}
