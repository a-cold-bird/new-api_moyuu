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

import React, { useRef, useEffect, useCallback } from 'react';
import { Button, Select, Toast } from '@douyinfe/semi-ui';
import {
  BarChart3,
  Box,
  Code2,
  GraduationCap,
  Paperclip,
  Search,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePlayground } from '../../contexts/PlaygroundContext';
import { renderGroupOption, selectFilter } from '../../helpers';

const CustomInputRender = (props) => {
  const { t } = useTranslation();
  const { onPasteImage, imageEnabled } = usePlayground();
  const {
    customRequestMode,
    groups = [],
    inputs = {},
    models = [],
    onInputChange,
    onPresetClick,
    promptPresets = [],
    detailProps,
  } = props;
  const { clearContextNode, inputNode, sendNode, onClick } = detailProps;
  const containerRef = useRef(null);

  const presetIcons = [BarChart3, Box, Sparkles, Code2, GraduationCap];

  const handleUnavailableAction = useCallback(
    (action) => {
      Toast.info({
        content: `${action}${t('功能正在开发中')}`,
        duration: 2,
      });
    },
    [t],
  );

  const handlePaste = useCallback(
    async (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = item.getAsFile();

          if (file) {
            try {
              if (!imageEnabled) {
                Toast.warning({
                  content: t('请先在设置中启用图片功能'),
                  duration: 3,
                });
                return;
              }

              const reader = new FileReader();
              reader.onload = (event) => {
                const base64 = event.target.result;

                if (onPasteImage) {
                  onPasteImage(base64);
                  Toast.success({
                    content: t('图片已添加'),
                    duration: 2,
                  });
                } else {
                  Toast.error({
                    content: t('无法添加图片'),
                    duration: 2,
                  });
                }
              };
              reader.onerror = () => {
                console.error('Failed to read image file:', reader.error);
                Toast.error({
                  content: t('粘贴图片失败'),
                  duration: 2,
                });
              };
              reader.readAsDataURL(file);
            } catch (error) {
              console.error('Failed to paste image:', error);
              Toast.error({
                content: t('粘贴图片失败'),
                duration: 2,
              });
            }
          }
          break;
        }
      }
    },
    [onPasteImage, imageEnabled, t],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('paste', handlePaste);
    return () => {
      container.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  // 清空按钮
  const styledClearNode = clearContextNode
    ? React.cloneElement(clearContextNode, {
        className: `!rounded-full flex-shrink-0 transition-all ${clearContextNode.props.className || ''}`,
        style: {
          ...clearContextNode.props.style,
          width: '34px',
          height: '34px',
          minWidth: '34px',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--semi-color-text-2)',
          background: 'var(--semi-color-fill-0)',
        },
      })
    : null;

  // 发送按钮
  const styledSendNode = sendNode
    ? React.cloneElement(sendNode, {
        className: `!rounded-full flex-shrink-0 transition-all ${sendNode.props.className || ''}`,
        style: {
          ...sendNode.props.style,
          width: '38px',
          height: '38px',
          minWidth: '38px',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow:
            'var(--semi-shadow-elevated, 0 12px 32px rgba(0, 0, 0, 0.08))',
        },
      })
    : null;

  return (
    <div className='px-3 pb-4 pt-2 sm:px-4 sm:pb-6' ref={containerRef}>
      <div
        className='mx-auto flex w-full max-w-4xl flex-col gap-3 rounded-2xl p-3 transition-shadow'
        style={{
          border: '1px solid var(--semi-color-border)',
          background: 'var(--semi-color-bg-0)',
          boxShadow:
            'var(--semi-shadow-elevated, 0 10px 26px rgba(0, 0, 0, 0.08))',
        }}
        onClick={onClick}
        title={t('支持 Ctrl+V 粘贴图片')}
      >
        <div className='min-h-[72px] min-w-0'>{inputNode}</div>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-2'>
            {styledClearNode}
            <Button
              icon={<Paperclip size={14} />}
              size='small'
              theme='outline'
              type='tertiary'
              className='!rounded-lg'
              onClick={() => handleUnavailableAction(t('附加'))}
            >
              {t('附加')}
            </Button>
            <Button
              icon={<Search size={14} />}
              size='small'
              theme='outline'
              type='tertiary'
              className='!rounded-lg'
              onClick={() => handleUnavailableAction(t('搜索'))}
            >
              {t('搜索')}
            </Button>
          </div>
          <div className='flex min-w-0 flex-wrap items-center gap-2 sm:flex-nowrap'>
            <Select
              placeholder={t('分组')}
              value={inputs.group}
              optionList={groups}
              renderOptionItem={renderGroupOption}
              filter={selectFilter}
              autoClearSearchValue={false}
              onChange={(value) => onInputChange?.('group', value)}
              disabled={customRequestMode}
              size='small'
              className='!rounded-lg'
              style={{ minWidth: 120, maxWidth: 170 }}
              dropdownStyle={{ width: 240 }}
            />
            <Select
              placeholder={t('模型')}
              value={inputs.model}
              optionList={models}
              filter={selectFilter}
              autoClearSearchValue={false}
              onChange={(value) => onInputChange?.('model', value)}
              disabled={customRequestMode}
              size='small'
              className='!rounded-lg'
              style={{ minWidth: 150, maxWidth: 230 }}
              dropdownStyle={{ width: 280 }}
            />
            {styledSendNode}
          </div>
        </div>
      </div>
      <div className='mx-auto mt-3 flex w-full max-w-4xl flex-wrap items-center gap-2'>
        {promptPresets.map((preset, index) => {
          const Icon = presetIcons[index] || Sparkles;
          return (
            <Button
              key={preset.label}
              icon={<Icon size={14} />}
              size='small'
              theme='outline'
              type='tertiary'
              className='!rounded-full'
              onClick={() => onPresetClick?.(preset.prompt)}
            >
              {preset.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default CustomInputRender;
