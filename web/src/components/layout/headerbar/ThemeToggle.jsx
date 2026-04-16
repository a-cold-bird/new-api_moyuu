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
import { flushSync } from 'react-dom';
import { useActualTheme } from '../../../context/Theme';

const ThemeToggle = ({ theme, onThemeToggle, t }) => {
  const actualTheme = useActualTheme();
  const isDark = actualTheme === 'dark';

  const handleToggle = () => {
    const next = isDark ? 'light' : 'dark';

    if (!document.startViewTransition) {
      onThemeToggle(next);
      return;
    }

    document.startViewTransition(() => {
      flushSync(() => {
        onThemeToggle(next);
      });
    });
  };

  return (
    <button
      type='button'
      aria-label={isDark ? t('切换到浅色模式') : t('切换到深色模式')}
      className={`theme-toggle-switch ${isDark ? 'dark' : 'light'}`}
      onClick={handleToggle}
    >
      <div className='theme-toggle-handle'>
        <div className='crater crater-1' />
        <div className='crater crater-2' />
        <div className='crater crater-3' />
      </div>
      <div className='theme-toggle-clouds'>
        <div className='cloud cloud-1' />
        <div className='cloud cloud-2' />
        <div className='cloud cloud-3' />
      </div>
      <div className='theme-toggle-stars'>
        <div className='star star-1' />
        <div className='star star-2' />
        <div className='star star-3' />
        <div className='star star-4' />
      </div>
    </button>
  );
};

export default ThemeToggle;
