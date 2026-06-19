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
            maxzoom: 22,
          },
        ],
      },
      center: VAN_DINH_CENTER,
      zoom: VAN_DINH_ZOOM,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.current.addControl(
      new maplibregl.ScaleControl({ maxWidth: 200 }),
      'bottom-left'
    );

    popup.current = new maplibregl.Popup({
      closeButton: true,
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
      if (m.getLayer('parcels-circle')) m.removeLayer('parcels-circle');
      if (m.getLayer('parcels-label')) m.removeLayer('parcels-label');
      if (m.getSource('parcels')) m.removeSource('parcels');

      // Add GeoJSON source
      m.addSource('parcels', {
        type: 'geojson',
        data: geojsonData,
      });

      // Circle layer colored by land type
      m.addLayer({
        id: 'parcels-circle',
        type: 'circle',
        source: 'parcels',
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

      // Click handler
      m.on('click', 'parcels-circle', (e) => {
        if (!e.features || e.features.length === 0) return;
        const feature = e.features[0];
        const props = feature.properties || {};
        const coords = (feature.geometry as GeoJSON.Point).coordinates;

        const html = `
          <div style="font-family: system-ui, sans-serif; font-size: 13px; line-height: 1.5;">
            <div style="font-weight: 700; font-size: 14px; margin-bottom: 6px; color: #1e293b;">
              Thua ${props.so_thua} - To ${props.to_ban_do}
            </div>
            <div><b>Dien tich:</b> ${props.dien_tich} m&sup2;</div>
            <div><b>Loai dat:</b> ${props.loai_dat} / ${props.mdsd2003}</div>
            <div><b>Chu SD:</b> ${props.ten_chu}</div>
            <div><b>Dia chi:</b> ${props.dia_chi}</div>
            ${props.xu_dong ? `<div><b>Xu dong:</b> ${props.xu_dong}</div>` : ''}
          </div>
        `;

        popup.current
          ?.setLngLat(coords as [number, number])
          .setHTML(html)
          .addTo(m);

        handleParcelClick(props);
      });

      // Hover cursor
      m.on('mouseenter', 'parcels-circle', () => {
        m.getCanvas().style.cursor = 'pointer';
      });
      m.on('mouseleave', 'parcels-circle', () => {
        m.getCanvas().style.cursor = '';
      });

      // Auto-fit map bounds to show all parcels
      if (geojsonData.features.length > 0) {
        const bounds = new maplibregl.LngLatBounds();
        geojsonData.features.forEach((f) => {
          const coords = (f.geometry as GeoJSON.Point).coordinates;
          bounds.extend(coords as [number, number]);
        });
        m.fitBounds(bounds, { padding: 50, maxZoom: 17 });
      }
    };

    if (m.isStyleLoaded()) {
      addLayer();
    } else {
      m.on('styledata', () => {
        if (m.isStyleLoaded() && !m.getLayer('parcels-circle')) {
          addLayer();
        }
      });
    }
  }, [geojsonData, handleParcelClick]);

  return <div ref={mapContainer} className="w-full h-full" />;
}
