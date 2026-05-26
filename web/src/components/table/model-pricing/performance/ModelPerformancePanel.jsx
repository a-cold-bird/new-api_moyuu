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

import React, { useEffect, useMemo, useState } from 'react';
import { Card, Empty, Spin, Table, Tag, Typography } from '@douyinfe/semi-ui';
import { Activity, HeartPulse, Timer } from 'lucide-react';
import { API } from '../../../../helpers';
import {
  formatLatency,
  formatThroughput,
  formatSuccessRate,
  getAvailabilityStatus,
  getPerformanceSummary,
} from '../../../../helpers/perfMetrics';
import PerformanceCharts from './PerformanceCharts';
import UptimeSparkline, { toUptimeSeries, UptimeStatusRow } from './UptimeSparkline';

const { Text } = Typography;

const statusColor = {
  success: 'green',
  warning: 'amber',
  danger: 'red',
  unknown: 'grey',
};

function StatCard({ icon: Icon, label, value, hint, status }) {
  return (
    <Card className='!rounded-xl' bodyStyle={{ padding: 14 }}>
      <div className='flex items-center gap-2 text-xs text-gray-500 mb-2'>
        <Icon size={14} />
        <span>{label}</span>
      </div>
      <div className={`font-mono text-xl font-semibold ${status === 'success' ? 'text-emerald-600' : status === 'warning' ? 'text-amber-600' : status === 'danger' ? 'text-rose-600' : 'text-gray-900'}`}>
        {value}
      </div>
      {hint && <div className='text-xs text-gray-400 mt-1'>{hint}</div>}
    </Card>
  );
}

const ModelPerformancePanel = ({ modelData, t, usableGroup = {} }) => {
  const modelName = modelData?.model_name;
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!modelName) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    API.get('/api/perf-metrics', {
        params: { model: modelName, hours: 18 },
      skipErrorHandler: true,
    })
      .then((res) => {
        if (cancelled) return;
        if (res.data?.success) {
          setMetrics(res.data.data);
        } else {
          setError(res.data?.message || t('暂无性能数据'));
          setMetrics(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(t('暂无性能数据'));
          setMetrics(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [modelName, t]);

  const allowedGroups = useMemo(() => {
    return metrics?.groups || [];
  }, [metrics]);
  const groups = allowedGroups;
  const summary = useMemo(() => getPerformanceSummary(groups), [groups]);
  const uptimeSeries = useMemo(() => toUptimeSeries(groups), [groups]);
  const status = getAvailabilityStatus(summary.successRate);

  const columns = [
    {
      title: t('分组'),
      dataIndex: 'group',
      render: (group) => <Tag color='blue' shape='circle'>{group}</Tag>,
    },
    {
      title: 'TPS',
      dataIndex: 'avg_tps',
      align: 'right',
      render: (value) => <span className='font-mono'>{formatThroughput(value)}</span>,
    },
    {
      title: t('首字延迟'),
      dataIndex: 'avg_ttft_ms',
      align: 'right',
      render: (value) => <span className='font-mono'>{formatLatency(value)}</span>,
    },
    {
      title: t('平均延迟'),
      dataIndex: 'avg_latency_ms',
      align: 'right',
      render: (value) => <span className='font-mono'>{formatLatency(value)}</span>,
    },
    {
      title: t('成功率'),
      dataIndex: 'success_rate',
      render: (value, record) => (
        <div className='flex min-w-[220px] items-center justify-between gap-3'>
          <UptimeSparkline series={record.series || []} size='sm' showOverall={true} />
        </div>
      ),
    },
  ];

  if (loading) {
    return <div className='py-10 text-center'><Spin /></div>;
  }

  if (error || !groups.length) {
    return (
      <Empty
        title={t('暂无性能数据')}
        description={error || t('该模型最近 18 小时还没有足够的请求样本')}
      />
    );
  }

  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
        <StatCard icon={Timer} label='TPS' value={formatThroughput(summary.avgTps)} hint={t('平均输出吞吐')} />
        <StatCard icon={Activity} label={t('平均延迟')} value={formatLatency(summary.avgLatencyMs)} hint={t('请求完成耗时')} />
        <StatCard
          icon={HeartPulse}
          label={t('成功率')}
          value={formatSuccessRate(summary.successRate)}
          hint={t(status.label)}
          status={status.level}
        />
      </div>

      <UptimeStatusRow series={uptimeSeries} t={t} />

      <PerformanceCharts groups={groups} t={t} />

      <Card className='!rounded-xl' bodyStyle={{ padding: 0 }}>
        <div className='px-4 py-3 border-b border-gray-100'>
          <Text strong>{t('分组性能')}</Text>
          <Text type='secondary' size='small' className='ml-2'>
            {t('最近 18 小时，基于真实请求统计；右侧小柱状图展示各时段可用率')}
          </Text>
        </div>
        <Table
          size='small'
          pagination={false}
          columns={columns}
          dataSource={groups.map((group) => ({ ...group, key: group.group }))}
        />
      </Card>
    </div>
  );
};

export default ModelPerformancePanel;
