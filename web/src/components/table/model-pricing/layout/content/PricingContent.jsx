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
import PricingTopSection from '../header/PricingTopSection';
import PricingView from './PricingView';

const PricingContent = ({ isMobile, sidebarProps, ...props }) => {
  return (
    <div
      className={isMobile ? 'pricing-content-mobile' : 'pricing-scroll-hide'}
    >
      {/* 供应商介绍、吸顶搜索栏和模型列表在同一个滚动容器内。 */}
      <div
        className={
          isMobile ? 'pricing-view-container-mobile' : 'pricing-view-container'
        }
      >
        <PricingTopSection
          {...props}
          isMobile={isMobile}
          sidebarProps={sidebarProps}
          showWithRecharge={sidebarProps.showWithRecharge}
          setShowWithRecharge={sidebarProps.setShowWithRecharge}
          currency={sidebarProps.currency}
          setCurrency={sidebarProps.setCurrency}
          showRatio={sidebarProps.showRatio}
          setShowRatio={sidebarProps.setShowRatio}
          viewMode={sidebarProps.viewMode}
          setViewMode={sidebarProps.setViewMode}
          tokenUnit={sidebarProps.tokenUnit}
          setTokenUnit={sidebarProps.setTokenUnit}
        />
        <PricingView {...props} viewMode={sidebarProps.viewMode} />
      </div>
    </div>
  );
};

export default PricingContent;
