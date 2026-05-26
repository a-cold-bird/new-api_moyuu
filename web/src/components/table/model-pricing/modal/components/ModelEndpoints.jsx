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
import { Card, Typography, Badge, Tag } from '@douyinfe/semi-ui';
import { Code2, Link2 } from 'lucide-react';

const { Text } = Typography;

const ModelEndpoints = ({ modelData, endpointMap = {}, t }) => {
  const renderAPIEndpoints = () => {
    if (!modelData) return null;

    const mapping = endpointMap;
    const types = modelData.supported_endpoint_types || [];

    return types.map((type) => {
      const info = mapping[type] || {};
      let path = info.path || '';
      // 如果路径中包含 {model} 占位符，替换为真实模型名称
      if (path.includes('{model}')) {
        const modelName = modelData.model_name || modelData.modelName || '';
        path = path.replaceAll('{model}', modelName);
      }
      const method = info.method || 'POST';
      const samplePath = path || `/v1/${type}`;
      return (
        <div
          key={type}
          className='rounded-xl border border-gray-100 bg-white p-3 shadow-sm'
          style={{ borderColor: 'var(--semi-color-border)' }}
        >
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <span className='flex min-w-0 items-center gap-2 pr-5'>
              <Badge dot type='success' />
              <Tag color='blue' shape='circle' size='small' className='font-semibold'>
                {type}
              </Tag>
            </span>
            <span className='rounded-md border border-gray-100 bg-gray-50 px-2 py-1 font-mono text-[11px] text-gray-500'>
              {method}
            </span>
          </div>
          <div className='mt-3 flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2'>
            <Link2 size={14} className='mt-0.5 shrink-0 text-gray-400' />
            <code className='break-all font-mono text-xs text-gray-600'>{samplePath}</code>
          </div>
        </div>
      );
    });
  };

  return (
    <Card className='!rounded-xl border border-gray-100 bg-white shadow-sm'>
      <div className='mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400'>
        API
      </div>
      <div className='flex items-center mb-4'>
        <div className='mr-3 flex h-9 w-9 items-center justify-center rounded-lg border border-purple-100/50 bg-purple-50 text-purple-600'>
          <Code2 size={18} />
        </div>
        <div>
          <Text className='text-sm font-semibold text-gray-900'>{t('API端点')}</Text>
          <div className='text-[11px] text-gray-400'>
            {t('模型支持的接口端点信息')}
          </div>
        </div>
      </div>
      <div className='space-y-3'>{renderAPIEndpoints()}</div>
    </Card>
  );
};

export default ModelEndpoints;
