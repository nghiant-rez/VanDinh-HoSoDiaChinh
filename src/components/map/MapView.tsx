'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { parcelPopupHtml } from '@/lib/map-parcels';

const VAN_DINH_CENTER: [number, number] = [105.764167, 20.734079];
const EMPTY_GEOJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [],
};

const LAND_COLOR: maplibregl.ExpressionSpecification = [
  'match', ['get', 'mdsd2003'],
  'LUC', '#22c55e',
  'BHK', '#f59e0b',
  'DGT', '#6b7280',
  'DTL', '#3b82f6',
  'ODT', '#ef4444',
  'CLN', '#84cc16',
  'NTS', '#06b6d4',
  'TMD', '#a855f7',
  'SKC', '#f97316',
  'CQP', '#64748b',
  '#94a3b8',
];

const POLYGON_FILTER: maplibregl.FilterSpecification = [
  'any',
  ['==', ['geometry-type'], 'Polygon'],
  ['==', ['geometry-type'], 'MultiPolygon'],
];

const POINT_FILTER: maplibregl.FilterSpecification = [
  '==', ['geometry-type'], 'Point',
];

const VERIFIED_POLYGON_FILTER: maplibregl.FilterSpecification = [
  'all',
  POLYGON_FILTER,
  ['==', ['get', 'geometry_source'], 'dgn_polygon'],
];

const UNVERIFIED_POLYGON_FILTER: maplibregl.FilterSpecification = [
  'all',
  POLYGON_FILTER,
  ['!=', ['get', 'geometry_source'], 'dgn_polygon'],
];

export type ParcelId = string | number;
export type BasemapKind = 'street' | 'satellite';
export type MapInteractionMode = 'select' | 'point' | 'polygon';
export type DrawnFeature = GeoJSON.Feature<GeoJSON.Point | GeoJSON.Polygon>;

export interface ParcelSelection {
  id: ParcelId;
  properties: Record<string, unknown>;
  feature: GeoJSON.Feature;
}

export interface MapFocusRequest {
  feature: GeoJSON.Feature;
  requestId: number;
}

interface MapViewProps {
  geojsonData: GeoJSON.FeatureCollection | null;
  selectedParcelId: ParcelId | null;
  onParcelClick?: (selection: ParcelSelection) => void;
  parcelsVisible?: boolean;
  labelsVisible?: boolean;
  parcelOpacity?: number;
  basemap?: BasemapKind;
  satelliteTileTemplate?: string;
  satelliteAttribution?: string;
  focusRequest?: MapFocusRequest | null;
  interactionMode?: MapInteractionMode;
  drawnFeature?: DrawnFeature | null;
  drawResetKey?: number;
  onDrawnFeatureChange?: (feature: DrawnFeature | null) => void;
}

function drawingData(
  completed: DrawnFeature | null,
  draft: [number, number][],
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = completed ? [completed] : [];
  if (draft.length > 1) {
    features.push({
      type: 'Feature',
      properties: { kind: 'draft-line' },
      geometry: { type: 'LineString', coordinates: draft },
    });
  }
  for (const [index, coordinate] of draft.entries()) {
    features.push({
      type: 'Feature',
      properties: { kind: index === 0 ? 'start' : 'vertex' },
      geometry: { type: 'Point', coordinates: coordinate },
    });
  }
  return { type: 'FeatureCollection', features };
}

function setDrawingData(
  instance: maplibregl.Map,
  completed: DrawnFeature | null,
  draft: [number, number][],
) {
  const source = instance.getSource('drawings') as maplibregl.GeoJSONSource | undefined;
  source?.setData(drawingData(completed, draft));
}

function getParcelId(feature: GeoJSON.Feature): ParcelId | null {
  const id = feature.id ?? feature.properties?.id;
  return typeof id === 'string' || typeof id === 'number' ? id : null;
}

function addFeatureToBounds(
  bounds: maplibregl.LngLatBounds,
  feature: GeoJSON.Feature,
): maplibregl.LngLatBounds {
  const geometry = feature.geometry;
  if (!geometry) return bounds;
  if (geometry.type === 'Point') {
    return bounds.extend(geometry.coordinates as [number, number]);
  }

  const rings = geometry.type === 'Polygon'
    ? geometry.coordinates
    : geometry.type === 'MultiPolygon'
      ? geometry.coordinates.flat()
      : [];
  for (const ring of rings) {
    for (const coordinate of ring) {
      bounds.extend(coordinate as [number, number]);
    }
  }
  return bounds;
}

function opacityExpression(value: number): maplibregl.ExpressionSpecification {
  return [
    'case',
    ['boolean', ['feature-state', 'selected'], false],
    Math.min(1, value + 0.3),
    value,
  ];
}

function polygonOpacityExpression(value: number): maplibregl.ExpressionSpecification {
  return [
    'case',
    ['boolean', ['feature-state', 'selected'], false],
    Math.min(1, value + 0.3),
    ['==', ['get', 'geometry_source'], 'dgn_polygon'],
    value,
    Math.min(value, 0.18),
  ];
}

function applyBasemap(instance: maplibregl.Map, basemap: BasemapKind) {
  const satelliteAvailable = Boolean(instance.getLayer('satellite-layer'));
  const showSatellite = basemap === 'satellite' && satelliteAvailable;
  instance.setLayoutProperty('street-layer', 'visibility', showSatellite ? 'none' : 'visible');
  if (satelliteAvailable) {
    instance.setLayoutProperty('satellite-layer', 'visibility', showSatellite ? 'visible' : 'none');
  }
}

export function MapView({
  geojsonData,
  selectedParcelId,
  onParcelClick,
  parcelsVisible = true,
  labelsVisible = true,
  parcelOpacity = 0.4,
  basemap = 'street',
  satelliteTileTemplate = '',
  satelliteAttribution = 'Ảnh vệ tinh',
  focusRequest = null,
  interactionMode = 'select',
  drawnFeature = null,
  drawResetKey = 0,
  onDrawnFeatureChange,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const popup = useRef<maplibregl.Popup | null>(null);
  const clickCallback = useRef(onParcelClick);
  const drawCallback = useRef(onDrawnFeatureChange);
  const interactionModeRef = useRef<MapInteractionMode>(interactionMode);
  const basemapRef = useRef<BasemapKind>(basemap);
  const drawnFeatureRef = useRef<DrawnFeature | null>(drawnFeature);
  const draftCoordinates = useRef<[number, number][]>([]);
  const currentSelection = useRef<ParcelId | null>(selectedParcelId);
  const previousSelection = useRef<ParcelId | null>(null);
  const fittedInitialData = useRef(false);

  useEffect(() => {
    clickCallback.current = onParcelClick;
  }, [onParcelClick]);

  useEffect(() => {
    drawCallback.current = onDrawnFeatureChange;
  }, [onDrawnFeatureChange]);

  useEffect(() => {
    interactionModeRef.current = interactionMode;
  }, [interactionMode]);

  useEffect(() => {
    basemapRef.current = basemap;
  }, [basemap]);

  useEffect(() => {
    drawnFeatureRef.current = drawnFeature;
  }, [drawnFeature]);

  useEffect(() => {
    currentSelection.current = selectedParcelId;
  }, [selectedParcelId]);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    const instance = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          street: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap contributors',
          },
          parcels: {
            type: 'geojson',
            data: EMPTY_GEOJSON,
            promoteId: 'id',
          },
          drawings: {
            type: 'geojson',
            data: EMPTY_GEOJSON,
          },
        },
        layers: [
          { id: 'street-layer', type: 'raster', source: 'street' },
          {
            id: 'parcels-fill', type: 'fill', source: 'parcels',
            filter: POLYGON_FILTER,
            paint: {
              'fill-color': LAND_COLOR,
              'fill-opacity': polygonOpacityExpression(0.4),
            },
          },
          {
            id: 'parcels-outline', type: 'line', source: 'parcels',
            filter: VERIFIED_POLYGON_FILTER,
            paint: {
              'line-color': ['case', ['boolean', ['feature-state', 'selected'], false], '#f97316', '#1e293b'],
              'line-width': ['case', ['boolean', ['feature-state', 'selected'], false], 4, 1.5],
            },
          },
          {
            id: 'parcels-unverified-outline', type: 'line', source: 'parcels',
            filter: UNVERIFIED_POLYGON_FILTER,
            paint: {
              'line-color': ['case', ['boolean', ['feature-state', 'selected'], false], '#f97316', '#dc2626'],
              'line-width': ['case', ['boolean', ['feature-state', 'selected'], false], 4, 2],
              'line-dasharray': [2, 2],
            },
          },
          {
            id: 'parcels-circle', type: 'circle', source: 'parcels',
            filter: POINT_FILTER,
            paint: {
              'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 3, 15, 6, 18, 10],
              'circle-color': LAND_COLOR,
              'circle-opacity': opacityExpression(0.8),
              'circle-stroke-color': ['case', ['boolean', ['feature-state', 'selected'], false], '#f97316', '#ffffff'],
              'circle-stroke-width': ['case', ['boolean', ['feature-state', 'selected'], false], 4, 1.5],
            },
          },
          {
            id: 'parcels-label', type: 'symbol', source: 'parcels', minzoom: 16,
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
          },
          {
            id: 'drawings-fill', type: 'fill', source: 'drawings',
            filter: ['==', ['geometry-type'], 'Polygon'],
            paint: {
              'fill-color': '#2563eb',
              'fill-opacity': 0.2,
            },
          },
          {
            id: 'drawings-line', type: 'line', source: 'drawings',
            filter: [
              'any',
              ['==', ['geometry-type'], 'Polygon'],
              ['==', ['geometry-type'], 'LineString'],
            ],
            paint: {
              'line-color': '#2563eb',
              'line-width': 3,
              'line-dasharray': [2, 1],
            },
          },
          {
            id: 'drawings-point', type: 'circle', source: 'drawings',
            filter: ['==', ['geometry-type'], 'Point'],
            paint: {
              'circle-radius': ['case', ['==', ['get', 'kind'], 'start'], 7, 6],
              'circle-color': ['case', ['==', ['get', 'kind'], 'start'], '#f97316', '#2563eb'],
              'circle-stroke-color': '#ffffff',
              'circle-stroke-width': 2,
            },
          },
        ],
      },
      center: VAN_DINH_CENTER,
      zoom: 15,
      maxZoom: 19,
    });

    map.current = instance;
    popup.current = new maplibregl.Popup({ closeButton: true, closeOnClick: false });
    instance.addControl(new maplibregl.NavigationControl(), 'top-right');
    instance.addControl(new maplibregl.ScaleControl({ maxWidth: 200 }), 'bottom-left');

    const handleLoad = () => {
      if (!satelliteTileTemplate) return;
      instance.addSource('satellite', {
        type: 'raster',
        tiles: [satelliteTileTemplate],
        tileSize: 256,
        attribution: satelliteAttribution,
      });
      instance.addLayer(
        {
          id: 'satellite-layer',
          type: 'raster',
          source: 'satellite',
          layout: { visibility: 'none' },
        },
        'parcels-fill',
      );
      applyBasemap(instance, basemapRef.current);
    };

    const handleParcelClick = (
      event: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] },
    ) => {
      if (interactionModeRef.current !== 'select') return;
      const rendered = event.features?.[0];
      if (!rendered) return;
      const feature = rendered as unknown as GeoJSON.Feature;
      const id = getParcelId(feature);
      const properties = (feature.properties ?? {}) as Record<string, unknown>;
      const bounds = addFeatureToBounds(new maplibregl.LngLatBounds(), feature);
      if (id === null || bounds.isEmpty()) return;
      popup.current?.setLngLat(bounds.getCenter()).setHTML(parcelPopupHtml(properties)).addTo(instance);
      clickCallback.current?.({ id, properties, feature });
    };

    const handleDrawingClick = (event: maplibregl.MapMouseEvent) => {
      const mode = interactionModeRef.current;
      if (mode === 'select') return;

      const coordinate: [number, number] = [event.lngLat.lng, event.lngLat.lat];
      if (mode === 'point') {
        const feature: DrawnFeature = {
          type: 'Feature',
          properties: { kind: 'completed' },
          geometry: { type: 'Point', coordinates: coordinate },
        };
        draftCoordinates.current = [];
        drawnFeatureRef.current = feature;
        setDrawingData(instance, feature, []);
        drawCallback.current?.(feature);
        return;
      }

      const draft = draftCoordinates.current;
      if (draft.length >= 3) {
        const start = instance.project({ lng: draft[0][0], lat: draft[0][1] });
        const distance = Math.hypot(event.point.x - start.x, event.point.y - start.y);
        if (distance <= 14) {
          const feature: DrawnFeature = {
            type: 'Feature',
            properties: { kind: 'completed' },
            geometry: { type: 'Polygon', coordinates: [[...draft, draft[0]]] },
          };
          draftCoordinates.current = [];
          drawnFeatureRef.current = feature;
          setDrawingData(instance, feature, []);
          drawCallback.current?.(feature);
          return;
        }
      }

      if (draft.length === 0 && drawnFeatureRef.current) {
        drawnFeatureRef.current = null;
        drawCallback.current?.(null);
      }
      draft.push(coordinate);
      setDrawingData(instance, drawnFeatureRef.current, draft);
    };

    const cursorOn = () => {
      instance.getCanvas().style.cursor = interactionModeRef.current === 'select' ? 'pointer' : 'crosshair';
    };
    const cursorOff = () => {
      instance.getCanvas().style.cursor = interactionModeRef.current === 'select' ? '' : 'crosshair';
    };

    instance.on('load', handleLoad);
    instance.on('click', handleDrawingClick);
    instance.on('click', 'parcels-fill', handleParcelClick);
    instance.on('click', 'parcels-circle', handleParcelClick);
    instance.on('mouseenter', 'parcels-fill', cursorOn);
    instance.on('mouseleave', 'parcels-fill', cursorOff);
    instance.on('mouseenter', 'parcels-circle', cursorOn);
    instance.on('mouseleave', 'parcels-circle', cursorOff);

    return () => {
      popup.current?.remove();
      instance.remove();
      map.current = null;
    };
  }, [satelliteAttribution, satelliteTileTemplate]);

  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    draftCoordinates.current = [];
    const update = () => setDrawingData(instance, drawnFeatureRef.current, []);
    if (instance.isStyleLoaded()) update();
    else instance.once('load', update);
    instance.getCanvas().style.cursor = interactionMode === 'select' ? '' : 'crosshair';
    if (interactionMode !== 'select') popup.current?.remove();
    return () => { instance.off('load', update); };
  }, [interactionMode]);

  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    const update = () => setDrawingData(instance, drawnFeature, draftCoordinates.current);
    if (instance.isStyleLoaded()) update();
    else instance.once('load', update);
    return () => { instance.off('load', update); };
  }, [drawnFeature]);

  useEffect(() => {
    const instance = map.current;
    draftCoordinates.current = [];
    if (instance?.isStyleLoaded()) setDrawingData(instance, drawnFeatureRef.current, []);
  }, [drawResetKey]);

  useEffect(() => {
    const instance = map.current;
    if (!instance) return;

    const update = async () => {
      const source = instance.getSource('parcels') as maplibregl.GeoJSONSource | undefined;
      if (!source) return;
      await source.setData(geojsonData ?? EMPTY_GEOJSON, true);
      if (currentSelection.current !== null) {
        instance.setFeatureState(
          { source: 'parcels', id: currentSelection.current },
          { selected: true },
        );
      }
      if (!fittedInitialData.current && geojsonData?.features.length) {
        const bounds = geojsonData.features.reduce(
          addFeatureToBounds,
          new maplibregl.LngLatBounds(),
        );
        if (!bounds.isEmpty()) {
          instance.fitBounds(bounds, { padding: 50, maxZoom: 17 });
          fittedInitialData.current = true;
        }
      }
    };

    if (instance.isStyleLoaded()) void update();
    else instance.once('load', update);
    return () => { instance.off('load', update); };
  }, [geojsonData]);

  useEffect(() => {
    const instance = map.current;
    if (!instance?.isStyleLoaded()) return;
    if (previousSelection.current !== null) {
      instance.setFeatureState(
        { source: 'parcels', id: previousSelection.current },
        { selected: false },
      );
    }
    if (selectedParcelId !== null) {
      instance.setFeatureState(
        { source: 'parcels', id: selectedParcelId },
        { selected: true },
      );
    } else {
      popup.current?.remove();
    }
    previousSelection.current = selectedParcelId;
  }, [selectedParcelId]);

  useEffect(() => {
    const instance = map.current;
    if (!instance?.isStyleLoaded()) return;
    const visibility = parcelsVisible ? 'visible' : 'none';
    for (const layer of ['parcels-fill', 'parcels-outline', 'parcels-unverified-outline', 'parcels-circle']) {
      instance.setLayoutProperty(layer, 'visibility', visibility);
    }
    instance.setLayoutProperty(
      'parcels-label',
      'visibility',
      parcelsVisible && labelsVisible ? 'visible' : 'none',
    );
  }, [labelsVisible, parcelsVisible]);

  useEffect(() => {
    const instance = map.current;
    if (!instance?.isStyleLoaded()) return;
    instance.setPaintProperty('parcels-fill', 'fill-opacity', polygonOpacityExpression(parcelOpacity));
    instance.setPaintProperty(
      'parcels-circle',
      'circle-opacity',
      opacityExpression(Math.min(0.85, parcelOpacity + 0.4)),
    );
  }, [parcelOpacity]);

  useEffect(() => {
    const instance = map.current;
    if (!instance?.isStyleLoaded()) return;
    applyBasemap(instance, basemap);
  }, [basemap]);

  useEffect(() => {
    const instance = map.current;
    if (!instance || !focusRequest) return;
    const bounds = addFeatureToBounds(new maplibregl.LngLatBounds(), focusRequest.feature);
    if (bounds.isEmpty()) return;
    const geometry = focusRequest.feature.geometry;
    if (geometry?.type === 'Point') instance.flyTo({ center: bounds.getCenter(), zoom: 18 });
    else instance.fitBounds(bounds, { padding: 100, maxZoom: 19 });
    const properties = (focusRequest.feature.properties ?? {}) as Record<string, unknown>;
    popup.current?.setLngLat(bounds.getCenter()).setHTML(parcelPopupHtml(properties)).addTo(instance);
  }, [focusRequest]);

  return <div ref={mapContainer} className="h-full w-full" />;
}
