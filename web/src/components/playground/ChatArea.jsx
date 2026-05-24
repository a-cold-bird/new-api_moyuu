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
import { Button, Card, Chat, Tag, Typography } from '@douyinfe/semi-ui';
import { Eye, EyeOff, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CustomInputRender from './CustomInputRender';

const ChatArea = ({
  chatRef,
  message,
  inputs,
  models,
  groups,
  styleState,
  showDebugPanel,
  customRequestMode,
  roleInfo,
  onMessageSend,
  onInputChange,
  onMessageCopy,
  onMessageReset,
  onMessageDelete,
  onStopGenerator,
  onClearMessages,
  onToggleDebugPanel,
  renderCustomChatContent,
  renderChatBoxAction,
}) => {
  const { t } = useTranslation();

  const promptPresets = React.useMemo(
    () => [
      { label: t('分析数据'), prompt: t('请分析这组数据并总结关键趋势。') },
      { label: t('给我惊喜'), prompt: t('给我一个有创意但实用的想法。') },
      { label: t('总结文本'), prompt: t('请总结下面内容，并列出重点。') },
      { label: t('写代码'), prompt: t('请帮我写一段清晰、可维护的代码。') },
      { label: t('给建议'), prompt: t('请基于当前情况给出可执行建议。') },
      { label: t('更多'), prompt: t('请给我更多可以尝试的提问方向。') },
    ],
    [t],
  );

  const handlePresetClick = React.useCallback(
    (prompt) => {
      onMessageSend(prompt);
    },
    [onMessageSend],
  );

  const renderInputArea = React.useCallback(
    (props) => {
      return (
        <CustomInputRender
          {...props}
          inputs={inputs}
          models={models}
          groups={groups}
          customRequestMode={customRequestMode}
          onInputChange={onInputChange}
          promptPresets={promptPresets}
          onPresetClick={handlePresetClick}
        />
      );
    },
    [
      customRequestMode,
      groups,
      handlePresetClick,
      inputs,
      models,
      onInputChange,
      promptPresets,
    ],
  );

  const modelName = inputs.model || t('选择模型开始对话');

  return (
    <Card
      className='h-full overflow-hidden !rounded-3xl'
      bordered={false}
      style={{
        background: 'var(--semi-color-bg-0)',
        border: '1px solid var(--semi-color-border)',
      }}
      bodyStyle={{
        padding: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--semi-color-bg-0)',
      }}
    >
      {/* 聊天头部 */}
      {styleState.isMobile ? (
        <div className='pt-3'></div>
      ) : (
        <div className='shrink-0'>
          <div className='mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-4 sm:px-7'>
            <div className='flex min-w-0 items-center gap-3'>
              <div className='min-w-0'>
                <Typography.Title heading={5} className='!mb-0'>
                  {t('操练场')}
                </Typography.Title>
                <div className='mt-1 flex items-center gap-2'>
                  <Tag
                    size='small'
                    color='blue'
                    className='max-w-[280px] truncate !rounded-full'
                  >
                    {modelName}
                  </Tag>
                  <Typography.Text type='tertiary' size='small'>
                    {message.length > 0
                      ? t('已加载对话上下文')
                      : t('选择模型并开始测试')}
                  </Typography.Text>
                </div>
              </div>
            </div>
            <div className='flex shrink-0 items-center gap-2'>
              <Button
                icon={showDebugPanel ? <EyeOff size={14} /> : <Eye size={14} />}
                onClick={onToggleDebugPanel}
                theme={showDebugPanel ? 'light' : 'borderless'}
                type='primary'
                size='small'
                className='!rounded-full'
              >
                {showDebugPanel ? t('隐藏调试') : t('显示调试')}
              </Button>
              {message.length > 0 && (
                <Button
                  icon={<Trash2 size={14} />}
                  onClick={onClearMessages}
                  theme='borderless'
                  type='tertiary'
                  size='small'
                  className='!rounded-full'
                >
                  {t('清空')}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 聊天内容区域 */}
      <div
        className='flex flex-1 overflow-hidden'
        style={{ background: 'transparent' }}
      >
        <div className='mx-auto h-full w-full max-w-5xl px-3 sm:px-4'>
          <Chat
            ref={chatRef}
            chatBoxRenderConfig={{
              renderChatBoxContent: renderCustomChatContent,
              renderChatBoxAction: renderChatBoxAction,
              renderChatBoxTitle: () => null,
            }}
            renderInputArea={renderInputArea}
            roleConfig={roleInfo}
            style={{
              height: '100%',
              maxWidth: '100%',
              overflow: 'hidden',
              background: 'transparent',
            }}
            chats={message}
            onMessageSend={onMessageSend}
            onMessageCopy={onMessageCopy}
            onMessageReset={onMessageReset}
            onMessageDelete={onMessageDelete}
            showClearContext
            showStopGenerate
            onStopGenerator={onStopGenerator}
            onClear={onClearMessages}
            className='h-full'
            placeholder={t('随便问')}
          />
        </div>
      </div>
    </Card>
  );
};

export default ChatArea;
