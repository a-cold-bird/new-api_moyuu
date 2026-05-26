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

import React from 'react';
import { Tooltip } from '@douyinfe/semi-ui';
import { Activity, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  formatSuccessRate,
  compactUptimeSeries,
  getUptimeSeriesFromGroups,
  getUptimeStatusLevel,
} from '../../../../helpers/perfMetrics';

function colorClass(rate) {
  return `uptime-bar-${getUptimeStatusLevel(rate)}`;
}

function heightClass(rate) {
  const level = getUptimeStatusLevel(rate);
  if (level === 'success') return 'h-full';
  if (level === 'successLight') return 'h-[86%]';
  if (level === 'warning') return 'h-[66%]';
  return 'h-[42%]';
}

function textClass(rate) {
  const level = getUptimeStatusLevel(rate);
  if (level === 'success' || level === 'successLight') return 'uptime-text-success';
  if (level === 'warning') return 'uptime-text-warning';
  return 'uptime-text-danger';
}

function formatTime(ts) {
  const date = new Date(ts * 1000);
  return date.toLocaleString(undefined, {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const sizeConfig = {
  sm: { container: 'h-4', width: 'w-[2px]', gap: 'gap-px', text: 'text-xs' },
  md: { container: 'h-6', width: 'w-[3px]', gap: 'gap-px', text: 'text-sm' },
};

export const toUptimeSeries = getUptimeSeriesFromGroups;

const UptimeSparkline = ({
  series = [],
  emptyLabel = '-',
  size = 'md',
  showOverall = true,
  maxPoints = 18,
  className = '',
}) => {
  const visibleSeries = compactUptimeSeries(series, maxPoints);

  if (!visibleSeries.length) return <span className='text-xs text-gray-400'>{emptyLabel}</span>;

  const config = sizeConfig[size] || sizeConfig.md;
  const overall = visibleSeries.reduce((sum, point) => sum + point.success_rate, 0) / visibleSeries.length;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`flex items-end ${config.container} ${config.gap}`}
        role='img'
        aria-label={`uptime ${overall.toFixed(2)}%`}
      >
        {visibleSeries.map((point) => {
          const date = formatTime(point.ts);
          return (
            <Tooltip
              key={`${point.ts}-${point.success_rate}`}
              content={`${date} · ${formatSuccessRate(point.success_rate)}`}
            >
              <span
                className={`uptime-bar-track flex ${config.container} ${config.width} items-end transition-opacity hover:opacity-80`}
              >
                <span className={`w-full ${colorClass(point.success_rate)} ${heightClass(point.success_rate)}`} />
              </span>
            </Tooltip>
          );
        })}
      </div>
      {showOverall && (
        <span className={`font-mono ${config.text} font-semibold tabular-nums ${textClass(overall)}`}>
          {formatSuccessRate(overall)}
        </span>
      )}
    </div>
  );
};

export default UptimeSparkline;

export const UptimeStatusRow = ({ series = [], t }) => {
  const visibleSeries = series.filter((point) => Number.isFinite(point.success_rate));
  if (!visibleSeries.length) return null;

  const overall = visibleSeries.reduce((sum, point) => sum + point.success_rate, 0) / visibleSeries.length;
  const incidents = visibleSeries.filter((point) => point.success_rate < 98).length;
  let StatusIcon = CheckCircle2;
  let statusColor = 'uptime-text-success';
  let statusLabel = t('全部时段稳定');
  if (overall < 90) {
    StatusIcon = AlertCircle;
    statusColor = 'uptime-text-danger';
    statusLabel = t('近期存在明显异常');
  } else if (overall < 98 || incidents > 0) {
    StatusIcon = Activity;
    statusColor = overall >= 95 ? 'uptime-text-success' : 'uptime-text-warning';
    statusLabel = t('部分时段有波动');
  }

  return (
    <div className='flex flex-wrap items-center gap-3 rounded-xl border border-[var(--semi-color-border)] bg-[var(--semi-color-fill-0)] px-4 py-3'>
      <div className='flex items-center gap-2'>
        <StatusIcon size={16} className={statusColor} />
        <span className='text-sm font-medium text-[var(--semi-color-text-0)]'>
          {t('最近 18 小时可用率')}
        </span>
      </div>
      <UptimeSparkline series={visibleSeries} size='md' showOverall={true} className='ml-auto' />
      <div className='flex items-center gap-3 text-xs text-[var(--semi-color-text-2)]'>
        <span className={statusColor}>{statusLabel}</span>
        {incidents > 0 && <span>{t('{{count}} 个波动时段', { count: incidents })}</span>}
      </div>
    </div>
  );
};
