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
import { Tag, Typography, Toast, Avatar } from '@douyinfe/semi-ui';
import { getLobeHubIcon, stringToColor } from '../../../../../helpers';

const { Paragraph } = Typography;

const CARD_STYLES = {
  container:
    'w-12 h-12 rounded-xl flex items-center justify-center relative bg-transparent overflow-hidden',
  icon: 'w-8 h-8 flex items-center justify-center',
};

const ModelHeader = ({ modelData, vendorsMap = {}, t }) => {
  const tags = modelData?.tags
    ? modelData.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
    : [];
  const vendorName = modelData?.vendor_name || vendorsMap?.[modelData?.vendor]?.name;
  const billingType = modelData?.quota_type === 0 ? t('按量计费') : t('按次计费');
  const description = modelData?.description || modelData?.vendor_description || '';
  // 获取模型图标（优先模型图标，其次供应商图标）
  const getModelIcon = () => {
    // 1) 优先使用模型自定义图标
    if (modelData?.icon) {
      return (
        <div className={CARD_STYLES.container}>
          <div className={CARD_STYLES.icon}>
            {getLobeHubIcon(modelData.icon, 32)}
          </div>
        </div>
      );
    }
    // 2) 退化为供应商图标
    if (modelData?.vendor_icon) {
      return (
        <div className={CARD_STYLES.container}>
          <div className={CARD_STYLES.icon}>
            {getLobeHubIcon(modelData.vendor_icon, 32)}
          </div>
        </div>
      );
    }

    // 如果没有供应商图标，使用模型名称的前两个字符
    const avatarText = modelData?.model_name?.slice(0, 2).toUpperCase() || 'AI';
    return (
      <div className={CARD_STYLES.container}>
        <Avatar
          size='large'
          style={{
            width: 48,
            height: 48,
            borderRadius: 16,
            fontSize: 16,
            fontWeight: 'bold',
            border: 0,
          }}
        >
          {avatarText}
        </Avatar>
      </div>
    );
  };

  return (
    <div className='flex items-start gap-3 py-1'>
      {getModelIcon()}
      <div className='min-w-0 flex-1 font-normal'>
        <Paragraph
          className='!mb-0 !text-xl !font-bold !leading-tight'
          copyable={{
            content: modelData?.model_name || '',
            onCopy: () => Toast.success({ content: t('已复制模型名称') }),
          }}
        >
          <span className='block truncate font-mono tracking-tight max-w-[680px]'>
            {modelData?.model_name || t('未知模型')}
          </span>
        </Paragraph>
        <div className='mt-1 flex flex-wrap items-center gap-1.5 text-xs text-gray-500'>
          {vendorName && <span>{vendorName}</span>}
          {vendorName && <span className='text-gray-300'>·</span>}
          <span>{billingType}</span>
          {modelData?.billing_mode === 'tiered_expr' && modelData?.billing_expr && (
            <Tag color='amber' size='small' shape='circle' className='!text-[10px]'>
              {t('动态定价')}
            </Tag>
          )}
        </div>
        {description && (
          <Paragraph
            className='!mb-0 !mt-2 !text-xs !leading-relaxed !text-gray-500 max-w-[760px]'
            ellipsis={{ rows: 2, showTooltip: true }}
          >
            {description}
          </Paragraph>
        )}
        {tags.length > 0 && (
          <div className='mt-2 flex flex-wrap gap-1'>
            {tags.slice(0, 8).map((tag) => (
              <Tag key={tag} color={stringToColor(tag)} size='small' shape='circle' className='!text-[10px]'>
                {tag}
              </Tag>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelHeader;
