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
import { Card, Tag, Typography } from '@douyinfe/semi-ui';
import { Boxes, FileText, Globe, Layers, Maximize2, Server, Sparkles } from 'lucide-react';
import { getLobeHubIcon, stringToColor } from '../../../../../helpers';
import { getVisibleModelGroups } from '../../../../../helpers/autoGroup';

const { Text, Paragraph } = Typography;

function SectionTitle({ children }) {
  return (
    <div className='mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400'>
      {children}
    </div>
  );
}

function InfoCard({ icon: Icon, title, subtitle, children, className = '' }) {
  return (
    <Card className={`!rounded-xl border border-gray-100 bg-white shadow-sm ${className}`} bodyStyle={{ padding: 16 }}>
      <div className='flex items-center gap-3 mb-4'>
        <div className='w-8 h-8 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center border border-gray-200/70'>
          <Icon size={18} />
        </div>
        <div>
          <Text strong className='text-sm font-semibold tracking-wide text-gray-900'>{title}</Text>
          <div className='text-[11px] text-gray-400 font-medium mt-0.5'>{subtitle}</div>
        </div>
      </div>
      {children}
    </Card>
  );
}

const ModelOverviewCards = ({ modelData, endpointMap = {}, usableGroup = {}, t }) => {
  const endpoints = modelData?.supported_endpoint_types || [];
  const groups = modelData?.enable_groups || [];
  const tags = modelData?.tags
    ? modelData.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
    : [];

  const vendorIcon = modelData?.vendor_icon || 'Layers';
  const visibleGroups = getVisibleModelGroups(groups, usableGroup);
  const stats = [
    {
      key: 'context',
      icon: Layers,
      label: t('上下文'),
      value: modelData?.context_length ? Number(modelData.context_length).toLocaleString() : '-',
      hint: t('最大输入窗口'),
    },
    {
      key: 'output',
      icon: Maximize2,
      label: t('最大输出'),
      value: modelData?.max_output_tokens ? Number(modelData.max_output_tokens).toLocaleString() : '-',
      hint: t('单次响应上限'),
    },
    {
      key: 'endpoint',
      icon: Globe,
      label: t('端点'),
      value: endpoints.length,
      hint: t('支持的 API 类型'),
    },
    {
      key: 'group',
      icon: Boxes,
      label: t('分组'),
      value: visibleGroups.length,
      hint: t('公开可用分组'),
    },
  ];

  return (
    <div className='space-y-5'>
      <div className='grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-gray-100 bg-gray-100 md:grid-cols-4'>
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.key} className='min-w-0 bg-white px-3 py-3'>
              <div className='flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-gray-400'>
                <Icon size={12} />
                <span className='truncate'>{stat.label}</span>
              </div>
              <div className='mt-1 truncate font-mono text-sm font-semibold text-gray-900'>
                {stat.value}
              </div>
              <div className='mt-0.5 truncate text-[10px] text-gray-400'>{stat.hint}</div>
            </div>
          );
        })}
      </div>

      <section className='rounded-xl border border-gray-100 bg-white p-4 shadow-sm'>
        <SectionTitle>{t('能力和供应商')}</SectionTitle>
        <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
          <InfoCard icon={Sparkles} title={t('模型概览')} subtitle={t('描述、标签和供应商信息')}>
            <div className='flex items-center gap-2.5 mb-3'>
              <div className='flex-shrink-0'>
                {getLobeHubIcon(vendorIcon, 24)}
              </div>
              <div>
                <Text className='text-sm font-semibold text-gray-800 truncate block max-w-[160px]'>
                  {modelData?.vendor_name || t('默认供应商')}
                </Text>
              </div>
            </div>
            <Paragraph
              className='text-xs text-gray-500 leading-relaxed mb-3 font-normal'
              ellipsis={{ rows: 3, showTooltip: true }}
            >
              {modelData?.description || modelData?.vendor_description || t('暂无模型描述')}
            </Paragraph>
            <div className='flex flex-wrap gap-1 mt-auto'>
              {tags.length > 0 ? tags.map((tag) => (
                <Tag key={tag} color={stringToColor(tag)} shape='circle' size='small' className='text-[10px] scale-95 origin-left font-medium'>
                  {tag}
                </Tag>
              )) : <Text type='secondary' size='small' className='text-xs'>{t('暂无标签')}</Text>}
            </div>
          </InfoCard>

          <InfoCard icon={Globe} title={t('端点能力')} subtitle={t('该模型支持的 API 类型')}>
            <div className='space-y-2 mt-1 max-h-[148px] overflow-y-auto pr-1'>
              {endpoints.length > 0 ? endpoints.map((endpoint) => {
                const info = endpointMap[endpoint] || {};
                return (
                  <div key={endpoint} className='flex items-center justify-between gap-3 text-xs bg-gray-50/50 p-2 rounded-lg border border-gray-100/50 hover:bg-gray-50 transition-colors'>
                    <Tag color={stringToColor(endpoint)} shape='circle' size='small' className='font-semibold text-[10px]'>
                      {endpoint}
                    </Tag>
                    <span className='text-gray-400 font-mono text-[10px] truncate max-w-[120px]' title={info.path || '-'}>
                      {info.path || '-'}
                    </span>
                  </div>
                );
              }) : <Text type='secondary' size='small' className='text-xs'>{t('暂无端点信息')}</Text>}
            </div>
          </InfoCard>

          <InfoCard icon={Server} title={t('可用分组')} subtitle={t('模型广场公开展示的启用分组')}>
            <div className='flex flex-wrap gap-1.5 mt-1 max-h-[148px] overflow-y-auto pr-1'>
              {visibleGroups.length > 0 ? visibleGroups.map((group) => (
                <Tag key={group} color='blue' shape='circle' size='small' className='font-medium text-[10px]'>
                  {group}
                </Tag>
              )) : <Text type='secondary' size='small' className='text-xs'>{t('暂无分组信息')}</Text>}
            </div>
          </InfoCard>
        </div>
      </section>
    </div>
  );
};

export default ModelOverviewCards;
