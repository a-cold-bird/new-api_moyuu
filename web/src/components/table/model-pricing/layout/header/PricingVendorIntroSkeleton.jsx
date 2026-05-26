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

import React, { memo } from 'react';
import { Card, Skeleton } from '@douyinfe/semi-ui';

const THEME_COLORS = {
  neutral: {
    background: 'color-mix(in srgb, var(--semi-color-fill-0) 70%, transparent)',
    border: 'color-mix(in srgb, var(--semi-color-border) 70%, transparent)',
  },
};

const SIZES = {
  eyebrow: { width: 130, height: 10 },
  title: { width: { all: 180, specific: 150 }, height: 34 },
  tag: { width: 80, height: 20 },
  description: { height: 12 },
  searchInput: { height: 40 },
  button: { width: 80, height: 36 },
};

const SKELETON_STYLES = {
  cover: {
    background: [
      'radial-gradient(ellipse 60% 50% at 20% 20%, color-mix(in srgb, var(--semi-color-primary) 12%, transparent) 0%, transparent 70%)',
      'radial-gradient(ellipse 50% 40% at 80% 15%, color-mix(in srgb, var(--semi-color-fill-2) 34%, transparent) 0%, transparent 70%)',
      'linear-gradient(180deg, color-mix(in srgb, var(--semi-color-bg-0) 96%, transparent), color-mix(in srgb, var(--semi-color-bg-1) 92%, transparent))',
    ].join(', '),
  },
  title: {
    backgroundColor: 'var(--semi-color-fill-1)',
    borderRadius: 8,
  },
  tag: {
    backgroundColor: 'var(--semi-color-fill-0)',
    borderRadius: 9999,
    border: '1px solid var(--semi-color-border)',
  },
  description: {
    backgroundColor: 'var(--semi-color-fill-1)',
    borderRadius: 4,
  },
  searchInput: {
    backgroundColor: THEME_COLORS.neutral.background,
    borderRadius: 8,
    border: `1px solid ${THEME_COLORS.neutral.border}`,
  },
  button: {
    backgroundColor: THEME_COLORS.neutral.background,
    borderRadius: 8,
    border: `1px solid ${THEME_COLORS.neutral.border}`,
  },
};

const createSkeletonRect = (style = {}, key = null) => (
  <div key={key} className='animate-pulse' style={style} />
);

const PricingVendorIntroSkeleton = memo(
  ({ isMobile = false }) => {
    const placeholder = (
        <Card
          className='!rounded-2xl shadow-none border border-gray-100 overflow-hidden'
          cover={
            <div
            className='relative h-full min-h-[118px] bg-[var(--semi-color-bg-0)]'
            style={SKELETON_STYLES.cover}
          >
            <div className='relative z-10 h-full flex flex-col items-center justify-center px-5 py-4 text-center'>
              <div className='min-w-0'>
                {createSkeletonRect(
                  {
                    ...SKELETON_STYLES.description,
                    width: SIZES.eyebrow.width,
                    height: SIZES.eyebrow.height,
                    margin: '0 auto 8px',
                  },
                  'eyebrow',
                )}
                <div className='flex flex-row flex-wrap items-center justify-center gap-2 sm:gap-3 mb-2'>
                  {createSkeletonRect(
                    {
                      ...SKELETON_STYLES.title,
                      width: SIZES.title.width.all,
                      height: SIZES.title.height,
                    },
                    'title',
                  )}
                  {createSkeletonRect(
                    {
                      ...SKELETON_STYLES.tag,
                      width: SIZES.tag.width,
                      height: SIZES.tag.height,
                    },
                    'tag',
                  )}
                </div>
                <div className='space-y-2'>
                  {createSkeletonRect(
                    {
                      ...SKELETON_STYLES.description,
                      width: 360,
                      maxWidth: '70vw',
                      height: SIZES.description.height,
                      margin: '0 auto',
                    },
                    'desc1',
                  )}
                </div>
              </div>
            </div>
          </div>
        }
      />
    );

    return (
      <Skeleton loading={true} active placeholder={placeholder}></Skeleton>
    );
  },
);

PricingVendorIntroSkeleton.displayName = 'PricingVendorIntroSkeleton';

export default PricingVendorIntroSkeleton;
