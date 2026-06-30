'use client';

import { useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// Van Dinh commune center (derived from 14,714 parcel centroids)
const VAN_DINH_CENTER: [number, number] = [105.764167, 20.734079];
const VAN_DINH_ZOOM = 15;

// Land type colors
const LAND_COLORS: Record<string, string> = {
  LUC: '#22c55e',  // Lua nuoc - green
  BHK: '#f59e0b',  // Dat bang hoang - amber
  DGT: '#6b7280',  // Giao thong - gray
  DTL: '#3b82f6',  // Thuy loi - blue
  ODT: '#ef4444',  // O dat - red
  CLN: '#84cc16',  // Cay lau nam - lime
  NTS: '#06b6d4',  // Nuoi trong thuy san - cyan
  TMD: '#a855f7',  // Thuong mai dich vu - purple
  SKC: '#f97316',  // San xuat kinh doanh - orange
  CQP: '#64748b',  // Quoc phong - slate
};

function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getFeatureCenter(feature: GeoJSON.Feature): [number, number] | null {
  const geom = feature.geometry;
  if (!geom) return null;
  if (geom.type === 'Point') {
    return geom.coordinates as [number, number];
  }
  if (geom.type === 'Polygon' || geom.type === 'MultiPolygon') {
    const ring = geom.type === 'Polygon'
      ? geom.coordinates[0]
      : geom.coordinates[0]?.[0];
    if (!ring || ring.length === 0) return null;
    let lon = 0, lat = 0;
    for (const [x, y] of ring) { lon += x; lat += y; }
    return [lon / ring.length, lat / ring.length];
  }
  return null;
}

interface MapViewProps {
  geojsonData: GeoJSON.FeatureCollection | null;
  onParcelClick?: (properties: Record<string, unknown>) => void;
}

export function MapView({ geojsonData, onParcelClick }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const popup = useRef<maplibregl.Popup | null>(null);

  const handleParcelClick = useCallback(
    (properties: Record<string, unknown>) => {
      onParcelClick?.(properties);
    },
    [onParcelClick]
  );

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: [
              'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap Contributors',
          },
        },
        layers: [
          {
            id: 'osm-layer',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 19,
            paint: {
              'raster-opacity': 0.7,
            },
          },
        ],
      },
      center: VAN_DINH_CENTER,
      zoom: VAN_DINH_ZOOM,
      maxZoom: 19,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.current.addControl(
      new maplibregl.ScaleControl({ maxWidth: 200 }),
      'bottom-left'
    );

    popup.current = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      maxWidth: '320px',
    });

    return () => {
      popup.current?.remove();
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update GeoJSON data when it changes
  useEffect(() => {
    if (!map.current || !geojsonData) return;

    const m = map.current;

    const addLayer = () => {
      // Remove existing source/layers
      const layers = ['parcels-fill', 'parcels-fill-outline', 'parcels-circle', 'parcels-label'];
      layers.forEach((id) => { if (m.getLayer(id)) m.removeLayer(id); });
      if (m.getSource('parcels')) m.removeSource('parcels');

      // Add GeoJSON source
      m.addSource('parcels', {
        type: 'geojson',
        data: geojsonData,
      });

      const polyFilter: maplibregl.FilterSpecification = ['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']];
      const pointFilter: maplibregl.FilterSpecification = ['==', ['geometry-type'], 'Point'];

      // Polygon fill layer
      m.addLayer({
        id: 'parcels-fill',
        type: 'fill',
        source: 'parcels',
        filter: polyFilter,
        paint: {
          'fill-color': [
            'match',
            ['get', 'mdsd2003'],
            'LUC', LAND_COLORS.LUC,
            'BHK', LAND_COLORS.BHK,
            'DGT', LAND_COLORS.DGT,
            'DTL', LAND_COLORS.DTL,
            'ODT', LAND_COLORS.ODT,
            'CLN', LAND_COLORS.CLN,
            'NTS', LAND_COLORS.NTS,
            'TMD', LAND_COLORS.TMD,
            'SKC', LAND_COLORS.SKC,
            'CQP', LAND_COLORS.CQP,
            '#94a3b8',
          ],
          'fill-opacity': 0.4,
        },
      });

      // Polygon outline
      m.addLayer({
        id: 'parcels-fill-outline',
        type: 'line',
        source: 'parcels',
        filter: polyFilter,
        paint: {
          'line-color': '#1e293b',
          'line-width': 2,
        },
      });

      // Circle layer for point-only parcels
      m.addLayer({
        id: 'parcels-circle',
        type: 'circle',
        source: 'parcels',
        filter: pointFilter,
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            12, 3,
            15, 6,
            18, 10,
          ],
          'circle-color': [
            'match',
            ['get', 'mdsd2003'],
            'LUC', LAND_COLORS.LUC,
            'BHK', LAND_COLORS.BHK,
            'DGT', LAND_COLORS.DGT,
            'DTL', LAND_COLORS.DTL,
            'ODT', LAND_COLORS.ODT,
            'CLN', LAND_COLORS.CLN,
            'NTS', LAND_COLORS.NTS,
            'TMD', LAND_COLORS.TMD,
            'SKC', LAND_COLORS.SKC,
            'CQP', LAND_COLORS.CQP,
            '#94a3b8',
          ],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1.5,
          'circle-opacity': 0.85,
        },
      });

      // Label layer (visible at higher zoom)
      m.addLayer({
        id: 'parcels-label',
        type: 'symbol',
        source: 'parcels',
        minzoom: 16,
        layout: {
          'text-field': ['get', 'so_thua'],
          'text-size': 11,
          'text-offset': [0, 1.5],
          'text-anchor': 'top',
        },
        paint: {
          'text-color': '#1e293b',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1.5,
        },
      });

      // Click handler (works on fill + circle layers)
      const clickHandler = (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
        if (!e.features || e.features.length === 0) return;
        const feature = e.features[0];
        const props = feature.properties || {};
        const feat = feature as unknown as GeoJSON.Feature;
        const center = getFeatureCenter(feat);
        if (!center) return;

        const area = props.dien_tich
          ? parseFloat(props.dien_tich).toLocaleString('vi-VN', { maximumFractionDigits: 1 })
          : '0';

        const html = `
          <div style="font-family: system-ui, sans-serif; font-size: 12px; line-height: 1.4; padding: 6px 8px; position: relative;">
            <button id="popup-close" style="position: absolute; top: 2px; right: 2px; width: 18px; height: 18px; border: none; border-radius: 3px; background: #f1f5f9; color: #64748b; font-size: 13px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.15s, color 0.15s;" onmouseover="this.style.background='#e2e8f0';this.style.color='#1e293b';" onmouseout="this.style.background='#f1f5f9';this.style.color='#64748b';" aria-label="Đóng">&times;</button>
            <div style="font-weight: 700; font-size: 13px; margin-bottom: 4px; color: #1e293b; border-bottom: 1px solid #e5e7eb; padding-bottom: 2px; padding-right: 22px;">
              Thửa ${escapeHtml(props.so_thua)} - Tờ ${escapeHtml(props.to_ban_do)}
            </div>
            <div style="background: #f0fdf4; padding: 4px; border-radius: 2px; margin-bottom: 4px; border-left: 3px solid #22c55e;">
              <div style="font-size: 10px; color: #15803d; margin-bottom: 0;">Diện tích</div>
              <div style="font-weight: 700; font-size: 14px; color: #166534;">${escapeHtml(area)} m²</div>
            </div>
            <div style="margin-bottom: 2px; font-size: 11px;"><b>Loại đất:</b> ${escapeHtml(props.loai_dat) || escapeHtml(props.mdsd2003) || 'N/A'}</div>
            ${props.ten_chu ? `<div style="margin-bottom: 2px; font-size: 11px;"><b>Chủ sử dụng:</b> ${escapeHtml(props.ten_chu)}</div>` : ''}
            ${props.dia_chi ? `<div style="margin-bottom: 2px; font-size: 11px;"><b>Địa chỉ:</b> ${escapeHtml(props.dia_chi)}</div>` : ''}
            ${props.xu_dong ? `<div style="margin-bottom: 2px; font-size: 11px;"><b>Xứ đồng:</b> ${escapeHtml(props.xu_dong)}</div>` : ''}
          </div>
        `;

        popup.current
          ?.setLngLat(center)
          .setHTML(html)
          .addTo(m);

        const closeBtn = document.getElementById('popup-close');
        if (closeBtn) {
          closeBtn.onclick = () => popup.current?.remove();
        }

        handleParcelClick(props);
      };

      m.on('click', 'parcels-fill', clickHandler);
      m.on('click', 'parcels-circle', clickHandler);

      // Hover cursor
      const cursorOn = () => { m.getCanvas().style.cursor = 'pointer'; };
      const cursorOff = () => { m.getCanvas().style.cursor = ''; };
      m.on('mouseenter', 'parcels-fill', cursorOn);
      m.on('mouseleave', 'parcels-fill', cursorOff);
      m.on('mouseenter', 'parcels-circle', cursorOn);
      m.on('mouseleave', 'parcels-circle', cursorOff);

      // Auto-fit map bounds to show all parcels
      if (geojsonData.features.length > 0) {
        const bounds = new maplibregl.LngLatBounds();
        geojsonData.features.forEach((f) => {
          const center = getFeatureCenter(f);
          if (center) bounds.extend(center);
        });
        if (bounds.isEmpty() === false) {
          m.fitBounds(bounds, { padding: 50, maxZoom: 17 });
        }
      }
    };

    const onStyleData = () => {
      if (m.isStyleLoaded() && !m.getLayer('parcels-circle')) {
        addLayer();
        m.off('styledata', onStyleData);
      }
    };

    if (m.isStyleLoaded()) {
      addLayer();
    } else {
      m.on('styledata', onStyleData);
    }

    return () => {
      m.off('styledata', onStyleData);
    };
  }, [geojsonData, handleParcelClick]);

  return <div ref={mapContainer} className="w-full h-full" />;
}
