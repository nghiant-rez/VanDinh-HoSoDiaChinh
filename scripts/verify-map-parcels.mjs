import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  findParcelFeature,
  geometrySourceLabel,
  getBasemapVisibility,
  getParcelFeatureId,
  isParcelFeatureCollection,
  parcelPopupHtml,
} from '../src/lib/map-parcels.ts';
import {
  GIS_IMPORT_CONFIRMATION,
  isGisImportConfirmed,
} from '../src/lib/map-import.ts';

const sampleUrl = new URL('../backend/data/sample_parcels.geojson', import.meta.url);
const sample = JSON.parse(await readFile(sampleUrl, 'utf8'));

assert.ok(isParcelFeatureCollection(sample), 'sample must be a GeoJSON FeatureCollection');
assert.ok(sample.features.length >= 10, 'sample must contain at least 10 parcels');

const knownParcels = sample.features.slice(0, 10);
for (const expected of knownParcels) {
  const sheet = String(expected.properties?.to_ban_do ?? '');
  const parcel = String(expected.properties?.so_thua ?? '');
  const actual = findParcelFeature(sample, ` ${sheet} `, ` ${parcel} `);

  assert.ok(actual, `parcel ${sheet}/${parcel} must be found`);
  assert.equal(getParcelFeatureId(actual), getParcelFeatureId(expected));
  assert.ok(actual.geometry, `parcel ${sheet}/${parcel} must have geometry`);
}

assert.equal(findParcelFeature(sample, '27', 'not-a-parcel'), null);

assert.deepEqual(getBasemapVisibility('satellite', true), {
  street: 'none',
  satellite: 'visible',
});
assert.deepEqual(getBasemapVisibility('satellite', false), {
  street: 'visible',
  satellite: 'none',
});

const popup = parcelPopupHtml({
  so_thua: '717',
  to_ban_do: '23',
  dien_tich: 100,
  ten_chu: '<script>alert(1)</script>',
  dia_chi: 'Vân Đình',
  geometry_source: 'area_estimate',
});
assert.match(popup, /Chủ sử dụng/);
assert.match(popup, /Địa chỉ/);
assert.match(popup, /Ước tính từ diện tích/);
assert.ok(!popup.includes('<script>'), 'popup values must be HTML escaped');
assert.equal(geometrySourceLabel('dgn_polygon'), 'Ranh DGN');

assert.ok(isGisImportConfirmed(GIS_IMPORT_CONFIRMATION));
assert.ok(isGisImportConfirmed('  nhap lai toan bo  '));
assert.equal(isGisImportConfirmed('NHAP LAI'), false);

console.log(`Verified ${knownParcels.length} parcels, popup safety, basemap state, and import confirmation.`);
