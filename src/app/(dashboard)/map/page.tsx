import { MapView } from '@/components/map/MapView';
import { MapToolsPanel } from '@/components/map/MapToolsPanel';
import { MapLegend } from '@/components/map/MapLegend';

export default function MapPage() {
  return (
    <div className="relative w-full h-[calc(100vh-8rem)] rounded-xl overflow-hidden border border-border shadow-sm">
      <MapView />
      <MapToolsPanel />
      <MapLegend />
    </div>
  );
}
