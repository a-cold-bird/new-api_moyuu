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
import {
  formatLatency,
  formatThroughput,
  formatSuccessRate,
  getAvailabilityStatus,
  getUptimeSeriesFromGroups,
  getUptimeStatusLevel,
} from '../../../../helpers/perfMetrics';
import UptimeSparkline from './UptimeSparkline';

const statusClass = {
  success: 'uptime-bar-success',
  successLight: 'uptime-bar-successLight',
  warning: 'uptime-bar-warning',
  danger: 'uptime-bar-danger',
  unknown: 'uptime-bar-track',
};

const ModelPerfBadge = ({ perf, seriesGroups = [], t, compact = false }) => {
  if (!perf) return null;

  const status = getAvailabilityStatus(perf.success_rate);
  const statusLevel = getUptimeStatusLevel(perf.success_rate);
  const uptimeSeries = getUptimeSeriesFromGroups(seriesGroups);
  const content = (
    <div className='space-y-1 text-xs'>
      <div>{t('平均延迟')}：{formatLatency(perf.avg_latency_ms)}</div>
      <div>TPS：{formatThroughput(perf.avg_tps)}</div>
      <div>{t('成功率')}：{formatSuccessRate(perf.success_rate)}</div>
    </div>
  );

  return (
    <Tooltip content={content} position='top'>
      <div
        className={`inline-grid items-start gap-x-2 text-right tabular-nums ${compact ? 'grid-cols-[34px_42px_40px]' : 'grid-cols-[42px_52px_74px]'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <div className='text-[10px] leading-4 text-gray-400'>{t('延迟')}</div>
          <div className='font-mono text-xs text-gray-600 whitespace-nowrap'>
            {formatLatency(perf.avg_latency_ms)}
          </div>
        </div>
        <div>
          <div className='text-[10px] leading-4 text-gray-400'>TPS</div>
          <div className='font-mono text-xs text-gray-600 whitespace-nowrap'>
            {formatThroughput(perf.avg_tps).replace(' t/s', '')}
          </div>
        </div>
        <div>
          <div className='text-[10px] leading-4 text-gray-400'>{t('状态')}</div>
          <div className='flex h-4 items-center justify-end'>
            {uptimeSeries.length > 0 ? (
              <UptimeSparkline
                series={uptimeSeries}
                size='sm'
                showOverall={false}
                maxPoints={compact ? 12 : 18}
              />
            ) : (
              <div className='flex h-4 items-end gap-[2px]'>
                <span className='h-[42%] w-1 uptime-bar-track' />
                <span className='h-[66%] w-1 uptime-bar-track' />
                <span className={`h-full w-1 ${statusClass[statusLevel] || statusClass[status.level]}`} />
              </div>
            )}
          </div>
        </div>
      </div>
    </Tooltip>
  );
};

export default ModelPerfBadge;
