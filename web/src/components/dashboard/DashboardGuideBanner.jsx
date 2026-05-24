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
import { Button, Card, Tag, Toast } from '@douyinfe/semi-ui';
import {
  ChevronDown,
  ChevronUp,
  Check,
  Landmark,
  Play,
  ReceiptText,
  Send,
  Copy,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API, copy, fetchTokenKey } from '../../helpers';

const STORAGE_KEY = 'moyuu_dashboard_guide_collapsed';
const FALLBACK_MODEL = 'gpt-image-2-2k';
const REDACTED_API_KEY = 'sk-••••••••';

const getTokenItems = (data) => (Array.isArray(data) ? data : data?.items || []);

const buildCurlRequest = (origin, apiKey, payload) =>
  [
    `curl ${origin}/v1/chat/completions \\`,
    '  -H "Content-Type: application/json" \\',
    `  -H "Authorization: Bearer ${apiKey}" \\`,
    `  -d ${payload}`,
  ].join('\n');

const shellSingleQuote = (value) =>
  `'${String(value).replace(/'/g, `'"'"'`)}'`;

const copyRequestText = async (text, allowDomFallback) => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    if (!allowDomFallback) {
      return false;
    }
  }

  return allowDomFallback ? copy(text) : false;
};

const selectFirstPricingModel = (models) => {
  const sortedModels = models
    .filter((model) => model?.model_name)
    .sort((a, b) => {
      const aName = a.model_name;
      const bName = b.model_name;
      const aIsGpt = aName.startsWith('gpt');
      const bIsGpt = bName.startsWith('gpt');

      if (aIsGpt !== bIsGpt) {
        return aIsGpt ? -1 : 1;
      }

      return aName.localeCompare(bName);
    });

  return sortedModels[0]?.model_name || FALLBACK_MODEL;
};

const selectActiveToken = (tokens) => {
  const activeTokens = tokens.filter((token) => token?.status === 1);
  return activeTokens[0] || null;
};

const getTokenKeySuffix = (tokenKey = '') => {
  const visibleChars = String(tokenKey).replace(/[*•]/g, '');
  return visibleChars.length >= 2 ? visibleChars.slice(-2) : '';
};

const formatRedactedApiKey = (suffix) =>
  suffix ? `sk-••••••${suffix}` : REDACTED_API_KEY;

const getStoredCollapsed = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

const setStoredCollapsed = (value) => {
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // Local storage may be unavailable; keep the banner functional.
  }
};

const guideSteps = [
  {
    title: '创建 API 密钥',
    description: '为你的应用或服务创建密钥',
    path: '/console/token',
  },
  {
    title: '添加额度',
    description: '生产流量前保持充足余额',
    path: '/console/topup',
  },
  {
    title: '发送请求',
    description: '使用操练场或客户端验证路由',
    path: '/console/playground',
  },
];

const quickActions = [
  {
    icon: Play,
    title: '操练场',
    description: '测试模型和提示词',
    path: '/console/playground',
  },
  {
    icon: ReceiptText,
    title: '使用日志',
    description: '查看请求和计费',
    path: '/console/log',
  },
  {
    icon: Landmark,
    title: '模型广场',
    description: '查看模型费率',
    path: '/pricing',
  },
];

const DashboardGuideBanner = ({ t }) => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(getStoredCollapsed);
  const [tokenMeta, setTokenMeta] = useState(null);
  const [modelName, setModelName] = useState(FALLBACK_MODEL);
  const guideRegionId = 'dashboard-guide-banner-content';

  useEffect(() => {
    if (collapsed) {
      return undefined;
    }

    let active = true;

    const loadGuideData = async () => {
      try {
        const [tokenRes, pricingRes] = await Promise.allSettled([
          API.get('/api/token/?p=1&size=1'),
          API.get('/api/pricing'),
        ]);

        if (!active) return;

        let selectedToken = null;
        if (tokenRes.status === 'fulfilled') {
          const { success, data } = tokenRes.value.data || {};
          if (success) {
            const tokenItems = getTokenItems(data);
            const firstToken = tokenItems[0];
            const total = Number(data?.total || tokenItems.length || 0);
            const oldestToken = total > 1 ? await (async () => {
              try {
                const oldestTokenRes = await API.get(`/api/token/?p=${total}&size=1`);
                const oldestData = oldestTokenRes.data?.data;
                return getTokenItems(oldestData)[0] || null;
              } catch {
                return null;
              }
            })() : firstToken;

            if (oldestToken?.status === 1) {
              selectedToken = oldestToken;
            } else {
              const fallbackRes = await API.get('/api/token/?p=1&size=20');
              const fallbackData = fallbackRes.data?.data;
              const fallbackTokens = getTokenItems(fallbackData);
              selectedToken = selectActiveToken(fallbackTokens);
            }
            if (!active) return;

            setTokenMeta(
              selectedToken
                ? {
                  id: selectedToken.id,
                  name: selectedToken.name || '',
                  keySuffix: getTokenKeySuffix(selectedToken.key),
                }
              : null,
            );
          }
        }

        if (pricingRes.status === 'fulfilled') {
          const { success, data } = pricingRes.value.data || {};
          if (success) {
            const models = Array.isArray(data) ? data : [];
            setModelName(selectFirstPricingModel(models));
          }
        }
      } catch {
        // Keep the guide usable when optional metadata requests fail.
      }
    };

    loadGuideData();

    return () => {
      active = false;
    };
  }, [collapsed]);

  const toggleCollapsed = () => {
    const nextCollapsed = !collapsed;
    setCollapsed(nextCollapsed);
    setStoredCollapsed(nextCollapsed);
  };

  const requestPayload = useMemo(
    () =>
      JSON.stringify({
        model: modelName,
        messages: [
          {
            role: 'user',
            content: 'Say hello in one sentence.',
          },
        ],
      }),
    [modelName],
  );

  const requestPreview = useMemo(
    () =>
      buildCurlRequest(
        window.location.origin,
        formatRedactedApiKey(tokenMeta?.keySuffix),
        shellSingleQuote(requestPayload),
      ),
    [requestPayload, tokenMeta?.keySuffix],
  );

  const handleCopyRequest = async () => {
    let apiKey = REDACTED_API_KEY;
    if (tokenMeta?.id) {
      try {
        const fullKey = await fetchTokenKey(tokenMeta.id);
        if (fullKey) {
          apiKey = `sk-${fullKey}`;
        }
      } catch {
        // Keep the copied request redacted if the full key is unavailable.
      }
    }

    const copyText = buildCurlRequest(
      window.location.origin,
      apiKey,
      shellSingleQuote(requestPayload),
    );
    const copied = await copyRequestText(copyText, apiKey === REDACTED_API_KEY);
    if (copied) {
      Toast.success({ content: t('已复制首个 API 请求') });
    } else {
      Toast.error({ content: t('复制失败，请手动复制') });
    }
  };

  return (
    <div className='mb-4 w-full flex justify-start'>
      <Card
        bordered
        className='overflow-hidden !rounded-2xl shadow-sm'
        style={{ width: '100%' }}
        bodyStyle={{ padding: collapsed ? 12 : 14 }}
      >
        <div className='flex flex-col gap-3'>
          <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
            <div className='flex min-w-0 items-center gap-3'>
              <div className='min-w-0'>
                <div className='flex flex-wrap items-center gap-2'>
                  <h3 className='m-0 text-sm font-semibold text-[var(--semi-color-text-0)]'>
                    {collapsed ? t('设置引导') : t('几分钟内开始使用你的 API 网关')}
                  </h3>
                  <Tag color='green' size='small'>
                    {t('快速入口')}
                  </Tag>
                </div>
                <p className='m-0 mt-1 text-xs text-[var(--semi-color-text-2)]'>
                  {collapsed
                    ? t('常用操作和首个 API 请求。')
                    : t('集中展示密钥、余额、路由和服务健康状态。')}
                </p>
              </div>
            </div>

            <div className='flex flex-wrap items-center gap-2'>
              {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={action.title}
                      theme='light'
                      type='tertiary'
                      icon={<Icon size={14} />}
                      onClick={() => navigate(action.path)}
                      className='!rounded-lg'
                    >
                      {t(action.title)}
                    </Button>
                  );
                })}
              <Button
                aria-controls={guideRegionId}
                aria-expanded={!collapsed}
                theme='light'
                type='tertiary'
                icon={collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                onClick={toggleCollapsed}
                className='!rounded-lg'
              >
                {collapsed ? t('显示设置引导') : t('隐藏设置引导')}
              </Button>
            </div>
          </div>

          {!collapsed && (
            <div id={guideRegionId} className='grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)_300px]'>
              <div className='rounded-xl border border-[var(--semi-color-border)] bg-[var(--semi-color-fill-0)] p-3'>
                <div className='mb-2 flex items-center gap-2 text-xs font-semibold text-[var(--semi-color-text-1)]'>
                  <span className='flex h-4 w-4 items-center justify-center rounded-full bg-[var(--semi-color-success-light-default)] text-[var(--semi-color-success)]'>
                    <Check size={11} strokeWidth={3} />
                  </span>
                  {t('设置步骤')}
                </div>
                <div className='relative space-y-2 pl-2'>
                  <div className='absolute bottom-5 left-[19px] top-5 w-px bg-[var(--semi-color-border)]' />
                  {guideSteps.map((step, index) => {
                    return (
                      <div key={step.title} className='relative flex items-stretch gap-3'>
                        <div className='relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--semi-color-success-light-active)] bg-[var(--semi-color-success-light-default)] text-[var(--semi-color-success)]'>
                          <Check size={17} strokeWidth={3} />
                        </div>
                        <button
                          type='button'
                          onClick={() => navigate(step.path)}
                          className='flex min-h-[56px] flex-1 items-center justify-between rounded-xl border border-[var(--semi-color-border)] bg-[var(--semi-color-bg-0)] px-3 py-2 text-left transition hover:border-[var(--semi-color-success-light-active)] hover:bg-[var(--semi-color-fill-0)]'
                        >
                          <span className='min-w-0 pr-3'>
                            <span className='block text-xs font-semibold text-[var(--semi-color-text-0)]'>
                              {index + 1}. {t(step.title)}
                            </span>
                            <span className='block truncate text-[11px] text-[var(--semi-color-text-2)]'>
                              {t(step.description)}
                            </span>
                          </span>
                          <span className='text-[var(--semi-color-text-3)]'>→</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className='rounded-xl border border-[var(--semi-color-border)] bg-[var(--semi-color-fill-0)] p-3'>
                <div className='mb-2 flex items-center justify-between gap-2'>
                  <div className='flex items-center gap-2 text-xs font-semibold text-[var(--semi-color-text-1)]'>
                    <Send size={14} />
                    {t('首个 API 请求')}
                    {tokenMeta?.name && (
                      <span className='font-normal text-[var(--semi-color-text-2)]'>
                        {tokenMeta.name}
                      </span>
                    )}
                  </div>
                  <Button
                    size='small'
                    theme='light'
                    type='tertiary'
                    icon={<Copy size={13} />}
                    onClick={handleCopyRequest}
                    className='!rounded-lg'
                  >
                    {t('复制请求')}
                  </Button>
                </div>

                <div className='overflow-hidden rounded-xl border border-[var(--semi-color-border)] bg-[#111214]'>
                  <div className='flex items-center gap-1.5 border-b border-white/5 px-3 py-2'>
                    <span className='h-2 w-2 rounded-full bg-[#ff5f57]' />
                    <span className='h-2 w-2 rounded-full bg-[#ffbd2e]' />
                    <span className='h-2 w-2 rounded-full bg-[#28c840]' />
                  </div>
                  <pre className='m-0 max-h-[130px] overflow-auto whitespace-pre-wrap break-words px-3 py-3 font-mono text-[11px] leading-5 text-[#c9ccd1]'>
                    {requestPreview}
                  </pre>
                </div>

                <div className='mt-2 space-y-1 text-xs text-[var(--semi-color-text-2)]'>
                  <div>
                    {t('模型')}: {modelName}
                  </div>
                  <div className='truncate'>
                    {t('地址')}: {window.location.origin}/v1/chat/completions
                  </div>
                </div>

              </div>

              <div className='rounded-xl border border-[var(--semi-color-border)] bg-[var(--semi-color-fill-0)] p-3'>
                <div className='mb-2 flex items-center gap-2 text-xs font-semibold text-[var(--semi-color-text-1)]'>
                  <Landmark size={14} />
                  {t('推荐操作')}
                </div>
                <div className='space-y-2'>
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.title}
                        type='button'
                        onClick={() => navigate(action.path)}
                        className='flex w-full items-center gap-2 rounded-lg border border-[var(--semi-color-border)] bg-[var(--semi-color-bg-0)] px-2.5 py-2 text-left transition hover:bg-[var(--semi-color-fill-0)]'
                      >
                        <span className='flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--semi-color-fill-0)] text-[var(--semi-color-text-1)]'>
                          <Icon size={13} />
                        </span>
                        <span className='min-w-0'>
                          <span className='block text-xs font-medium text-[var(--semi-color-text-0)]'>
                            {t(action.title)}
                          </span>
                          <span className='block truncate text-[11px] text-[var(--semi-color-text-2)]'>
                            {t(action.description)}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>

              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default DashboardGuideBanner;
