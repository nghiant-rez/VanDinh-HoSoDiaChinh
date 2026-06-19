'use client';

import { useState } from 'react';
import { Upload, Download, Loader2, CheckCircle2, AlertCircle, Database, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImportResult {
  total_txt_files: number;
  total_dgn_files: number;
  total_parcels: number;
  parcels_with_polygon: number;
  errors: { file: string; error: string }[];
  bbox: { min_lon: number; max_lon: number; min_lat: number; max_lat: number };
  center: { lon: number; lat: number };
}

interface MapToolsPanelProps {
  onImportComplete?: (data: GeoJSON.FeatureCollection) => void;
  parcelCount: number;
}

export function MapToolsPanel({ onImportComplete, parcelCount }: MapToolsPanelProps) {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleImport = async (limitFiles: number = 0) => {
    setImporting(true);
    setError(null);
    setImportResult(null);

    try {
      // Step 1: Trigger import on backend
      const importUrl = limitFiles > 0
        ? `/api/maps/import?limit_files=${limitFiles}`
        : '/api/maps/import';
      const importResp = await fetch(importUrl, { method: 'POST' });
      if (!importResp.ok) {
        const err = await importResp.json();
        throw new Error(err.error || 'Import failed');
      }
      const result: ImportResult = await importResp.json();
      setImportResult(result);

      // Step 2: Fetch GeoJSON parcels
      const parcelsResp = await fetch('/api/parcels?limit=50000');
      if (!parcelsResp.ok) {
        throw new Error(`Failed to fetch parcels: ${parcelsResp.status}`);
      }
      
      const contentType = parcelsResp.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Parcels API returned non-JSON response (auth failed?)');
      }
      
      const geojson = await parcelsResp.json();
      if (!geojson.type || geojson.type !== 'FeatureCollection') {
        throw new Error('Invalid GeoJSON response from parcels API');
      }

      onImportComplete?.(geojson);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    try {
      const resp = await fetch('/api/maps/export');
      if (!resp.ok) throw new Error('Export failed');
      const data = await resp.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'vandinh_parcels.geojson';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    }
  };

  return (
    <div className="absolute top-4 left-4 z-10 flex items-start">
      {/* Collapsible panel */}
      <div
        className={`bg-bg-card rounded-xl shadow-lg border border-border overflow-hidden transition-all duration-300 ${
          isOpen ? 'w-72' : 'w-0'
        }`}
      >
        {isOpen && (
          <>
            {/* Tab bar */}
            <div className="flex border-b border-border">
              <button
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'import'
                    ? 'text-primary border-b-2 border-primary bg-bg-main'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-main'
                }`}
                onClick={() => setActiveTab('import')}
              >
                Nhap du lieu
              </button>
              <button
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'export'
                    ? 'text-primary border-b-2 border-primary bg-bg-main'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-main'
                }`}
                onClick={() => setActiveTab('export')}
              >
                Xuat du lieu
              </button>
            </div>

            {/* Import tab */}
            {activeTab === 'import' && (
              <div className="p-4 space-y-4">
                <div className="text-sm text-text-secondary">
                  <Database className="w-4 h-4 inline mr-1.5" />
                  Nhap du lieu thua dat tu{' '}
                  <span className="font-mono text-xs bg-bg-main px-1.5 py-0.5 rounded">
                    E:\Ban Do
                  </span>
                </div>

                <div className="text-xs text-text-secondary bg-bg-main rounded-lg p-3 space-y-1">
                  <div>80 file dc*.txt (ban do dia chinh)</div>
                  <div>He toa do VN-2000 TM-3 CM=105.00</div>
                  <div>Chuyen doi sang WGS84 tu dong</div>
                </div>

                <button
                  onClick={() => handleImport(0)}
                  disabled={importing}
                  className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Dang nhap du lieu...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Nhap tat ca thua dat (80 file)
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleImport(5)}
                  disabled={importing}
                  className="w-full py-2 bg-bg-main text-text-primary rounded-lg text-xs font-medium hover:bg-border disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {importing ? '' : 'Thu nghiem: nhap 5 file dau tien'}
                </button>

                {/* Import result */}
                {importResult && (
                  <div className="bg-success/5 border border-success/20 rounded-lg p-3 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-success text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Nhap thanh cong!
                    </div>
                    <div className="text-xs text-text-secondary space-y-0.5">
                      <div>{importResult.total_parcels.toLocaleString()} thua dat</div>
                      <div>{importResult.total_txt_files} file txt + {importResult.total_dgn_files} file dgn da xu ly</div>
                      {importResult.parcels_with_polygon > 0 && (
                        <div>{importResult.parcels_with_polygon.toLocaleString()} thua dat co hinh da</div>
                      )}
                      {importResult.errors.length > 0 && (
                        <div className="text-warning">
                          {importResult.errors.length} loi
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="bg-danger/5 border border-danger/20 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 text-danger text-sm">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  </div>
                )}

                {/* Current count */}
                {parcelCount > 0 && !importResult && (
                  <div className="text-xs text-text-secondary text-center">
                    Hien thi {parcelCount.toLocaleString()} thua dat tren ban do
                  </div>
                )}
              </div>
            )}

            {/* Export tab */}
            {activeTab === 'export' && (
              <div className="p-4 space-y-4">
                <div className="text-sm text-text-secondary">
                  Xuat du lieu thua dat ra file GeoJSON
                </div>
                <button
                  onClick={handleExport}
                  disabled={parcelCount === 0}
                  className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Tai xuong GeoJSON
                </button>
                {parcelCount === 0 && (
                  <div className="text-xs text-text-secondary text-center">
                    Chua co du lieu. Nhap du lieu truoc.
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="ml-2 bg-bg-card rounded-lg shadow-lg border border-border p-2 hover:bg-bg-main transition-colors"
        title={isOpen ? 'Ẩn bảng điều khiển' : 'Hiện bảng điều khiển'}
      >
        {isOpen ? (
          <ChevronLeft className="w-5 h-5 text-text-primary" />
        ) : (
          <ChevronRight className="w-5 h-5 text-text-primary" />
        )}
      </button>
    </div>
  );
}
