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
import { SideSheet, Typography, Button, Tabs } from '@douyinfe/semi-ui';
import { IconClose } from '@douyinfe/semi-icons';
import { Code2, HeartPulse, Info } from 'lucide-react';

import { useIsMobile } from '../../../../hooks/common/useIsMobile';
import ModelHeader from './components/ModelHeader';
import ModelPricingTable from './components/ModelPricingTable';
import ModelOverviewCards from './components/ModelOverviewCards';
import ModelEndpoints from './components/ModelEndpoints';
import ModelPerformancePanel from '../performance/ModelPerformancePanel';

const { Text } = Typography;

const ModelDetailSideSheet = ({
  visible,
  onClose,
  modelData,
  groupRatio,
  currency,
  siteDisplayType,
  tokenUnit,
  displayPrice,
  showRatio,
  usableGroup,
  vendorsMap,
  endpointMap,
  autoGroups,
  t,
}) => {
  const isMobile = useIsMobile();

  return (
    <SideSheet
      placement='right'
      className='model-detail-sidesheet'
      title={
        <ModelHeader modelData={modelData} vendorsMap={vendorsMap} t={t} />
      }
      bodyStyle={{
        padding: '0',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderBottom: '1px solid rgba(255,255,255,0.16)',
        background: 'rgb(48, 50, 56)',
      }}
      visible={visible}
      width={isMobile ? '100%' : 980}
      closeIcon={
        <Button
          className='semi-button-tertiary semi-button-size-small semi-button-borderless'
          type='button'
          icon={<IconClose />}
          onClick={onClose}
        />
      }
      onCancel={onClose}
    >
      <div className='model-detail-scroll min-h-full bg-transparent px-3 py-3 sm:px-5 sm:py-4'>
        {!modelData && (
          <div className='flex justify-center items-center py-10'>
            <Text type='secondary'>{t('加载中...')}</Text>
          </div>
        )}
        {modelData && (
          <Tabs
            type='button'
            keepDOM={false}
            className='model-details-tabs'
          >
            <Tabs.TabPane
              tab={<span className='inline-flex items-center gap-1.5'><Info size={14} />{t('概览')}</span>}
              itemKey='overview'
            >
              <div className='space-y-5 pt-4'>
              <ModelOverviewCards
                modelData={modelData}
                endpointMap={endpointMap}
                usableGroup={usableGroup}
                t={t}
              />
              <ModelPricingTable
                modelData={modelData}
                groupRatio={groupRatio}
                currency={currency}
                siteDisplayType={siteDisplayType}
                tokenUnit={tokenUnit}
                displayPrice={displayPrice}
                showRatio={showRatio}
                usableGroup={usableGroup}
                autoGroups={autoGroups}
                t={t}
              />
              </div>
            </Tabs.TabPane>
            <Tabs.TabPane
              tab={<span className='inline-flex items-center gap-1.5'><HeartPulse size={14} />{t('性能')}</span>}
              itemKey='performance'
            >
              <div className='pt-4'>
              <ModelPerformancePanel
                modelData={modelData}
                usableGroup={usableGroup}
                t={t}
              />
              </div>
            </Tabs.TabPane>
            <Tabs.TabPane
              tab={<span className='inline-flex items-center gap-1.5'><Code2 size={14} />API</span>}
              itemKey='api'
            >
              <div className='pt-4'>
                <ModelEndpoints
                  modelData={modelData}
                  endpointMap={endpointMap}
                  t={t}
                />
              </div>
            </Tabs.TabPane>
          </Tabs>
        )}
      </div>
    </SideSheet>
  );
};

export default ModelDetailSideSheet;
