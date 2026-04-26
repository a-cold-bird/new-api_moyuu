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
    <div className='relative z-10 w-full rounded-2xl overflow-hidden border shadow-2xl' style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", background: "var(--semi-color-bg-1)", borderColor: "var(--semi-color-border)" }}>
      {/* Mac-like Window Header */}
      <div className='flex items-center justify-between px-4 py-3' style={{ background: "var(--semi-color-bg-2)", borderBottom: "1px solid var(--semi-color-border)" }}>
        <div className='flex gap-1.5'>
          <div className='w-3 h-3 rounded-full bg-[#ff5f56]'></div>
          <div className='w-3 h-3 rounded-full bg-[#ffbd2e]'></div>
          <div className='w-3 h-3 rounded-full bg-[#27c93f]'></div>
        </div>
        <div className='text-[10px] font-semibold tracking-[0.2em] uppercase' style={{ color: "var(--semi-color-text-2)" }}>CODEX TERMINAL</div>
        <div className='flex gap-1 opacity-30'>
          <div className='w-1.5 h-1.5 rounded-sm' style={{ background: "var(--semi-color-text-0)" }}></div>
          <div className='w-1.5 h-1.5 rounded-sm' style={{ boxShadow: "inset 0 0 0 1px var(--semi-color-text-2)" }}></div>
        </div>
      </div>

      {/* Terminal Content Body */}
      <div className='relative p-6 sm:p-8 overflow-hidden min-h-[240px] flex flex-col justify-center'>
        <div className='mb-4 text-[13px] sm:text-[14px]' style={{ color: "var(--semi-color-text-2)" }}>// 1秒配置 Codex</div>

          <div className='flex items-center text-[13px] sm:text-[14px] leading-relaxed mb-3 overflow-x-auto whitespace-nowrap'>
            <span className='mr-2' style={{ color: "#c678dd" }}>export</span>
            <span className='mr-2' style={{ color: "var(--semi-color-warning)" }}>OPENAI_BASE_URL</span>
            <span className='mr-2' style={{ color: "var(--semi-color-tertiary)" }}>=</span>
            <span style={{ color: "var(--semi-color-success)" }}>&quot;{serverAddress}/v1&quot;</span>
          </div>

        <div className='flex items-center text-[13px] sm:text-[14px] leading-relaxed mb-8 overflow-x-auto whitespace-nowrap'>
          <span className='mr-2' style={{ color: "#c678dd" }}>export</span>
          <span className='mr-2' style={{ color: "var(--semi-color-warning)" }}>OPENAI_API_KEY</span>
          <span className='mr-2' style={{ color: "var(--semi-color-tertiary)" }}>=</span>
          <span style={{ color: "var(--semi-color-success)" }}>&quot;sk-xxxxxx&quot;</span>
        </div>

        <div className='mb-4 text-[13px] sm:text-[14px]' style={{ color: "var(--semi-color-text-2)" }}>// 模型推荐 gpt-5.4</div>
        <div className='flex items-center text-[14px] sm:text-[15px] leading-relaxed'>
          <span className='font-bold mr-3' style={{ color: "var(--semi-color-text-0)" }}>$</span>
          <span className='font-semibold' style={{ color: "var(--semi-color-link)" }}>codex</span>
          <span className='w-2 h-[15px] ml-2 animate-pulse' style={{ background: "var(--semi-color-text-0)", opacity: 0.7 }}></span>
        </div>
      </div>
    </div>
  );
};
