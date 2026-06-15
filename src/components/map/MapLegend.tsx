export function MapLegend() {
  return (
    <div className="absolute bottom-4 right-12 bg-bg-card rounded-lg shadow-md border border-border p-4 z-10">
      <h4 className="text-sm font-semibold text-text-primary mb-3">Chú giải</h4>
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <div className="w-4 h-4 rounded-sm border border-primary bg-primary/20"></div>
          <span>Thửa đất có hồ sơ</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <div className="w-4 h-4 rounded-sm border border-border bg-black/5"></div>
          <span>Thửa đất trống</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <div className="w-4 h-4 rounded-sm border border-warning bg-warning/20"></div>
          <span>Đang có tranh chấp/biến động</span>
        </div>
      </div>
    </div>
  );
}
