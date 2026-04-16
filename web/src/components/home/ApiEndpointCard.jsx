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
import { API_ENDPOINTS } from '../../constants/common.constant';
import { copy } from '../../helpers';

export function ApiEndpointCard({ serverAddress }) {
  const [copied, setCopied] = useState(false);
  const [pathIndex, setPathIndex] = useState(0);

  const paths = useMemo(
    () => {
      // Force a clean array of standard endpoints for the rolling effect
      return [
        '/v1/chat/completions',
        '/v1/models',
        '/v1/embeddings',
        '/v1/images/generations',
        '/v1/audio/transcriptions',
      ];
    },
    [],
  );

  const [isTransitioning, setIsTransitioning] = useState(true);

  useEffect(() => {
    if (paths.length < 2) return undefined;
    const interval = window.setInterval(() => {
      setPathIndex((prev) => {
        if (prev === paths.length) {
          // Instantly reset to 0 without transition
          setIsTransitioning(false);
          setTimeout(() => {
            setIsTransitioning(true);
            setPathIndex(1);
          }, 50);
          return 0;
        }
        return prev + 1;
      });
    }, 2000);
    return () => window.clearInterval(interval);
  }, [paths]);

    const handleCopy = async () => {
    try {
      const ok = await copy(serverAddress);
      if (ok) {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      }
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className='home-endpoint-card'>
      <div className='home-endpoint-caption'>替换基础 URL 即可接入</div>
      <div className='home-endpoint-input' style={{ display: 'inline-flex', width: 'fit-content' }}>
        <span className='home-endpoint-base'><span>{serverAddress}</span></span>
        <div className='home-endpoint-path-window' aria-live='polite'>
          <div
            className='home-endpoint-path-track'
            style={{ 
              transform: `translateY(-${pathIndex * 1.6}rem)`,
              transition: isTransitioning ? 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1)' : 'none'
            }}
          >
            {[...paths, paths[0]].map((path, idx) => (
              <span key={`${path}-${idx}`} className='home-endpoint-path-row'>
                {path}
              </span>
            ))}
          </div>
        </div>
        <button
          type='button'
          onClick={handleCopy}
          className='home-endpoint-copy-btn'
          aria-label='复制基础地址'
        >
          {copied ? 'OK' : '⧉'}
        </button>
      </div>
    </div>
  );
}
