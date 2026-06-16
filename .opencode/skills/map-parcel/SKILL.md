---
name: map-parcel
description: MapLibre + PostGIS parcel map interaction patterns
---

Map at `src/components/map/MapView.tsx` (MapLibre GL)
- Parcels from PostgreSQL PostGIS via `/api/parcels`
- Geometry: GeoJSON format (ST_AsGeoJSON)
- Highlight: `map.setFeatureState` or popup on click
- Import maps via Python backend `/api/gis/import` (DXF -> GeoJSON)
- MapLibre style: use Figma tokens (color-primary, etc.)
