import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  findParcelFeature,
  getParcelFeatureId,
  isParcelFeatureCollection,
} from '../src/lib/map-parcels.ts';

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

console.log(`Verified ${knownParcels.length} known parcels and exact no-match behavior.`);
