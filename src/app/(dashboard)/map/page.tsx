'use client';

import type { FormEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Layers3,
  Loader2,
  Map as MapIcon,
  MapPin,
  MousePointer2,
  Pentagon,
  Search,
  Satellite,
  Trash2,
  X,
} from 'lucide-react';
import {
  MapView,
  type BasemapKind,
  type DrawnFeature,
  type MapFocusRequest,
  type MapInteractionMode,
  type ParcelId,
  type ParcelSelection,
} from '@/components/map/MapView';
import { MapToolsPanel } from '@/components/map/MapToolsPanel';
import { MapLegend } from '@/components/map/MapLegend';
import {
  findParcelFeature,
  getParcelFeatureId,
  isParcelFeatureCollection,
} from '@/lib/map-parcels';

type LoadState = 'loading' | 'ready' | 'empty' | 'error';

export default function MapPage() {
  const [geojsonData, setGeojsonData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [message, setMessage] = useState('Đang tải dữ liệu thửa đất...');
  const [sheetQuery, setSheetQuery] = useState('');
  const [parcelQuery, setParcelQuery] = useState('');
  const [selectedParcel, setSelectedParcel] = useState<ParcelSelection | null>(null);
  const [focusRequest, setFocusRequest] = useState<MapFocusRequest | null>(null);
  const [parcelsVisible, setParcelsVisible] = useState(true);
  const [labelsVisible, setLabelsVisible] = useState(true);
  const [parcelOpacity, setParcelOpacity] = useState(0.4);
  const [basemap, setBasemap] = useState<BasemapKind>('street');
  const [interactionMode, setInteractionMode] = useState<MapInteractionMode>('select');
  const [drawnFeature, setDrawnFeature] = useState<DrawnFeature | null>(null);
  const [drawResetKey, setDrawResetKey] = useState(0);
  const focusSequence = useRef(0);

  const satelliteTileTemplate =
    process.env.NEXT_PUBLIC_SATELLITE_TILE_TEMPLATE?.trim() ?? '';
  const satelliteAttribution =
    process.env.NEXT_PUBLIC_SATELLITE_ATTRIBUTION?.trim() ?? 'Ảnh vệ tinh';
  const satelliteConfigured = satelliteTileTemplate.length > 0;
  const parcelCount = geojsonData?.features.length ?? 0;

  useEffect(() => {
    const controller = new AbortController();

    const loadParcels = async () => {
      try {
        const response = await fetch('/api/parcels?limit=50000', {
          signal: controller.signal,
        });
        const body: unknown = await response.json();

        if (!response.ok) {
          if (response.status === 404) {
            setLoadState('empty');
            setMessage('Chưa có dữ liệu thửa đất. Dùng bảng nhập dữ liệu bên trái.');
            return;
          }
          const errorBody = body as { error?: string };
          throw new Error(errorBody.error || `Không thể tải dữ liệu (${response.status})`);
        }
        if (!isParcelFeatureCollection(body)) {
          throw new Error('API thửa đất trả về dữ liệu GeoJSON không hợp lệ.');
        }

        setGeojsonData(body);
        setLoadState(body.features.length > 0 ? 'ready' : 'empty');
        setMessage(
          body.features.length > 0
            ? `Đã tải ${body.features.length.toLocaleString('vi-VN')} thửa đất.`
            : 'Chưa có dữ liệu thửa đất.',
        );
      } catch (error) {
        if (controller.signal.aborted) return;
        setLoadState('error');
        setMessage(error instanceof Error ? error.message : 'Không thể tải dữ liệu thửa đất.');
      }
    };

    void loadParcels();
    return () => controller.abort();
  }, []);

  const handleImportComplete = useCallback((data: GeoJSON.FeatureCollection) => {
    setGeojsonData(data);
    setLoadState(data.features.length > 0 ? 'ready' : 'empty');
    setMessage(`Đã tải ${data.features.length.toLocaleString('vi-VN')} thửa đất.`);
    setSelectedParcel(null);
  }, []);

  const handleParcelClick = useCallback((selection: ParcelSelection) => {
    setFocusRequest(null);
    setSelectedParcel((current) =>
      current && String(current.id) === String(selection.id) ? null : selection,
    );
  }, []);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const sheet = sheetQuery.trim();
    const parcel = parcelQuery.trim();

    if (!sheet || !parcel) {
      setMessage('Nhập đủ số tờ và số thửa.');
      return;
    }
    if (!geojsonData) {
      setMessage('Chưa có dữ liệu để tìm kiếm.');
      return;
    }

    const feature = findParcelFeature(geojsonData, sheet, parcel);
    const id: ParcelId | null = feature ? getParcelFeatureId(feature) : null;

    if (!feature || id === null) {
      setMessage(`Không tìm thấy thửa ${parcel}, tờ ${sheet}.`);
      return;
    }

    const selection: ParcelSelection = {
      id,
      properties: (feature.properties ?? {}) as Record<string, unknown>,
      feature,
    };
    focusSequence.current += 1;
    setSelectedParcel(selection);
    setFocusRequest({ feature, requestId: focusSequence.current });
    setMessage(`Đã chọn thửa ${parcel}, tờ ${sheet}.`);
  };

  const clearSelection = () => {
    setSelectedParcel(null);
    setFocusRequest(null);
    setMessage(parcelCount > 0 ? `Đang hiển thị ${parcelCount.toLocaleString('vi-VN')} thửa đất.` : 'Chưa có dữ liệu thửa đất.');
  };

  const chooseInteractionMode = (mode: MapInteractionMode) => {
    setInteractionMode(mode);
    if (mode !== 'select') {
      setSelectedParcel(null);
      setFocusRequest(null);
    }
  };

  const handleDrawnFeatureChange = useCallback((feature: DrawnFeature | null) => {
    setDrawnFeature(feature);
    if (feature) setInteractionMode('select');
  }, []);

  const clearDrawing = () => {
    setDrawnFeature(null);
    setInteractionMode('select');
    setDrawResetKey((current) => current + 1);
  };

  return (
    <div className="-m-6 flex h-full flex-col">
      <div className="relative w-full flex-1">
        <MapView
          geojsonData={geojsonData}
          selectedParcelId={selectedParcel?.id ?? null}
          onParcelClick={handleParcelClick}
          parcelsVisible={parcelsVisible}
          labelsVisible={labelsVisible}
          parcelOpacity={parcelOpacity}
          basemap={basemap}
          satelliteTileTemplate={satelliteTileTemplate}
          satelliteAttribution={satelliteAttribution}
          focusRequest={focusRequest}
          interactionMode={interactionMode}
          drawnFeature={drawnFeature}
          drawResetKey={drawResetKey}
          onDrawnFeatureChange={handleDrawnFeatureChange}
        />

        <div className="absolute top-4 right-14 z-10 w-72 overflow-hidden rounded-xl border border-border bg-bg-card shadow-lg">
          <form onSubmit={handleSearch} className="space-y-3 border-b border-border p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <Search className="h-4 w-4 text-primary" />
              Tìm thửa đất
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1 text-xs text-text-secondary">
                <span>Số tờ</span>
                <input
                  value={sheetQuery}
                  onChange={(event) => setSheetQuery(event.target.value)}
                  className="w-full rounded-lg border border-border bg-bg-main px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
                  inputMode="numeric"
                  placeholder="23"
                />
              </label>
              <label className="space-y-1 text-xs text-text-secondary">
                <span>Số thửa</span>
                <input
                  value={parcelQuery}
                  onChange={(event) => setParcelQuery(event.target.value)}
                  className="w-full rounded-lg border border-border bg-bg-main px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
                  inputMode="numeric"
                  placeholder="717"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={loadState !== 'ready'}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Search className="h-4 w-4" />
              Tìm và định vị
            </button>
            <div className="flex items-start gap-2 text-xs text-text-secondary">
              {loadState === 'loading' && <Loader2 className="mt-0.5 h-3.5 w-3.5 animate-spin" />}
              {loadState === 'error' && <AlertCircle className="mt-0.5 h-3.5 w-3.5 text-danger" />}
              {loadState === 'ready' && <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-success" />}
              <span>{message}</span>
            </div>
            {selectedParcel && (
              <div className="flex items-center justify-between rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-xs">
                <span className="font-medium text-text-primary">
                  Thửa {String(selectedParcel.properties.so_thua ?? '')} · Tờ {String(selectedParcel.properties.to_ban_do ?? '')}
                </span>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="rounded p-1 text-text-secondary hover:bg-bg-main hover:text-danger"
                  aria-label="Bỏ chọn thửa"
                  title="Bỏ chọn thửa"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </form>

          <div className="space-y-3 p-4 text-xs text-text-secondary">
            <div className="space-y-2">
              <div className="font-semibold text-text-primary">Thao tác bản đồ</div>
              <div className="grid grid-cols-3 gap-2">
                {([
                  ['select', 'Chọn', MousePointer2],
                  ['point', 'Điểm', MapPin],
                  ['polygon', 'Vùng', Pentagon],
                ] as const).map(([mode, label, Icon]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => chooseInteractionMode(mode)}
                    aria-pressed={interactionMode === mode}
                    className={`flex flex-col items-center gap-1 rounded-lg border px-1 py-2 transition-colors ${
                      interactionMode === mode
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:bg-bg-main'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
              {interactionMode === 'point' && (
                <p className="text-[11px] leading-4">Nhấp bản đồ để đặt điểm.</p>
              )}
              {interactionMode === 'polygon' && (
                <p className="text-[11px] leading-4">
                  Nhấp ít nhất 3 đỉnh, rồi nhấp lại điểm màu cam để khép vùng.
                </p>
              )}
              {drawnFeature && (
                <div className="flex items-center justify-between rounded-lg bg-primary/5 px-2.5 py-2 text-primary">
                  <span>{drawnFeature.geometry.type === 'Point' ? 'Đã đặt điểm' : 'Đã tạo vùng'}</span>
                  <button
                    type="button"
                    onClick={clearDrawing}
                    className="flex items-center gap-1 rounded px-1.5 py-1 hover:bg-bg-main"
                    title="Xóa hình tạm"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Xóa
                  </button>
                </div>
              )}
            </div>

            <div className="border-t border-border pt-3">
            <div className="flex items-center gap-2 font-semibold text-text-primary">
              <Layers3 className="h-4 w-4 text-primary" />
              Lớp bản đồ
            </div>
            </div>
            <label className="flex cursor-pointer items-center justify-between">
              <span>Ranh thửa</span>
              <input
                type="checkbox"
                checked={parcelsVisible}
                onChange={(event) => setParcelsVisible(event.target.checked)}
                className="accent-primary"
              />
            </label>
            <label className="flex cursor-pointer items-center justify-between">
              <span>Số thửa</span>
              <input
                type="checkbox"
                checked={labelsVisible}
                disabled={!parcelsVisible}
                onChange={(event) => setLabelsVisible(event.target.checked)}
                className="accent-primary disabled:opacity-50"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="flex justify-between">
                <span>Độ mờ lớp thửa</span>
                <span>{Math.round(parcelOpacity * 100)}%</span>
              </span>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.1"
                value={parcelOpacity}
                onChange={(event) => setParcelOpacity(Number(event.target.value))}
                className="w-full accent-primary"
              />
            </label>

            <div className="border-t border-border pt-3">
              <div className="mb-2 font-semibold text-text-primary">Bản đồ nền</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBasemap('street')}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 transition-colors ${
                    basemap === 'street'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:bg-bg-main'
                  }`}
                >
                  <MapIcon className="h-4 w-4" />
                  Bản đồ
                </button>
                <button
                  type="button"
                  onClick={() => setBasemap('satellite')}
                  disabled={!satelliteConfigured}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    basemap === 'satellite'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:bg-bg-main'
                  }`}
                  title={satelliteConfigured ? 'Hiện ảnh vệ tinh' : 'Chưa cấu hình nguồn ảnh vệ tinh'}
                >
                  <Satellite className="h-4 w-4" />
                  Vệ tinh
                </button>
              </div>
              {!satelliteConfigured && (
                <p className="mt-2 text-[11px] leading-4">
                  Cấu hình NEXT_PUBLIC_SATELLITE_TILE_TEMPLATE để bật ảnh vệ tinh.
                </p>
              )}
            </div>
          </div>
        </div>

        <MapToolsPanel
          onImportComplete={handleImportComplete}
          parcelCount={parcelCount}
        />
        <MapLegend parcelCount={parcelCount} />
      </div>
    </div>
  );
}
