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

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  Card,
  Tag,
  Avatar,
  Typography,
  Tooltip,
  Modal,
} from '@douyinfe/semi-ui';
import { getLobeHubIcon } from '../../../../../helpers';

const { Paragraph } = Typography;

const CONFIG = {
  CAROUSEL_INTERVAL: 2000,
  ICON_SIZE: 40,
  UNKNOWN_VENDOR: 'unknown',
};

const THEME_COLORS = {
  allVendors: {
    primary: '37 99 235',
    background: 'rgba(59, 130, 246, 0.08)',
  },
  specific: {
    primary: '16 185 129',
    background: 'rgba(16, 185, 129, 0.1)',
  },
};

const COMPONENT_STYLES = {
  tag: {
    backgroundColor: 'var(--semi-color-fill-0)',
    color: 'var(--semi-color-text-0)',
    border: '1px solid var(--semi-color-border)',
    fontWeight: '500',
  },
  avatarContainer:
    'w-12 h-12 rounded-xl bg-transparent flex items-center justify-center overflow-hidden',
  titleText: { color: 'var(--semi-color-text-0)' },
  descriptionText: { color: 'var(--semi-color-text-2)' },
};

const CONTENT_TEXTS = {
  unknown: {
    displayName: (t) => t('未知供应商'),
    description: (t) =>
      t(
        '包含来自未知或未标明供应商的AI模型，这些模型可能来自小型供应商或开源项目。',
      ),
  },
  all: {
    description: (t) =>
      t('查看所有可用的AI模型供应商，包括众多知名供应商的模型。'),
  },
  fallback: {
    description: (t) => t('该供应商提供多种AI模型，适用于不同的应用场景。'),
  },
};

const getVendorDisplayName = (vendorName, t) => {
  return vendorName === CONFIG.UNKNOWN_VENDOR
    ? CONTENT_TEXTS.unknown.displayName(t)
    : vendorName;
};

const createDefaultAvatar = () => (
  <div className={COMPONENT_STYLES.avatarContainer}>
    <Avatar size='small' color='blue'>
      AI
    </Avatar>
  </div>
);

const getAvatarBackgroundColor = (isAllVendors) =>
  isAllVendors
    ? THEME_COLORS.allVendors.background
    : THEME_COLORS.specific.background;

const getAvatarText = (vendorName) =>
  vendorName === CONFIG.UNKNOWN_VENDOR
    ? '?'
    : vendorName.charAt(0).toUpperCase();

const createAvatarContent = (vendor, isAllVendors) => {
  if (vendor.icon) {
    return getLobeHubIcon(vendor.icon, CONFIG.ICON_SIZE);
  }

  return (
    <Avatar
      size='small'
      style={{ backgroundColor: getAvatarBackgroundColor(isAllVendors) }}
    >
      {getAvatarText(vendor.name)}
    </Avatar>
  );
};

const renderVendorAvatar = (vendor, t, isAllVendors = false) => {
  if (!vendor) {
    return createDefaultAvatar();
  }

  const displayName = getVendorDisplayName(vendor.name, t);
  const avatarContent = createAvatarContent(vendor, isAllVendors);

  return (
    <Tooltip content={displayName} position='top'>
      <div className={COMPONENT_STYLES.avatarContainer}>{avatarContent}</div>
    </Tooltip>
  );
};

const PricingVendorIntro = memo(
  ({
    filterVendor,
    models = [],
    allModels = [],
    t,
    isMobile = false,
  }) => {
    const [currentOffset, setCurrentOffset] = useState(0);
    const [descModalVisible, setDescModalVisible] = useState(false);
    const [descModalContent, setDescModalContent] = useState('');

    const handleOpenDescModal = useCallback((content) => {
      setDescModalContent(content || '');
      setDescModalVisible(true);
    }, []);

    const handleCloseDescModal = useCallback(() => {
      setDescModalVisible(false);
    }, []);

    const renderDescriptionModal = useCallback(
      () => (
        <Modal
          title={t('供应商介绍')}
          visible={descModalVisible}
          onCancel={handleCloseDescModal}
          footer={null}
          width={isMobile ? '95%' : 600}
          bodyStyle={{
            maxHeight: isMobile ? '70vh' : '60vh',
            overflowY: 'auto',
          }}
        >
          <div className='text-sm mb-4'>{descModalContent}</div>
        </Modal>
      ),
      [descModalVisible, descModalContent, handleCloseDescModal, isMobile, t],
    );

    const vendorInfo = useMemo(() => {
      const vendors = new Map();
      let unknownCount = 0;

      const sourceModels =
        Array.isArray(allModels) && allModels.length > 0 ? allModels : models;

      sourceModels.forEach((model) => {
        if (model.vendor_name) {
          const existing = vendors.get(model.vendor_name);
          if (existing) {
            existing.count++;
          } else {
            vendors.set(model.vendor_name, {
              name: model.vendor_name,
              icon: model.vendor_icon,
              description: model.vendor_description,
              count: 1,
            });
          }
        } else {
          unknownCount++;
        }
      });

      const vendorList = Array.from(vendors.values()).sort((a, b) =>
        a.name.localeCompare(b.name),
      );

      if (unknownCount > 0) {
        vendorList.push({
          name: CONFIG.UNKNOWN_VENDOR,
          icon: null,
          description: CONTENT_TEXTS.unknown.description(t),
          count: unknownCount,
        });
      }

      return vendorList;
    }, [allModels, models, t]);

    const currentModelCount = models.length;

    useEffect(() => {
      if (filterVendor !== 'all' || vendorInfo.length <= 1) {
        setCurrentOffset(0);
        return;
      }

      const interval = setInterval(() => {
        setCurrentOffset((prev) => (prev + 1) % vendorInfo.length);
      }, CONFIG.CAROUSEL_INTERVAL);

      return () => clearInterval(interval);
    }, [filterVendor, vendorInfo.length]);

    const getVendorDescription = useCallback(
      (vendorKey) => {
        if (vendorKey === 'all') {
          return CONTENT_TEXTS.all.description(t);
        }
        if (vendorKey === CONFIG.UNKNOWN_VENDOR) {
          return CONTENT_TEXTS.unknown.description(t);
        }
        const vendor = vendorInfo.find((v) => v.name === vendorKey);
        return vendor?.description || CONTENT_TEXTS.fallback.description(t);
      },
      [vendorInfo, t],
    );

    const createCoverStyle = useCallback(
      (primaryColor) => ({
        '--palette-primary-darkerChannel': primaryColor,
        backgroundImage: `linear-gradient(0deg, rgba(var(--palette-primary-darkerChannel) / 80%), rgba(var(--palette-primary-darkerChannel) / 80%)), url('/cover-4.webp')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }),
      [],
    );

    const renderHeaderCard = useCallback(
      ({ title, count, description, rightContent, primaryDarkerChannel }) => (
        <Card
          className='!rounded-2xl shadow-none border border-gray-100 overflow-hidden'
          cover={
            <div
              className='relative h-full min-h-[118px] bg-[var(--semi-color-bg-0)]'
              style={{
                background: [
                  `radial-gradient(ellipse 60% 50% at 20% 20%, rgba(${primaryDarkerChannel}, 0.16) 0%, transparent 70%)`,
                  'radial-gradient(ellipse 50% 40% at 80% 15%, rgba(14, 165, 233, 0.12) 0%, transparent 70%)',
                  'linear-gradient(180deg, color-mix(in srgb, var(--semi-color-bg-0) 94%, transparent), color-mix(in srgb, var(--semi-color-bg-1) 88%, transparent))',
                ].join(', '),
              }}
            >
              <div className='relative z-10 h-full flex flex-col items-center justify-center px-5 py-4 text-center'>
                <div className='flex-1 min-w-0'>
                  <div className='mb-1.5 text-[10px] font-medium uppercase tracking-[0.24em] text-gray-400'>
                    Models Directory
                  </div>
                  <div className='flex flex-row flex-wrap items-center justify-center gap-2 sm:gap-3 mb-1.5'>
                    <h2
                      className='text-2xl sm:text-4xl font-bold tracking-tight text-[var(--semi-color-text-0)] truncate'
                    >
                      {title}
                    </h2>
                    <Tag
                      style={COMPONENT_STYLES.tag}
                      shape='circle'
                      size='small'
                      className='self-center'
                    >
                      {t('共 {{count}} 个模型', { count })}
                    </Tag>
                  </div>
                  <Paragraph
                    className='mx-auto max-w-2xl text-xs leading-relaxed !mb-0 cursor-pointer !text-[var(--semi-color-text-2)]'
                    ellipsis={{ rows: 1 }}
                    onClick={() => handleOpenDescModal(description)}
                  >
                    {description}
                  </Paragraph>
                </div>
              </div>
            </div>
          }
        />
      ),
      [handleOpenDescModal, t],
    );

    const renderAllVendorsAvatar = useCallback(() => {
      const currentVendor =
        vendorInfo.length > 0
          ? vendorInfo[currentOffset % vendorInfo.length]
          : null;
      return renderVendorAvatar(currentVendor, t, true);
    }, [vendorInfo, currentOffset, t]);

    if (filterVendor === 'all') {
      const headerCard = renderHeaderCard({
        title: t('全部供应商'),
        count: currentModelCount,
        description: getVendorDescription('all'),
        rightContent: renderAllVendorsAvatar(),
        primaryDarkerChannel: THEME_COLORS.allVendors.primary,
      });
      return (
        <>
          {headerCard}
          {renderDescriptionModal()}
        </>
      );
    }

    const currentVendor = vendorInfo.find((v) => v.name === filterVendor);
    if (!currentVendor) {
      return null;
    }

    const vendorDisplayName = getVendorDisplayName(currentVendor.name, t);

    const headerCard = renderHeaderCard({
      title: vendorDisplayName,
      count: currentModelCount,
      description:
        currentVendor.description || getVendorDescription(currentVendor.name),
      rightContent: renderVendorAvatar(currentVendor, t, false),
      primaryDarkerChannel: THEME_COLORS.specific.primary,
    });

    return (
      <>
        {headerCard}
        {renderDescriptionModal()}
      </>
    );
  },
);

PricingVendorIntro.displayName = 'PricingVendorIntro';

export default PricingVendorIntro;
