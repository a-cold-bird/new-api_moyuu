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

import React, { useContext, useEffect, useRef, useState } from 'react';
import { API, showError } from '../../helpers';
import { useIsMobile } from '../../hooks/common/useIsMobile';
import { StatusContext } from '../../context/Status';
import { useActualTheme } from '../../context/Theme';
import { marked } from 'marked';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import NoticeModal from '../../components/layout/NoticeModal';
import { InteractiveHero } from '../../components/home/InteractiveHero';
import { ApiEndpointCard } from '../../components/home/ApiEndpointCard';
import { ScrollStage } from '../../components/home/ScrollStage';
import { LogoTile } from '../../components/home/LogoTile';
import { CodeTerminal } from './CodeTerminal';
import './home-moeyuu.css';

const RollingDigit = ({ digit, prevDigit }) => {
  const changed = digit !== prevDigit;
  return (
    <span
      className="rolling-digit-wrap"
      key={changed ? digit + '-' + Date.now() : undefined}
    >
      <span className={changed ? 'rolling-digit rolling-digit-animate' : 'rolling-digit'}>
        {digit}
      </span>
    </span>
  );
};

const RollingNumber = ({ value, suffix = '', compact = false }) => {
  const prevRef = useRef('');
  let display;
  if (compact && value >= 1000000000) {
    display = (value / 1000000000).toFixed(2) + 'B';
  } else if (compact && value >= 1000000) {
    display = (value / 1000000).toFixed(1) + 'M';
  } else {
    display = value.toLocaleString();
  }
  const current = display + suffix;
  const prev = prevRef.current || current;

  useEffect(() => {
    prevRef.current = current;
  }, [current]);

  const maxLen = Math.max(current.length, prev.length);
  const padCurrent = current.padStart(maxLen);
  const padPrev = prev.padStart(maxLen);

  return (
    <span className="rolling-number" style={{ fontVariantNumeric: 'tabular-nums' }}>
      {padCurrent.split('').map((ch, i) => {
        const isDigit = /\d/.test(ch);
        if (!isDigit) return <span key={i}>{ch}</span>;
        return <RollingDigit key={i} digit={ch} prevDigit={padPrev[i]} />;
      })}
    </span>
  );
};

import {
  Claude,
  Gemini,
  DeepSeek,
  Minimax,
  Qwen,
  Zhipu,
  Meta,
  XAI,
  Moonshot,
  Anthropic,
  OpenAI,
  HuggingFace,
  Mistral,
  OpenRouter,
  Perplexity,
  Cohere,
  Groq,
  DeepMind,
  Cursor,
  Cline,
  Dify,
  FastGPT,
  OpenWebUI,
  Ollama
} from '@lobehub/icons';

const featureCards = [
  {
    index: '01',
    title: '无需魔法，极速直连',
    description:
      '抛弃复杂的代理环境与网络配置。只需在国内普通网络环境下发起请求，即可低延迟直通全球顶尖大语言模型。',
  },
  {
    index: '02',
    title: '极致的调用性价比',
    description:
      '通过集中采买与企业级额度调优，我们能将研发成本极大地分摊，为您提供远低于官方标准定价的实惠调用费率。',
  },
  {
    index: '03',
    title: '专有团队维护跟进',
    description:
      '7×24 小时监控底层服务健康状态。一旦遇障我们会第一时间响应，并且社群内配备了技术指导，随问随答。',
  },
  {
    index: '04',
    title: '一站式全平台聚拢',
    description:
      '不管是 IDE 代码插件、终端 CLI 工具，还是第三方开源 Web 客户端，一个网关地址和密钥即可全链路打通。',
  },
];
const providerLogos = [
  { name: "Claude", badge: "Claude", icon: Claude },
  { name: "Gemini", badge: "Gemini", icon: Gemini },
  { name: "DeepSeek", badge: "DeepSeek", icon: DeepSeek },
  { name: "MiniMax", badge: "MiniMax", icon: Minimax },
  { name: "Qwen", badge: "Qwen", icon: Qwen },
  { name: "Zhipu / GLM", badge: "Zhipu", icon: Zhipu },
  { name: "Meta / Llama", badge: "Meta", icon: Meta },
  { name: "xAI / Grok", badge: "xAI", icon: XAI, invertLight: true },
  { name: "Moonshot", badge: "Moonshot", icon: Moonshot, invertLight: true },
  { name: "Anthropic", badge: "Anthropic", icon: Anthropic, invertLight: true },
  { name: "OpenAI", badge: "OpenAI", icon: OpenAI, invertLight: true },
  { name: "Hugging Face", badge: "HF", icon: HuggingFace },
  { name: "Mistral", badge: "Mistral", icon: Mistral },
  { name: "OpenRouter", badge: "OpenRouter", icon: OpenRouter, invertLight: true },
  { name: "Perplexity", badge: "Perplexity", icon: Perplexity, invertLight: true },
  { name: "Cohere", badge: "Cohere", icon: Cohere },
  { name: "Groq", badge: "Groq", icon: Groq, invertLight: true },
  { name: "DeepMind", badge: "DeepMind", icon: DeepMind },
  { name: "更多生态厂商", badge: "30+" },
];

const toolLogos = [
  { name: "Cursor", badge: "Cursor", src: "/ecosystem-logos/cursor.png", invertDark: true },
  { name: "Windsurf", badge: "Windsurf", src: "/ecosystem-logos/windsurf.svg" },
  { name: "Cline", badge: "Cline", src: "/ecosystem-logos/cline.png", invertDark: true },
  { name: "CherryStudio", badge: "CherryStudio", src: "/ecosystem-logos/cherrystudio.png" },
  { name: "Roo Code", badge: "Roo Code", src: "/ecosystem-logos/roocode.png", invertDark: true },
  { name: "Claude Code", badge: "Claude Code", src: "/ecosystem-logos/claudecode.png" },
  { name: "Dify", badge: "Dify", icon: Dify },
  { name: "FastGPT", badge: "FastGPT", icon: FastGPT },
  { name: "OpenWebUI", badge: "OpenWebUI", icon: OpenWebUI, invertLight: true },
  { name: "Ollama", badge: "Ollama", icon: Ollama, invertLight: true },
];
const supportLinks = [
  {
    title: "快速开始",
    description: "如果你想先快速了解整体接入方式，可以从这里开始浏览。",
    href: "/console",
  },
  {
    title: "充值与额度",
    description: "前往控制台查看您的账单、充值额度与消费明细。",
    href: "/console/topup",
  },
  {
    title: "帮助与支持",
    description: "当你需要查看更多说明、支持信息或排障入口时，可以从这里进入文档。",
    href: "docs",
  },
];
const Home = () => {
  const { t, i18n } = useTranslation();
  const [statusState] = useContext(StatusContext);
  const actualTheme = useActualTheme();
  const [homePageContentLoaded, setHomePageContentLoaded] = useState(false);
  const [homePageContent, setHomePageContent] = useState('');
  const [noticeVisible, setNoticeVisible] = useState(false);
  const isMobile = useIsMobile();
  const isDemoSiteMode = statusState?.status?.demo_site_enabled || false;
  const docsLink = statusState?.status?.docs_link || '';
  const serverAddress = 'https://moyuu.cc';
  const currentYear = new Date().getFullYear();
  const version = 'v1.0.0';
  const shellRef = useRef(null);
  const [siteStats, setSiteStats] = useState(() => {
    try {
      const cached = localStorage.getItem('site_stats_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {}
    return { total_users: 0, total_tokens: 0 };
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await API.get('/api/leaderboard/stats');
        if (res.data?.success && res.data?.data) {
          setSiteStats(res.data.data);
          try {
            localStorage.setItem('site_stats_cache', JSON.stringify(res.data.data));
          } catch {}
        }
      } catch {}
    };
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const displayHomePageContent = async () => {
    setHomePageContent(localStorage.getItem('home_page_content') || '');
    const res = await API.get('/api/home_page_content');
    const { success, message, data } = res.data;
    if (success) {
      let content = data;
      if (!data.startsWith('https://')) {
        content = marked.parse(data);
      }
      setHomePageContent(content);
      localStorage.setItem('home_page_content', content);

      // 如果内容是 URL，则发送主题模式
      if (data.startsWith('https://')) {
        const iframe = document.querySelector('iframe');
        if (iframe) {
          iframe.onload = () => {
            iframe.contentWindow.postMessage({ themeMode: actualTheme }, '*');
            iframe.contentWindow.postMessage({ lang: i18n.language }, '*');
          };
        }
      }
    } else {
      showError(message);
      setHomePageContent('加载首页内容失败...');
    }
    setHomePageContentLoaded(true);
  };

  useEffect(() => {
    const checkNoticeAndShow = async () => {
      const lastCloseDate = localStorage.getItem('notice_close_date');
      const today = new Date().toDateString();
      if (lastCloseDate !== today) {
        try {
          const res = await API.get('/api/notice');
          const { success, data } = res.data;
          if (success && data && data.trim() !== '') {
            setNoticeVisible(true);
          }
        } catch (error) {
          console.error('获取公告失败:', error);
        }
      }
    };

    checkNoticeAndShow();
  }, []);

  useEffect(() => {
    displayHomePageContent().then();
  }, []);

  useEffect(() => {
    if (isMobile) return;
    const shell = shellRef.current;
    if (!shell) return;

    const container = shell;
    let isScrolling = false;

    const onWheel = (e) => {
      if (Math.abs(e.deltaY) < 12) return;
      e.preventDefault();
      if (isScrolling) return;

      const direction = e.deltaY > 0 ? 1 : -1;
      const sections = Array.from(container.querySelectorAll('.home-page-panel'));
      if (!sections.length) return;

      const currentScroll = container.scrollTop;
      const currentIdx = sections.reduce(
        (bestIdx, section, idx) => {
          const bestDist = Math.abs(sections[bestIdx].offsetTop - currentScroll);
          const dist = Math.abs(section.offsetTop - currentScroll);
          return dist < bestDist ? idx : bestIdx;
        },
        0,
      );

      const nextIdx = Math.max(0, Math.min(currentIdx + direction, sections.length - 1));
      const boundedTarget = sections[nextIdx].offsetTop;

      if (boundedTarget !== currentScroll) {
        isScrolling = true;
        container.scrollTo({ top: boundedTarget, behavior: 'smooth' });
        window.setTimeout(() => {
          isScrolling = false;
        }, 700);
      }
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', onWheel);
    };
  }, [isMobile]);

  return (
    <div ref={shellRef} className='home-snap-shell w-full overflow-x-hidden animate-[fadeIn_0.5s_ease-out]'>
      <NoticeModal
        visible={noticeVisible}
        onClose={() => setNoticeVisible(false)}
        isMobile={isMobile}
      />
      {homePageContentLoaded && homePageContent === '' ? (
        <>
        <div className='w-full overflow-x-hidden'>
          <section className='home-page-panel home-page-panel-hero w-full'>
            <InteractiveHero>
              <div className="mx-auto grid min-h-[calc(100vh-56px)] w-full max-w-[1600px] items-center gap-8 px-4 pb-6 pt-8 sm:px-6 lg:grid-cols-[minmax(0,1.02fr)_minmax(340px,0.98fr)] lg:px-8 lg:pb-10 lg:pt-10">
                <div className="space-y-7 pt-2 lg:pt-4">
                  <div className="inline-flex rounded-full border border-semi-color-border bg-semi-color-fill-0 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-semi-color-text-2">统一接入文档</div>
                  <h1 className="home-gradient-text max-w-[820px] text-[44px] leading-[1.02] font-semibold tracking-[-0.05em] sm:text-[72px] text-balance mb-6 lg:mb-8">
                    摸鱼AI - 让 AI 编程接入更统一
                  </h1>
                  <p className="text-balance max-w-[680px] text-[17px] leading-relaxed text-semi-color-text-1 sm:text-[18px] md:text-lg mb-8 lg:mb-10">
                    面向 Claude Code、Codex、Gemini 与 OpenAI 兼容客户端的统一 AI 网关文档。把安装、接入、排障与业务入口收拢到一个更清晰的系统里。
                  </p>
                  <div className="flex flex-wrap gap-3 pt-3">
                    <Link to="/console" className="group relative inline-flex items-center justify-center overflow-hidden rounded-xl border border-transparent px-6 py-2.5 text-[14px] font-medium transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]" style={{ background: "var(--semi-color-text-0)", color: "var(--semi-color-bg-0)" }}>
                      <span className="relative z-10 flex items-center gap-2">{t('控制台')} <span className="transition-transform group-hover:translate-x-0.5">→</span></span>
                    </Link>
                    {docsLink && (
                      <a href={docsLink} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-xl border border-semi-color-border bg-semi-color-bg-1 px-5 py-2.5 text-[14px] font-medium text-semi-color-text-0 shadow-sm transition-all hover:bg-semi-color-fill-0 hover:shadow active:scale-[0.98]">
                        {t('文档')}
                      </a>
                    )}
                    {isDemoSiteMode && statusState?.status?.version && (
                      <a href="https://github.com/QuantumNous/new-api" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-xl border border-transparent bg-transparent px-5 py-2.5 text-[14px] font-medium text-semi-color-text-2 transition-colors hover:bg-semi-color-fill-0 hover:text-semi-color-text-0">
                        <span className="opacity-80">GitHub</span>
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-6 sm:gap-10 py-2">
                    <div className="flex flex-col">
                      <span className="text-2xl sm:text-3xl font-bold tracking-tight text-semi-color-text-0">
                        <RollingNumber value={siteStats.total_tokens} suffix="" compact />
                      </span>
                      <span className="text-[12px] text-semi-color-text-2 mt-0.5">Tokens Processed</span>
                    </div>
                    <div className="w-px h-8 bg-semi-color-border" />
                    <div className="flex flex-col">
                      <span className="text-2xl sm:text-3xl font-bold tracking-tight text-semi-color-text-0">
                        <RollingNumber value={siteStats.total_users} suffix="+" compact={false} />
                      </span>
                      <span className="text-[12px] text-semi-color-text-2 mt-0.5">Registered Users</span>
                    </div>
                  </div>

                  <div className="grid gap-3 text-[13px] text-semi-color-text-2 sm:grid-cols-3">
                    <div className="home-inline-metric"><span>OpenAI-compatible</span><strong className="text-semi-color-text-0">标准协议响应</strong></div>
                    <div className="home-inline-metric"><span>Anthropic / Gemini</span><strong className="text-semi-color-text-0">全局无缝调度</strong></div>
                    <div className="home-inline-metric"><span>Docs + Console</span><strong className="text-semi-color-text-0">现代丝滑工作流</strong></div>
                  </div>

                  <ApiEndpointCard serverAddress={serverAddress} />

                  <div className="pt-2 hidden lg:block">
                    <a href="#continue" className="home-scroll-cue">
                      <span className="home-scroll-cue-line" />
                      <span>向下滚动</span>
                    </a>
                  </div>
                </div>
                <div className="mt-8 lg:mt-0 lg:ml-auto w-full max-w-[580px] z-20 transition-transform duration-500 hover:-translate-y-1">
                  <CodeTerminal serverAddress={serverAddress} />
                </div>
              </div>
            </InteractiveHero>
          </section>

          <section className="home-page-panel home-page-panel-content">
            <ScrollStage className="mx-auto flex max-w-[1600px] items-center px-4 py-8 sm:px-6 lg:px-8 w-full">
              <section id="continue" className="home-page-stack w-full">
                <section className="home-continue-panel">
                  <div className="home-continue-intro">
                    <div className="home-continue-kicker">快速上手向导</div>
                    <h2>简单的配置，开启您的 AI 开发之旅。</h2>
                    <p className="text-balance">我们梳理了各类常见大模型工具的接入步骤，为您剔除冗余的环节。只需跟随下方的入口指引，几分钟内即可完成配置并开始调用。同时，详细的错误排障手册也已备好随时供您查阅。</p>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-3">
                    {supportLinks.map((item) => (
                      item.href === "docs" && docsLink ? (
                        <a key={item.title} href={docsLink} target="_blank" rel="noreferrer" className="home-continue-card group relative overflow-hidden border border-semi-color-border hover:border-blue-500/30 bg-semi-color-bg-0 hover:bg-semi-color-bg-1 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                          <div className="relative z-10 text-[11px] uppercase tracking-[0.12em] text-semi-color-text-2 transition-colors group-hover:text-blue-500">Quick Path</div>
                          <h3 className="mt-3 text-[20px] font-semibold tracking-[-0.03em] text-semi-color-text-0">{item.title}</h3>
                          <p className="mt-3 text-sm leading-7 text-semi-color-text-1 text-balance">{item.description}</p>
                        </a>
                      ) : (
                        <Link key={item.title} to={item.href} className="home-continue-card group relative overflow-hidden border border-semi-color-border hover:border-blue-500/30 bg-semi-color-bg-0 hover:bg-semi-color-bg-1 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                          <div className="relative z-10 text-[11px] uppercase tracking-[0.12em] text-semi-color-text-2 transition-colors group-hover:text-blue-500">Quick Path</div>
                          <h3 className="mt-3 text-[20px] font-semibold tracking-[-0.03em] text-semi-color-text-0">{item.title}</h3>
                          <p className="mt-3 text-sm leading-7 text-semi-color-text-1 text-balance">{item.description}</p>
                        </Link>
                      )
                    ))}
                  </div>
                </section>
              </section>
            </ScrollStage>
          </section>

          <section className="home-page-panel home-page-panel-content">
            <ScrollStage className="mx-auto flex max-w-[1600px] items-center px-4 py-8 sm:px-6 lg:px-8 w-full">
              <section className="home-reveal-section w-full">
                <div className="home-reveal-intro">
                  <div className="home-continue-kicker">中转服务与平台优势</div>
                  <h2 className="text-balance">什么是中转站？为您直连顶尖 AI 算力底座。</h2>
                  <p className="text-balance">中转站即您和目标服务商之间的一座桥梁。它统一了各种不兼容的模型 API 规范，降低了高频报错的门槛。不仅解决了网络阻断的问题，您更可以像使用官方 API 一样，安全、透明地集成各种强大的大模型。</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
                  {featureCards.map((card) => (
                    <article key={card.index} className="home-soft-card p-6 transition-colors hover:bg-semi-color-bg-1 group">
                      <div className="relative inline-flex h-12 w-12 items-center justify-center rounded-xl border border-semi-color-border bg-gradient-to-br from-semi-color-bg-0 to-semi-color-bg-1 shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-1">
    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                        <span className="text-[14px] font-bold text-semi-color-text-0 opacity-80">{card.index}</span>
                      </div>
                      <div className="mt-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-semi-color-text-2">常用能力</div>
                      <h3 className="mt-2 text-[19px] font-medium tracking-tight text-semi-color-text-0">{card.title}</h3>
                      <p className="mt-3 text-[14.5px] leading-relaxed text-semi-color-text-1 text-balance">{card.description}</p>
                    </article>
                  ))}
                </div>
              </section>
            </ScrollStage>
          </section>

          <section className="home-page-panel home-page-panel-content">
            <ScrollStage className="mx-auto flex max-w-[1600px] items-center px-4 py-8 sm:px-6 lg:px-8 w-full">
              <section className="home-reveal-section home-elevated-card p-5 sm:p-6 lg:p-8 w-full">
                <div className="home-ecosystem-layout">
                  <aside className="home-ecosystem-intro">
                    <div className="home-continue-kicker">生态覆盖范围</div>
                    <h2 className="text-balance">聚合全球顶尖大语言模型资源</h2>
                    <p className="text-balance">主流供应商与专属客户端在此一站式集结。我们精选并稳定全直连数十家领先模型，为您提供无感切换的聚合交互体验。不论是日常闲聊记录还是重磅级的业务开发调用，一切触手可得。</p>
                  </aside>

                  <div className="home-ecosystem-grids">
                    <div>
                      <div className="mb-3 flex items-center justify-between border-b border-semi-color-border pb-2">
                        <div className="text-[13px] font-medium text-semi-color-text-0">主流模型与供应商</div>
                        <div className="text-[10px] uppercase tracking-[0.14em] text-semi-color-text-2">模型入口</div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-8 gap-1.5 items-center justify-center">
                        {providerLogos.map((item) => (
                          <div key={item.name} className="flex">
                            <LogoTile
                              name={item.name}
                              badge={item.badge}
                              
                              icon={item.icon}
                              invertLight={item.invertLight}
                              size={44}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="mb-3 flex items-center justify-between border-b border-semi-color-border pb-2">
                        <div className="text-[13px] font-medium text-semi-color-text-0">常用工具与客户端</div>
                        <div className="text-[10px] uppercase tracking-[0.14em] text-semi-color-text-2">客户端入口</div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-1.5 items-center justify-center">
                        {toolLogos.map((item) => (
                          <div key={item.name} className="flex">
                            <LogoTile
                              name={item.name}
                              badge={item.badge}
                              src={item.src}
                              icon={item.icon}
                              invertLight={item.invertLight}
                              invertDark={item.invertDark}
                              size={40}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </ScrollStage>
          </section>

          {/* Final CTA Banner */}
          <section className="home-page-panel relative px-4 sm:px-6 lg:px-8">
            <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-[1200px] flex-col py-8 sm:py-10">
              <div className="flex flex-1 items-center justify-center text-center">
                <div className="relative w-full overflow-hidden rounded-[2rem] bg-gradient-to-br from-semi-color-bg-0 to-semi-color-bg-1 border border-semi-color-border p-8 sm:p-12 shadow-xl">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent pointer-events-none" />
                  <div className="relative z-10 mx-auto max-w-2xl space-y-6">
                    <h2 className="text-3xl font-semibold leading-[1.15] tracking-[-0.03em] sm:text-[42px] text-semi-color-text-0">
                      <span className="block">准备好开启高效的</span>
                      <span className="mt-1 block">AI 编程流了吗？</span>
                    </h2>
                    <p className="text-[15px] sm:text-[17px] leading-relaxed text-semi-color-text-2">无需繁琐的发卡行信用卡绑定验证，也没有高昂的起步冲值门槛。<br className="hidden sm:block"/>注册立即获取专属 Key，为您的所有开发者工具装上通用引擎。</p>
                    <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                      <Link to="/console" className="group relative inline-flex items-center justify-center overflow-hidden rounded-xl border border-transparent px-8 py-3 text-[15px] font-medium transition-all hover:scale-[1.03] hover:shadow-xl active:scale-[0.98]" style={{ background: "var(--semi-color-text-0)", color: "var(--semi-color-bg-0)" }}>
                        <span className="relative z-10">立即注册使用</span>
                        <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] transition-transform duration-500 group-hover:translate-x-[100%]" />
                      </Link>
                      {docsLink && (
                        <a href={docsLink} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-xl border border-semi-color-border bg-semi-color-bg-0 px-8 py-3 text-[15px] font-medium text-semi-color-text-0 transition-all hover:bg-semi-color-bg-1 active:scale-[0.98]">
                          阅读完整文档
                        </a>
                      )}
                      <a href="https://qm.qq.com/q/rhngEU31OS" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-xl border border-semi-color-border bg-semi-color-bg-0 px-8 py-3 text-[15px] font-medium text-semi-color-text-0 transition-all hover:bg-semi-color-bg-1 active:scale-[0.98]">
                        加入摸鱼群组
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <footer className="w-full mt-auto pt-8 pb-2">
                <div className="flex flex-col gap-6 border-t border-semi-color-border pt-6 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap gap-x-6 gap-y-3 text-[13px] font-medium text-semi-color-text-2">
                    <a href="https://docs.moyuu.cc/" target="_blank" rel="noreferrer" className="transition-colors hover:text-semi-color-text-0">关于</a>
                    {statusState?.status?.user_agreement_enabled === true && (
                      <Link to="/user-agreement" className="transition-colors hover:text-semi-color-text-0">用户协议</Link>
                    )}
                    {statusState?.status?.privacy_policy_enabled === true && (
                      <Link to="/privacy-policy" className="transition-colors hover:text-semi-color-text-0">隐私政策</Link>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 text-[13px] text-semi-color-text-2 md:items-end">
                    <div>© {currentYear} Moeyuu. 版权所有</div>
                    <div className="flex flex-wrap items-center gap-4">
                      <span>{version}</span>
                      <span>设计与开发由 <span className="font-semibold text-semi-color-text-0">Moeyuu</span></span>
                    </div>
                  </div>
                </div>
              </footer>
            </div>
          </section>

        </div>
        </>
      ) : (
        <div className='overflow-x-hidden w-full'>
          {homePageContent.startsWith('https://') ? (
            <iframe
              src={homePageContent}
              className='w-full h-screen border-none'
            />
          ) : (
            <div
              className='mt-[60px]'
              dangerouslySetInnerHTML={{ __html: homePageContent }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
