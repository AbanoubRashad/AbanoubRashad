import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeStationState,
  statusHistory,
  historySummary,
  matchesFilters,
  defaultFilters,
  ago,
  freePlugCount,
} from '../src/domain/status.ts';
import type { CheckIn, Station } from '../src/domain/types.ts';

const MIN = 60_000;
const NOW = 1_800_000_000_000;
let n = 0;
const ci = (kind: CheckIn['kind'], minsAgo: number, userId = 'u1', plugId: string | null = null): CheckIn => ({
  id: String(n++),
  stationId: 's',
  plugId,
  kind,
  at: NOW - minsAgo * MIN,
  userId,
});

const station: Station = {
  id: 's', name: 'x', operator: 'Infinity', area: 'الصحراوي', quality: 'اتأكدت بنفسي',
  lat: 30, lng: 31, approximate: false,
  plugs: [
    { id: '01', connector: 'CCS2', kw: 60 },
    { id: '02', connector: 'CCS2', kw: 60 },
    { id: '03', connector: 'Type 2', kw: 22 },
  ],
  price: null, hours: null, nearby: [], notes: null, source: '', onHighway: true,
};

test('no reports → unknown', () => {
  assert.equal(computeStationState([], NOW).status, 'unknown');
});

test('recent ok → working', () => {
  assert.equal(computeStationState([ci('ok', 12)], NOW).status, 'working');
});

test('ok older than 3h → unknown', () => {
  assert.equal(computeStationState([ci('ok', 200)], NOW).status, 'unknown');
});

test('one broken report → conflict, not broken', () => {
  assert.equal(computeStationState([ci('broken', 5)], NOW).status, 'conflict');
});

test('two broken reports from different drivers → broken', () => {
  assert.equal(computeStationState([ci('broken', 5, 'a'), ci('broken', 30, 'b')], NOW).status, 'broken');
});

test('same driver reporting broken twice does not mark broken', () => {
  assert.equal(computeStationState([ci('broken', 5, 'a'), ci('broken', 30, 'a')], NOW).status, 'conflict');
});

test('an ok after broken reports clears them', () => {
  const s = computeStationState([ci('broken', 60, 'a'), ci('broken', 50, 'b'), ci('ok', 10, 'c')], NOW);
  assert.equal(s.status, 'working');
});

test('queue newer than ok → queue; queue older than 1h ignored', () => {
  assert.equal(computeStationState([ci('ok', 30), ci('queue', 5)], NOW).status, 'queue');
  assert.equal(computeStationState([ci('ok', 30), ci('queue', 90)], NOW).status, 'working');
});

test('future reports are ignored', () => {
  assert.equal(computeStationState([ci('ok', -10)], NOW).status, 'unknown');
});

test('plug states and free count', () => {
  const s = computeStationState([ci('ok', 10, 'a', '02'), ci('ok', 100, 'b', '01')], NOW);
  assert.equal(s.plugs['02'].status, 'busy');
  assert.equal(s.plugs['01'].status, 'free');
  assert.equal(freePlugCount(station, s), 2);
});

test('history buckets and summary', () => {
  const h = statusHistory([ci('ok', 30), ci('ok', 90), ci('queue', 150)], NOW, 12);
  assert.equal(h.length, 12);
  assert.equal(h[11], 'working');
  assert.equal(h[10], 'working');
  assert.equal(h[9], 'queue');
  assert.equal(historySummary(h), 'مرتين شغّال، مرة طابور');
});

test('filters', () => {
  const st = computeStationState([ci('ok', 5)], NOW);
  assert.ok(matchesFilters(station, st, defaultFilters));
  assert.ok(!matchesFilters(station, st, { ...defaultFilters, minKw: 120 }));
  assert.ok(matchesFilters(station, st, { ...defaultFilters, connectors: ['Type 2'] }));
  assert.ok(!matchesFilters(station, st, { ...defaultFilters, connectors: ['CHAdeMO'] }));
  const unknown = computeStationState([], NOW);
  assert.ok(!matchesFilters(station, unknown, { ...defaultFilters, workingOnly: true }));
});

test('ago in Egyptian Arabic', () => {
  assert.equal(ago(NOW - 12 * MIN, NOW), 'من 12 دقيقة');
  assert.equal(ago(NOW - 120 * MIN, NOW), 'من ساعتين');
  assert.equal(ago(NOW - 10_000, NOW), 'من ثواني');
});
