import React, { useState, useEffect, useContext } from 'react';
import { Table, Tabs, TabPane, Tag, Spin, Empty } from '@douyinfe/semi-ui';
import { API, showError } from '../../helpers';
import { renderQuotaNumberWithDigit, getQuotaWithUnit } from '../../helpers/render';
import { useTranslation } from 'react-i18next';
import { UserContext } from '../../context/User';
import { StatusContext } from '../../context/Status';
import { useIsMobile } from '../../hooks/common/useIsMobile';
import './leaderboard.css';

const PERIODS = [
  { key: '24h', label: '24小时' },
  { key: '7d', label: '7天' },
  { key: '30d', label: '30天' },
  { key: 'all', label: '全部' },
];

function formatQuotaDisplay(quota) {
  const usd = parseFloat(getQuotaWithUnit(quota, 2));
  return renderQuotaNumberWithDigit(usd, 2);
}

function formatNumber(num) {
  if (!num) return '0';
  return num.toLocaleString();
}

const RankBadge = ({ rank }) => {
  if (rank === 1) return <span className="lb-rank lb-rank-gold">1</span>;
  if (rank === 2) return <span className="lb-rank lb-rank-silver">2</span>;
  if (rank === 3) return <span className="lb-rank lb-rank-bronze">3</span>;
  return <span className="lb-rank-num">{rank}</span>;
};

const Leaderboard = () => {
  const { t } = useTranslation();
  const [userState] = useContext(UserContext);
  const [statusState] = useContext(StatusContext);
  const isMobile = useIsMobile();

  const status = statusState?.status || {};
  const enabled = status.leaderboard_enabled !== false;
  const showQuota = status.leaderboard_show_quota === true;
  const showTokens = status.leaderboard_show_tokens !== false;
  const showCount = status.leaderboard_show_count !== false;

  const [period, setPeriod] = useState('30d');
  const [tab, setTab] = useState('users');
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState([]);
  const [modelData, setModelData] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [myRankLoading, setMyRankLoading] = useState(false);

  const fetchLeaderboard = async (p, t) => {
    setLoading(true);
    try {
      const res = await API.get(`/api/leaderboard/?period=${p}&tab=${t}`);
      const { success, data, message } = res.data;
      if (success) {
        if (t === 'users') setUserData(data || []);
        else setModelData(data || []);
      } else {
        showError(message);
      }
    } catch (e) {
      showError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRank = async (p) => {
    if (!userState?.user) return;
    setMyRankLoading(true);
    try {
      const res = await API.get(`/api/leaderboard/self?period=${p}`);
      const { success, data } = res.data;
      if (success) setMyRank(data);
    } catch { /* ignore */ } finally {
      setMyRankLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled) return;
    fetchLeaderboard(period, tab);
    fetchMyRank(period);
  }, [period, enabled]);

  useEffect(() => {
    if (!enabled) return;
    fetchLeaderboard(period, tab);
  }, [tab]);

  if (!enabled) {
    return (
      <div className="lb-page">
        <div className="lb-container">
          <Empty description={t('排行榜未启用')} />
        </div>
      </div>
    );
  }

  const buildColumns = (nameTitle, nameKey) => {
    const cols = [
      {
        title: '#',
        dataIndex: 'rank',
        key: 'rank',
        width: 70,
        render: (_, __, idx) => <RankBadge rank={idx + 1} />,
      },
      {
        title: t(nameTitle),
        dataIndex: nameKey,
        key: nameKey,
      },
    ];
    if (showQuota) {
      cols.push({
        title: <span className="lb-col-sortable">{t('消费金额')} ↕</span>,
        dataIndex: 'total_quota',
        key: 'total_quota',
        sorter: (a, b) => a.total_quota - b.total_quota,
        render: (val) => <Tag color="blue" size="small">{formatQuotaDisplay(val)}</Tag>,
      });
    }
    if (showTokens) {
      cols.push({
        title: <span className="lb-col-sortable">Token {t('用量')} ↕</span>,
        dataIndex: 'total_tokens',
        key: 'total_tokens',
        sorter: (a, b) => a.total_tokens - b.total_tokens,
        render: (val) => formatNumber(val),
      });
    }
    if (showCount) {
      cols.push({
        title: <span className="lb-col-sortable">{t('调用次数')} ↕</span>,
        dataIndex: 'request_count',
        key: 'request_count',
        sorter: (a, b) => a.request_count - b.request_count,
        render: (val) => formatNumber(val),
      });
    }
    return cols;
  };

  return (
    <div className="lb-page">
      <div className="lb-container">
        <div className="lb-header">
          <h1 className="lb-title">{t('排行榜')}</h1>
          <div className="lb-period-group">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                className={`lb-period-btn ${period === p.key ? 'active' : ''}`}
                onClick={() => setPeriod(p.key)}
              >
                {t(p.label)}
              </button>
            ))}
          </div>
        </div>

        {userState?.user && (
          <div className="lb-myrank">
            <Spin spinning={myRankLoading} size="small">
              <div className="lb-myrank-inner">
                <span className="lb-myrank-label">{t('我的排名')}: <strong>#{myRank?.rank || '-'}</strong></span>
                <span className="lb-myrank-divider" />
                {showQuota && <Tag color="blue" size="small">{t('消费金额')}: {myRank ? formatQuotaDisplay(myRank.total_quota) : '-'}</Tag>}
                {showTokens && <span className="lb-myrank-stat">Token: {myRank ? formatNumber(myRank.total_tokens) : '-'}</span>}
                {showCount && <Tag color="green" size="small">{t('调用次数')}: {myRank ? formatNumber(myRank.request_count) : '-'}</Tag>}
              </div>
            </Spin>
          </div>
        )}

        <Tabs activeKey={tab} onChange={setTab} type="line" className="lb-tabs">
          <TabPane tab={t('用户消费排行')} itemKey="users">
            <Table
              columns={buildColumns('用户', 'username')}
              dataSource={userData}
              loading={loading}
              pagination={false}
              rowKey={(_, idx) => idx}
              size={isMobile ? 'small' : 'middle'}
              className="lb-table"
            />
          </TabPane>
          <TabPane tab={t('模型使用排行')} itemKey="models">
            <Table
              columns={buildColumns('模型', 'model_name')}
              dataSource={modelData}
              loading={loading}
              pagination={false}
              rowKey={(_, idx) => idx}
              size={isMobile ? 'small' : 'middle'}
              className="lb-table"
            />
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
};

export default Leaderboard;
