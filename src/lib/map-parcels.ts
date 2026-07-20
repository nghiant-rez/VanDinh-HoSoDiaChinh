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

export function geometrySourceLabel(value: unknown): string {
  switch (value) {
    case 'dgn_polygon': return 'Ranh DGN';
    case 'area_estimate': return 'Ước tính từ diện tích';
    case 'centroid_only': return 'Chỉ có điểm tâm';
    case 'untracked_polygon': return 'Đa giác cũ, chưa phân loại';
    default: return '';
  }
}

function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function parcelPopupHtml(properties: Record<string, unknown>): string {
  const area = Number(properties.dien_tich || 0).toLocaleString('vi-VN', {
    maximumFractionDigits: 1,
  });
  const geometrySource = geometrySourceLabel(properties.geometry_source);
  return `
    <div style="font-family:system-ui,sans-serif;font-size:12px;line-height:1.4;padding:8px 10px;min-width:210px">
      <div style="font-weight:700;font-size:13px;margin-bottom:6px;border-bottom:1px solid #e5e7eb;padding-bottom:4px">
        Thửa ${escapeHtml(properties.so_thua)} - Tờ ${escapeHtml(properties.to_ban_do)}
      </div>
      <div style="background:#fff7ed;padding:6px 8px;border-radius:6px;margin-bottom:6px;border-left:3px solid #f97316">
        <div style="font-size:10px;color:#9a3412">Diện tích</div>
        <div style="font-weight:700;font-size:14px;color:#7c2d12">${area} m²</div>
      </div>
      <div><b>Loại đất:</b> ${escapeHtml(properties.loai_dat) || escapeHtml(properties.mdsd2003) || 'Chưa có'}</div>
      ${properties.ten_chu ? `<div><b>Chủ sử dụng:</b> ${escapeHtml(properties.ten_chu)}</div>` : ''}
      ${properties.dia_chi ? `<div><b>Địa chỉ:</b> ${escapeHtml(properties.dia_chi)}</div>` : ''}
      ${properties.xu_dong ? `<div><b>Xứ đồng:</b> ${escapeHtml(properties.xu_dong)}</div>` : ''}
      ${geometrySource ? `<div><b>Nguồn hình học:</b> ${escapeHtml(geometrySource)}</div>` : ''}
    </div>`;
}
