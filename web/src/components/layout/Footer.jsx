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

import React, { useEffect, useState, useMemo, useContext } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Typography } from '@douyinfe/semi-ui';
import { getFooterHTML, getLogo, getSystemName } from '../../helpers';
import { StatusContext } from '../../context/Status';

const FooterBar = () => {
  const { t } = useTranslation();
  const [footer, setFooter] = useState(getFooterHTML());
  const [statusState] = useContext(StatusContext);
  const version = 'v1.0.0';

  const userAgreementEnabled = statusState?.status?.user_agreement_enabled === true;
  const privacyPolicyEnabled = statusState?.status?.privacy_policy_enabled === true;

  const loadFooter = () => {
    let footer_html = localStorage.getItem('footer_html');
    if (footer_html) {
      setFooter(footer_html);
    }
  };

  const currentYear = new Date().getFullYear();

  const linkClass = 'hover:text-semi-color-text-0 transition-colors';

  const customFooter = useMemo(
    () => (
      <footer className='w-full border-t border-semi-color-border py-8 px-6 md:px-12 flex flex-col items-center justify-between' style={{ background: 'transparent' }}>
        <div className='w-full max-w-[1200px] flex flex-col md:flex-row justify-between items-start md:items-center gap-6'>

          <div className='flex flex-wrap gap-x-6 gap-y-2 text-[13px] font-medium text-semi-color-text-2'>
            <a href='https://docs.moyuu.cc/' target='_blank' rel='noopener noreferrer' className={linkClass}>
              {t('关于')}
            </a>
            {userAgreementEnabled && (
              <Link to='/user-agreement' className={linkClass}>
                {t('用户协议')}
              </Link>
            )}
            {privacyPolicyEnabled && (
              <Link to='/privacy-policy' className={linkClass}>
                {t('隐私政策')}
              </Link>
            )}
          </div>

        </div>

        <div className='w-full max-w-[1200px] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-8'>
          <div className='text-[13px] text-semi-color-text-2'>
            © {currentYear} Moeyuu. {t('版权所有')}
          </div>

          <div className='flex items-center gap-6 text-[13px] text-semi-color-text-2'>
            <span>{version}</span>
            <span>
              {t('设计与开发由')}{' '}
              <a
                href='#'
                className='text-semi-color-text-0 font-semibold hover:text-semi-color-primary transition-colors'
              >
                Moeyuu
              </a>
            </span>
          </div>
        </div>
      </footer>
    ),
    [t, currentYear, version, userAgreementEnabled, privacyPolicyEnabled],
  );

  useEffect(() => {
    loadFooter();
  }, []);

  return (
    <div className='w-full' style={{ background: 'transparent' }}>
      {footer ? (
        <footer className='w-full border-t border-semi-color-border py-6 px-6 flex items-center justify-center' style={{ background: 'transparent' }}>
          <div className='flex flex-col md:flex-row items-center justify-between w-full max-w-[1200px] gap-4'>
            <div
              className='custom-footer na-cb6feafeb3990c78 text-[13px] text-semi-color-text-2'
              dangerouslySetInnerHTML={{ __html: footer }}
            ></div>
            <div className='text-[13px] text-semi-color-text-2 flex-shrink-0'>
              {t('设计与开发由')}{' '}
              <a
                href='#'
                className='text-semi-color-text-0 font-semibold hover:text-semi-color-primary transition-colors'
              >
                Moeyuu
              </a>
            </div>
          </div>
        </footer>
      ) : (
        customFooter
      )}
    </div>
  );
};

export default FooterBar;
