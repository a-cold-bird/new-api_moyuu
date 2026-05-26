import test from 'node:test';
import assert from 'node:assert/strict';

import {
  formatLatency,
  formatThroughput,
  buildPerfSummaryMaps,
  compactUptimeSeries,
  getAvailabilityStatus,
  getPerformanceSummary,
  getUptimeSeriesFromGroups,
  getUptimeStatusLevel,
  normalizeDisplayRate,
  getPerfSummaryCacheKey,
} from './perfMetrics.js';

test('formats performance values for compact model marketplace badges', () => {
  assert.equal(formatLatency(950), '950ms');
  assert.equal(formatLatency(12_300), '12.3s');
  assert.equal(formatLatency(0), '-');
  assert.equal(formatThroughput(27.891), '27.9 t/s');
});

test('classifies availability status by success rate', () => {
  assert.equal(getAvailabilityStatus(99.95).level, 'success');
  assert.equal(getAvailabilityStatus(99.95).label, 'availability.stable');
  assert.equal(getAvailabilityStatus(99.5).level, 'warning');
  assert.equal(getAvailabilityStatus(98.9).level, 'danger');
});

test('summarizes model performance groups', () => {
  const summary = getPerformanceSummary([
    { avg_latency_ms: 1000, success_rate: 100, avg_tps: 20 },
    { avg_latency_ms: 3000, success_rate: 99, avg_tps: 40 },
  ]);

  assert.equal(summary.avgLatencyMs, 2000);
  assert.equal(summary.successRate, 99.5);
  assert.equal(summary.avgTps, 30);
});

test('weights performance summaries by request count when available', () => {
  const summary = getPerformanceSummary([
    { avg_latency_ms: 1000, success_rate: 100, avg_tps: 10, request_count: 99 },
    { avg_latency_ms: 10_000, success_rate: 0, avg_tps: 100, request_count: 1 },
  ]);

  assert.equal(summary.avgLatencyMs, 1090);
  assert.equal(summary.successRate, 99);
  assert.equal(summary.avgTps, 10.9);
});

test('aggregates uptime series by timestamp across groups', () => {
  const series = getUptimeSeriesFromGroups([
    {
      group: 'codex',
      series: [
        { ts: 100, success_rate: 100 },
        { ts: 200, success_rate: 98 },
      ],
    },
    {
      group: 'codex_520',
      series: [
        { ts: 100, success_rate: 99 },
        { ts: 300, success_rate: 97 },
      ],
    },
  ]);

  assert.deepEqual(series, [
    { ts: 100, success_rate: 99.5 },
    { ts: 200, success_rate: 98 },
    { ts: 300, success_rate: 97 },
  ]);
});

test('weights uptime series by bucket request count when available', () => {
  const series = getUptimeSeriesFromGroups([
    {
      group: 'codex',
      series: [{ ts: 100, success_rate: 100, request_count: 99 }],
    },
    {
      group: 'codex_520',
      series: [{ ts: 100, success_rate: 0, request_count: 1 }],
    },
  ]);

  assert.deepEqual(series, [{ ts: 100, success_rate: 99 }]);
});

test('normalizes summary series response into marketplace performance maps', () => {
  const { perfMap, perfSeriesMap } = buildPerfSummaryMaps([
    {
      model_name: 'gpt-5.5',
      avg_latency_ms: 1200,
      success_rate: 98.5,
      avg_tps: 42,
      series: [
        { ts: 100, success_rate: 100, request_count: 3 },
        { ts: 200, success_rate: 97, request_count: 2 },
      ],
    },
  ]);

  assert.equal(perfMap['gpt-5.5'].success_rate, 98.5);
  assert.deepEqual(perfSeriesMap['gpt-5.5'], [
    {
      group: 'summary',
      success_rate: 98.5,
      avg_latency_ms: 1200,
      avg_tps: 42,
      series: [
        { ts: 100, success_rate: 100, request_count: 3 },
        { ts: 200, success_rate: 97, request_count: 2 },
      ],
    },
  ]);
});

test('limits uptime series to the most recent fixed-width buckets', () => {
  const series = Array.from({ length: 24 }, (_, index) => ({
    ts: index,
    success_rate: index % 2 === 0 ? 100 : 90,
  }));

  const compacted = compactUptimeSeries(series, 12);

  assert.equal(compacted.length, 12);
  assert.deepEqual(compacted[0], { ts: 12, success_rate: 100 });
  assert.deepEqual(compacted[11], { ts: 23, success_rate: 90 });
});

test('keeps display exchange rates above zero', () => {
  assert.equal(normalizeDisplayRate(0, 1), 0.001);
  assert.equal(normalizeDisplayRate(-2, 1), 0.001);
  assert.equal(normalizeDisplayRate(undefined, 2), 2);
  assert.equal(normalizeDisplayRate(3, 1), 3);
  assert.equal(normalizeDisplayRate('0', 1), 0.001);
  assert.equal(normalizeDisplayRate('2.5', 1), 2.5);
});

test('keys perf summary cache by current user identity', () => {
  assert.equal(getPerfSummaryCacheKey(null), 'anonymous');
  assert.equal(getPerfSummaryCacheKey({ id: 7, group: 'vip' }), 'user:7:vip');
  assert.equal(getPerfSummaryCacheKey({ id: 7 }), 'user:7:');
});

test('classifies uptime bars with requested thresholds', () => {
  assert.equal(getUptimeStatusLevel(98), 'success');
  assert.equal(getUptimeStatusLevel(97.99), 'successLight');
  assert.equal(getUptimeStatusLevel(95), 'successLight');
  assert.equal(getUptimeStatusLevel(94.99), 'warning');
  assert.equal(getUptimeStatusLevel(90), 'warning');
  assert.equal(getUptimeStatusLevel(89.99), 'danger');
});
