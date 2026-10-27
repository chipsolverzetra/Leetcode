import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAlerts, lineStatuses, normalizeOutages, arrivalsAtStop, classifyAlertType } from '../server/transform.js';
import { feedForRoute } from '../server/feeds.js';
import { sampleAlerts, sampleOutages, sampleTripFeed } from '../server/sample-data.js';

test('expired alerts are dropped and routes are collected', () => {
  const alerts = normalizeAlerts(sampleAlerts());
  assert.equal(alerts.length, 4);
  assert.ok(!alerts.some((a) => a.id === 'sample:expired'));
  assert.deepEqual(alerts.find((a) => a.id === 'sample:delay-ace').routes, ['A', 'C']);
});

test('alert types are classified', () => {
  assert.equal(classifyAlertType('Planned - Part Suspended'), 'suspended');
  assert.equal(classifyAlertType('Delays'), 'delays');
  assert.equal(classifyAlertType('Planned - Stations Skipped'), 'changes');
});

test('line status takes the worst alert', () => {
  const lines = lineStatuses(normalizeAlerts(sampleAlerts()));
  const get = (id) => lines.find((l) => l.id === id).status;
  assert.equal(get('G'), 'suspended');
  assert.equal(get('A'), 'delays');
  assert.equal(get('N'), 'changes');
  assert.equal(get('1'), 'good');
});

test('outages normalise equipment types and lines', () => {
  const o = normalizeOutages(sampleOutages());
  assert.equal(o[0].type, 'elevator');
  assert.deepEqual(o[0].lines, ['A', 'C', 'F', 'R']);
  assert.equal(o.find((x) => x.station === 'Times Sq-42 St').upcoming, true);
});

test('arrivals are split by direction and sorted', () => {
  const now = Date.now();
  const arr = arrivalsAtStop(sampleTripFeed(['1', '2'], '127', now), '127', { now });
  assert.ok(arr.N.length > 0 && arr.S.length > 0);
  for (let i = 1; i < arr.N.length; i += 1) assert.ok(arr.N[i].arrival >= arr.N[i - 1].arrival);
  assert.ok(arr.N.every((r) => r.stopId === '127N'));
});

test('routes map to the right realtime feed', () => {
  assert.equal(feedForRoute('6'), '123456S');
  assert.equal(feedForRoute('E'), 'ACE');
  assert.equal(feedForRoute('M'), 'BDFM');
  assert.equal(feedForRoute('W'), 'NQRW');
  assert.equal(feedForRoute('SIR'), 'SI');
});
