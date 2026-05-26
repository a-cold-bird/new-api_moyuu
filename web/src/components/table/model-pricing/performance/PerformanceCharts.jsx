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

import React, { useMemo } from 'react';
import { Card, Typography } from '@douyinfe/semi-ui';
import { VChart } from '@visactor/react-vchart';
import { Activity, HeartPulse } from 'lucide-react';
import { formatLatency, formatSuccessRate } from '../../../../helpers/perfMetrics';

const { Text } = Typography;

const chartOption = {
  mode: 'desktop-browser',
  animation: true,
};

function formatHour(ts) {
  const date = new Date(ts * 1000);
  return `${String(date.getHours()).padStart(2, '0')}:00`;
}

function average(values) {
  const usableValues = values.filter((value) => Number.isFinite(value) && value > 0);
  if (!usableValues.length) return 0;
  return usableValues.reduce((sum, value) => sum + value, 0) / usableValues.length;
}

function averageRate(values) {
  const usableValues = values.filter((value) => Number.isFinite(value));
  if (!usableValues.length) return 0;
  return usableValues.reduce((sum, value) => sum + value, 0) / usableValues.length;
}

function groupSeriesByTime(groups, field, reducer) {
  const bucket = new Map();
  groups.forEach((group) => {
    (group.series || []).forEach((point) => {
      const current = bucket.get(point.ts) || [];
      current.push(point[field]);
      bucket.set(point.ts, current);
    });
  });
  return Array.from(bucket.entries())
    .sort(([a], [b]) => a - b)
    .map(([ts, values]) => ({ ts, value: reducer(values) }))
    .filter((point) => Number.isFinite(point.value) && point.value > 0);
}

function buildLatencySpec(groups, t) {
  const values = groupSeriesByTime(groups, 'avg_ttft_ms', average).map((point) => ({
    time: formatHour(point.ts),
    ttft: Math.round(point.value),
  }));
  if (!values.length) return null;
  return {
    type: 'line',
    data: [{ id: 'latency', values }],
    xField: 'time',
    yField: 'ttft',
    smooth: true,
    point: { visible: true, style: { size: 5, stroke: '#303238', lineWidth: 1.5, fill: '#60a5fa' } },
    line: { style: { lineWidth: 2.5, stroke: '#60a5fa' } },
    area: { visible: true, style: { fill: 'linear-gradient(180deg, rgba(96,165,250,0.26), rgba(96,165,250,0.02))' } },
    legends: { visible: false },
    tooltip: {
      mark: {
        title: { value: (datum) => datum.time },
        content: [{ key: t('首字延迟'), value: (datum) => formatLatency(datum.ttft) }],
      },
    },
    axes: [
      { orient: 'bottom', label: { style: { fill: 'rgba(255,255,255,0.55)', fontSize: 10 } }, tick: { visible: false }, domainLine: { visible: false } },
      {
        orient: 'left',
        label: { formatMethod: (value) => `${Math.round(value)}ms`, style: { fill: 'rgba(255,255,255,0.55)', fontSize: 10 } },
        grid: { visible: true, style: { stroke: 'rgba(255,255,255,0.10)', lineDash: [3, 3] } },
        domainLine: { visible: false },
      },
    ],
  };
}

function buildUptimeSpec(groups, t) {
  const values = groupSeriesByTime(groups, 'success_rate', averageRate).map((point) => ({
    time: formatHour(point.ts),
    success: Math.round(point.value * 100) / 100,
  }));
  if (!values.length) return null;
  return {
    type: 'line',
    data: [{ id: 'uptime', values }],
    xField: 'time',
    yField: 'success',
    smooth: true,
    point: {
      visible: true,
      style: {
        size: 5,
        stroke: '#303238',
        lineWidth: 1.5,
        fill: (datum) => {
          if (datum.success >= 99.9) return '#34d399';
          if (datum.success >= 99) return '#f59e0b';
          return '#ef4444';
        },
      },
    },
    line: { style: { stroke: '#34d399', lineWidth: 2.5 } },
    area: { visible: true, style: { fill: 'linear-gradient(180deg, rgba(52,211,153,0.22), rgba(52,211,153,0.02))' } },
    legends: { visible: false },
    tooltip: {
      mark: {
        title: { value: (datum) => datum.time },
        content: [{ key: t('成功率'), value: (datum) => formatSuccessRate(datum.success) }],
      },
    },
    axes: [
      { orient: 'bottom', label: { style: { fill: 'rgba(255,255,255,0.55)', fontSize: 10 } }, tick: { visible: false }, domainLine: { visible: false } },
      {
        orient: 'left',
        min: 95,
        max: 100,
        label: { formatMethod: (value) => `${value}%`, style: { fill: 'rgba(255,255,255,0.55)', fontSize: 10 } },
        grid: { visible: true, style: { stroke: 'rgba(255,255,255,0.10)', lineDash: [3, 3] } },
        domainLine: { visible: false },
      },
    ],
  };
}

const ChartCard = ({ icon: Icon, title, description, spec, emptyText }) => (
  <Card className='!rounded-xl border border-white/10 bg-[#1f2025] shadow-none' bodyStyle={{ padding: 16 }}>
    <div className='mb-3 flex items-center gap-2'>
      <Icon size={15} className='shrink-0 text-white/55' />
      <div className='min-w-0'>
        <Text strong className='!text-sm !text-white'>{title}</Text>
        <div className='mt-0.5 truncate text-[11px] text-white/45'>{description}</div>
      </div>
    </div>
    <div className='h-60 sm:h-64'>
      {spec ? (
        <VChart spec={{ ...spec, theme: 'dark', background: 'transparent' }} option={chartOption} />
      ) : (
        <div className='h-full flex items-center justify-center text-sm text-white/40 border border-dashed border-white/10 rounded-lg'>
          {emptyText}
        </div>
      )}
    </div>
  </Card>
);

const PerformanceCharts = ({ groups, t }) => {
  const latencySpec = useMemo(() => buildLatencySpec(groups, t), [groups, t]);
  const uptimeSpec = useMemo(() => buildUptimeSpec(groups, t), [groups, t]);

  return (
    <div className='grid grid-cols-1 xl:grid-cols-2 gap-4'>
      <ChartCard
        icon={Activity}
        title={t('延迟趋势')}
        description={t('最近 18 小时按公开分组聚合后的首字延迟变化')}
        spec={latencySpec}
        emptyText={t('暂无延迟趋势数据')}
      />
      <ChartCard
        icon={HeartPulse}
        title={t('成功率趋势')}
        description={t('最近 18 小时按公开分组聚合后的请求成功率变化')}
        spec={uptimeSpec}
        emptyText={t('暂无成功率趋势数据')}
      />
    </div>
  );
};

export default PerformanceCharts;
