'use client';

import { useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { MapView } from '@/components/map/MapView';
import { MapToolsPanel } from '@/components/map/MapToolsPanel';
import { MapLegend } from '@/components/map/MapLegend';

export default function MapPage() {
  const searchParams = useSearchParams();
  const autoImport = searchParams.get('test') === '1';
  const [geojsonData, setGeojsonData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [parcelCount, setParcelCount] = useState(0);

  const handleImportComplete = useCallback((data: GeoJSON.FeatureCollection) => {
    setGeojsonData(data);
    setParcelCount(data.features.length);
  }, []);

  const handleParcelClick = useCallback((properties: Record<string, unknown>) => {
    console.log('Parcel clicked:', properties);
  }, []);

  return (
    <div className="flex flex-col h-full -m-6">
      <div className="relative flex-1 w-full">
        <MapView geojsonData={geojsonData} onParcelClick={handleParcelClick} />
        <MapToolsPanel
          onImportComplete={handleImportComplete}
          parcelCount={parcelCount}
          autoImport={autoImport ? 5 : 0}
        />
        <MapLegend parcelCount={parcelCount} />
      </div>
    </div>
  );
}
