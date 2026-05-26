/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

export function formatLatency(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return '-';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(ms >= 10_000 ? 1 : 2)}s`;
}

export function formatThroughput(tps) {
  if (!Number.isFinite(tps) || tps <= 0) return '-';
  return `${tps.toFixed(tps >= 10 ? 1 : 2)} t/s`;
}

export function formatSuccessRate(rate) {
  if (!Number.isFinite(rate)) return '-';
  return `${rate.toFixed(rate >= 99.9 ? 2 : 1)}%`;
}

export function normalizeDisplayRate(value, fallback = 1) {
  const parsedValue = Number(value);
  const parsedFallback = Number(fallback);
  const rate = Number.isFinite(parsedValue) ? parsedValue : parsedFallback;
  if (!Number.isFinite(rate)) return 1;
  return Math.max(rate, 0.001);
}

export function getPerfSummaryCacheKey(user) {
  if (!user?.id) return 'anonymous';
  return `user:${user.id}:${user.group || ''}`;
}

export function getAvailabilityStatus(successRate) {
  if (!Number.isFinite(successRate)) {
    return { level: 'unknown', color: 'grey', label: 'availability.no_data' };
  }
  if (successRate >= 99.9) {
    return { level: 'success', color: 'green', label: 'availability.stable' };
  }
  if (successRate >= 99) {
    return { level: 'warning', color: 'amber', label: 'availability.minor_blips' };
  }
  return { level: 'danger', color: 'red', label: 'availability.degraded' };
}

export function getUptimeStatusLevel(successRate) {
  if (!Number.isFinite(successRate)) return 'unknown';
  if (successRate >= 98) return 'success';
  if (successRate >= 95) return 'successLight';
  if (successRate >= 90) return 'warning';
  return 'danger';
}

function average(values) {
  const usableValues = values.filter((value) => Number.isFinite(value) && value > 0);
  if (usableValues.length === 0) return 0;
  return usableValues.reduce((sum, value) => sum + value, 0) / usableValues.length;
}

function weightOf(item) {
  return Number.isFinite(item?.request_count) && item.request_count > 0 ? item.request_count : 1;
}

function weightedAverage(items, valueKey, positiveOnly = false) {
  let weightedSum = 0;
  let totalWeight = 0;

  items.forEach((item) => {
    const value = item?.[valueKey];
    if (!Number.isFinite(value) || (positiveOnly && value <= 0)) return;
    const weight = weightOf(item);
    weightedSum += value * weight;
    totalWeight += weight;
  });

  if (totalWeight === 0) return average(items.map((item) => item?.[valueKey]));
  return weightedSum / totalWeight;
}

export function getPerformanceSummary(groups = []) {
  return {
    avgLatencyMs: Math.round(weightedAverage(groups, 'avg_latency_ms', true)),
    avgTtftMs: Math.round(weightedAverage(groups, 'avg_ttft_ms', true)),
    avgTps: weightedAverage(groups, 'avg_tps', true),
    successRate: weightedAverage(groups, 'success_rate'),
  };
}

export function buildPerfSummaryMaps(models = []) {
  const perfMap = {};
  const perfSeriesMap = {};

  models.forEach((item) => {
    if (!item?.model_name) return;
    perfMap[item.model_name] = item;
    perfSeriesMap[item.model_name] = [
      {
        group: 'summary',
        success_rate: item.success_rate,
        avg_latency_ms: item.avg_latency_ms,
        avg_tps: item.avg_tps,
        series: item.series || [],
      },
    ];
  });

  return { perfMap, perfSeriesMap };
}

export function getUptimeSeriesFromGroups(groups = []) {
  const byTs = new Map();
  groups.forEach((group) => {
    (group.series || []).forEach((point) => {
      if (!Number.isFinite(point.success_rate)) return;
      const current = byTs.get(point.ts) || { weightedSum: 0, totalWeight: 0 };
      const weight = weightOf(point);
      current.weightedSum += point.success_rate * weight;
      current.totalWeight += weight;
      byTs.set(point.ts, current);
    });
  });
  return Array.from(byTs.entries())
    .sort(([a], [b]) => a - b)
    .map(([ts, bucket]) => ({
      ts,
      success_rate: bucket.totalWeight > 0 ? bucket.weightedSum / bucket.totalWeight : 0,
    }));
}

export function compactUptimeSeries(series = [], maxPoints = 24) {
  const visibleSeries = series.filter((point) => Number.isFinite(point?.success_rate));
  if (!Number.isFinite(maxPoints) || maxPoints <= 0 || visibleSeries.length <= maxPoints) {
    return visibleSeries;
  }
  return visibleSeries.slice(-maxPoints);
}
