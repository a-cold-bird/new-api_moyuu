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

export const CodeTerminal = ({ serverAddress }) => {
  return (
    <div className='relative z-10 w-full rounded-2xl overflow-hidden bg-[#0c0c0e] border border-white/5 shadow-2xl' style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
      {/* Mac-like Window Header */}
      <div className='flex items-center justify-between px-4 py-3 bg-[#111114] border-b border-white/5'>
        <div className='flex gap-1.5'>
          <div className='w-3 h-3 rounded-full bg-[#ff5f56]'></div>
          <div className='w-3 h-3 rounded-full bg-[#ffbd2e]'></div>
          <div className='w-3 h-3 rounded-full bg-[#27c93f]'></div>
        </div>
        <div className='text-[10px] font-semibold tracking-[0.2em] text-[#555] uppercase'>CODEX TERMINAL</div>
        <div className='flex gap-1 opacity-30'>
          <div className='w-1.5 h-1.5 rounded-sm bg-white'></div>
          <div className='w-1.5 h-1.5 rounded-sm ring-1 ring-white/50'></div>
        </div>
      </div>

      {/* Terminal Content Body */}
      <div className='relative p-6 sm:p-8 overflow-hidden min-h-[240px] flex flex-col justify-center'>
        {/* Codex Config View */}
        <div className='text-[#666] mb-4 text-[13px] sm:text-[14px]'>// 1秒配置 Codex</div>
        
          <div className='flex items-center text-[13px] sm:text-[14px] leading-relaxed mb-3 overflow-x-auto whitespace-nowrap'>
            <span className='text-[#c678dd] mr-2'>export</span>
            <span className='text-[#e5c07b] mr-2'>OPENAI_BASE_URL</span>
            <span className='text-[#56b6c2] mr-2'>=</span>
            <span className='text-[#98c379]'>&quot;{serverAddress}/v1&quot;</span>
          </div>

        <div className='flex items-center text-[13px] sm:text-[14px] leading-relaxed mb-8 overflow-x-auto whitespace-nowrap'>
          <span className='text-[#c678dd] mr-2'>export</span>
          <span className='text-[#e5c07b] mr-2'>OPENAI_API_KEY</span>
          <span className='text-[#56b6c2] mr-2'>=</span>
          <span className='text-[#98c379]'>&quot;sk-xxxxxx&quot;</span>
        </div>

        <div className='text-[#666] mb-4 text-[13px] sm:text-[14px]'>// 模型推荐 gpt-5.4</div>
        <div className='flex items-center text-[14px] sm:text-[15px] leading-relaxed'>
          <span className='text-white font-bold mr-3'>$</span>
          <span className='text-[#61afef] font-semibold'>codex</span>
          <span className='w-2 h-[15px] bg-white/70 ml-2 animate-pulse'></span>
        </div>
      </div>
    </div>
  );
};
