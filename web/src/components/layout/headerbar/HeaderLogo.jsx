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
import { Link } from 'react-router-dom';
import { Typography, Tag } from '@douyinfe/semi-ui';
import SkeletonWrapper from '../components/SkeletonWrapper';

const CatTerminalMark = ({ className = '' }) => (
  <svg
    viewBox='0 0 64 64'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    className={className}
    aria-hidden='true'
  >
    <g opacity='0.3'>
      <path d='M12 10H52' stroke='currentColor' strokeWidth='0.5' strokeDasharray='2 4' />
      <path d='M8 20H60' stroke='currentColor' strokeWidth='0.5' strokeDasharray='1 3' />
      <path d='M8 44H60' stroke='currentColor' strokeWidth='0.5' strokeDasharray='1 3' />
      <path d='M12 54H52' stroke='currentColor' strokeWidth='0.5' strokeDasharray='2 4' />
    </g>
    <rect x='11' y='15' width='42' height='34' rx='5' stroke='currentColor' strokeWidth='1' opacity='0.2' />
    <rect x='12' y='16' width='40' height='32' rx='4' stroke='currentColor' strokeWidth='2' />
    <rect x='14' y='18' width='36' height='28' rx='2' fill='currentColor' opacity='0.03' />
    <path d='M18 16L22 6L26 16' stroke='currentColor' strokeWidth='2' strokeLinejoin='round' />
    <circle cx='22' cy='12' r='1.5' fill='currentColor' opacity='0.8' />
    <path d='M38 16L42 6L46 16' stroke='currentColor' strokeWidth='2' strokeLinejoin='round' />
    <circle cx='42' cy='12' r='1.5' fill='currentColor' opacity='0.8' />
    <path d='M20 26L26 32L20 38' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' />
    <rect x='30' y='36' width='10' height='2.5' rx='1' fill='currentColor' />
    <circle cx='17.5' cy='21.5' r='1.5' fill='currentColor' opacity='0.4' />
    <circle cx='23.5' cy='21.5' r='1.5' fill='currentColor' opacity='0.4' />
    <circle cx='29.5' cy='21.5' r='1.5' fill='currentColor' opacity='0.4' />
  </svg>
);

const HeaderLogo = ({
  isMobile,
  isConsoleRoute,
  logo,
  logoLoaded,
  isLoading,
  systemName,
  isSelfUseMode,
  isDemoSiteMode,
  t,
}) => {
  if (isMobile && isConsoleRoute) {
    return null;
  }

  return (
    <Link to='/' className='group flex items-center gap-2'>
      <div className='relative w-8 h-8 md:w-8 md:h-8'>
        <SkeletonWrapper loading={isLoading || !logoLoaded} type='image' />
        <div className={`site-mark-icon absolute inset-0 w-full h-full transition-all duration-200 group-hover:scale-110 rounded-full flex items-center justify-center ${!isLoading && logoLoaded ? 'opacity-100' : 'opacity-0'}`}>
          <CatTerminalMark className='w-full h-full text-current' />
        </div>
      </div>
      <div className='hidden md:flex items-center gap-2'>
        <div className='flex items-center gap-2'>
          <SkeletonWrapper
            loading={isLoading}
            type='title'
            width={120}
            height={24}
          >
            <Typography.Title
              heading={4}
              className='!text-lg !font-semibold !mb-0'
            >
              Moyuu AI
            </Typography.Title>
          </SkeletonWrapper>
          {(isSelfUseMode || isDemoSiteMode) && !isLoading && (
            <Tag
              color={isSelfUseMode ? 'purple' : 'blue'}
              className='text-xs px-1.5 py-0.5 rounded whitespace-nowrap shadow-sm'
              size='small'
              shape='circle'
            >
              {isSelfUseMode ? t('自用模式') : t('演示站点')}
            </Tag>
          )}
        </div>
      </div>
    </Link>
  );
};

export default HeaderLogo;
