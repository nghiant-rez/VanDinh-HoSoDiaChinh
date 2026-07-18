export type ParcelFeatureId = string | number;

export function isParcelFeatureCollection(
  value: unknown,
): value is GeoJSON.FeatureCollection {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as { type?: unknown; features?: unknown };
  return candidate.type === 'FeatureCollection' && Array.isArray(candidate.features);
}

export function getParcelFeatureId(
  feature: GeoJSON.Feature,
): ParcelFeatureId | null {
  const id = feature.id ?? feature.properties?.id;
  return typeof id === 'string' || typeof id === 'number' ? id : null;
}

export function findParcelFeature(
  data: GeoJSON.FeatureCollection,
  sheet: string,
  parcel: string,
): GeoJSON.Feature | null {
  const normalizedSheet = sheet.trim();
  const normalizedParcel = parcel.trim();
  return data.features.find((feature) => {
    const properties = feature.properties ?? {};
    return String(properties.to_ban_do ?? '').trim() === normalizedSheet
      && String(properties.so_thua ?? '').trim() === normalizedParcel;
  }) ?? null;
}
