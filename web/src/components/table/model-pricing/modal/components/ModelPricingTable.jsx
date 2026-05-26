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
import { Card, Typography, Table, Tag } from '@douyinfe/semi-ui';
import { DollarSign } from 'lucide-react';
import { calculateModelPrice, getModelPriceItems } from '../../../../../helpers';
import { buildAutoGroupChain } from '../../../../../helpers/autoGroup';

const { Text } = Typography;

const ModelPricingTable = ({
  modelData,
  groupRatio,
  currency,
  siteDisplayType,
  tokenUnit,
  displayPrice,
  showRatio,
  usableGroup,
  autoGroups = [],
  t,
}) => {
  const modelEnableGroups = Array.isArray(modelData?.enable_groups)
    ? modelData.enable_groups
    : [];
  const autoChain = autoGroups.filter((g) => modelEnableGroups.includes(g));
  const autoChainText = buildAutoGroupChain(autoChain, groupRatio);
  const renderGroupPriceTable = () => {
    // 仅展示模型可用的分组：模型 enable_groups 与用户可用分组的交集

    const modelAllowsAllGroups = modelEnableGroups.includes('all');
    const availableGroups = Object.keys(usableGroup || {})
      .filter((g) => g !== '')
      .filter((g) => g !== 'auto')
      .filter((g) => modelAllowsAllGroups || modelEnableGroups.includes(g));

    // 准备表格数据
    const tableData = availableGroups.map((group) => {
      const priceData = modelData
        ? calculateModelPrice({
            record: modelData,
            selectedGroup: group,
            groupRatio,
            tokenUnit,
            displayPrice,
            currency,
            quotaDisplayType: siteDisplayType,
          })
        : { inputPrice: '-', outputPrice: '-', price: '-' };

      // 获取分组倍率
      const groupRatioValue =
        groupRatio && groupRatio[group] ? groupRatio[group] : 1;

      return {
        key: group,
        group: group,
        ratio: groupRatioValue,
        billingType:
          modelData?.quota_type === 0
            ? t('按量计费')
            : modelData?.quota_type === 1
              ? t('按次计费')
              : '-',
        priceItems: getModelPriceItems(priceData, t, siteDisplayType),
      };
    });

    // 定义表格列
    const columns = [
      {
        title: t('分组'),
        dataIndex: 'group',
        render: (text) => (
          <Tag color='blue' size='small' shape='circle' className='font-semibold'>
            {text}
          </Tag>
        ),
      },
    ];

    // 如果显示倍率，添加倍率列
    if (showRatio) {
      columns.push({
        title: t('倍率'),
        dataIndex: 'ratio',
        render: (text) => (
          <Tag color='white' size='small' shape='circle' className='border border-gray-150 font-mono'>
            {text}x
          </Tag>
        ),
      });
    }

    // 添加计费类型列
    columns.push({
      title: t('计费类型'),
      dataIndex: 'billingType',
      render: (text) => {
        let color = 'white';
        if (text === t('按量计费')) color = 'violet';
        else if (text === t('按次计费')) color = 'teal';
        return (
          <Tag color={color} size='small' shape='circle' className='font-medium'>
            {text || '-'}
          </Tag>
        );
      },
    });

    columns.push({
      title: siteDisplayType === 'TOKENS' ? t('计费摘要') : t('价格摘要'),
      dataIndex: 'priceItems',
      render: (items) => (
        <div className='space-y-1 py-1'>
          {items.map((item) => (
            <div key={item.key} className='flex flex-col gap-0.5'>
              <div className='font-mono font-bold text-sm text-orange-600 tracking-tight'>
                {item.label} {item.value}
              </div>
              <div className='text-[10px] text-gray-400 font-medium scale-95 origin-left'>{item.suffix}</div>
            </div>
          ))}
        </div>
      ),
    });

    return tableData.length > 0 ? (
      <Table
        dataSource={tableData}
        columns={columns}
        pagination={false}
        size='small'
        bordered={false}
        className='!rounded-xl border border-gray-100 overflow-hidden'
      />
    ) : (
      <div className='rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-400'>
        {t('该模型暂无公开分组价格')}
      </div>
    );
  };

  return (
    <Card className='!rounded-xl border border-gray-100 bg-white shadow-sm' bodyStyle={{ padding: 20 }}>
      <div className='mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400'>
        {t('价格')}
      </div>
      <div className='flex items-center gap-3 mb-4'>
        <div className='w-9 h-9 rounded-lg bg-orange-50/70 text-orange-600 flex items-center justify-center border border-orange-100/30'>
          <DollarSign size={18} />
        </div>
        <div>
          <Text strong className='text-sm font-semibold tracking-wide text-gray-900'>{t('分组价格')}</Text>
          <div className='text-[11px] text-gray-400 font-medium mt-0.5'>
            {t('不同用户分组的价格信息')}
          </div>
        </div>
      </div>
      {autoChainText && (
        <div className='flex flex-wrap items-center gap-1.5 bg-gray-50 border border-gray-100 p-2.5 rounded-xl mb-4 text-xs font-medium text-gray-600'>
          <span>{t('auto分组调用链路')}</span>
          <span className='text-gray-400'>→</span>
          <span className='text-gray-800 font-mono'>{autoChainText}</span>
        </div>
      )}
      {renderGroupPriceTable()}
    </Card>
  );
};

export default ModelPricingTable;
