import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Select, Spin, message, Divider, Tag, Space } from 'antd';
import { 
  ArrowUpOutlined, 
  ArrowDownOutlined, 
  LineChartOutlined,
  StockOutlined,
  FundOutlined,
  PercentageOutlined,
  RiseOutlined,
  FallOutlined,
  SlidersOutlined
} from '@ant-design/icons';
import { Line } from '@ant-design/plots';
import type { LineConfig } from '@ant-design/plots';
import { DatePicker } from 'antd';
import type { RangePickerProps } from 'antd/es/date-picker';
import { request, useIntl } from '@umijs/max';
import { PageContainer } from '@ant-design/pro-layout';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

interface ProfitVo {
  date: string;
  profitPercentage: number;
}

interface ProfitData {
  [key: string]: ProfitVo[];
}

interface AccountInfo {
  account: string;
  name: string;
}

interface TradingStats {
  overallStats: {
    totalBuyCount: number;
    totalProfit: number;
  };
  dingtouStats: {
    count: number;
    profit: number;
    realizedProfit: number;
    unrealizedProfit: number;
    successRate: number;
  };
  regularDingtou?: {
    count: number;
    profit: number;
    realizedProfit: number;
    unrealizedProfit: number;
    successRate: number;
  };
  callbackDingtou?: {
    count: number;
    profit: number;
    realizedProfit: number;
    unrealizedProfit: number;
    successRate: number;
  };
  manualStats: {
    count: number;
    profit: number;
    realizedProfit: number;
    unrealizedProfit: number;
    successRate: number;
  };
  avgStrategyStats: {
    count: number;
    profit: number;
    realizedProfit: number;
    unrealizedProfit: number;
    successRate: number;
  };
  highVolatilityStats?: {
    count: number;
    profit: number;
    realizedProfit: number;
    unrealizedProfit: number;
    successRate: number;
  };
  unrealizedProfits?: {
    unrealizedProfit: number;
    unrealizedProfitRate: number;
    positionCount: number;
  };
}

const PAGE_SIZE = 500;

const DashboardList: React.FC = () => {
  const intl = useIntl();
  const [profitData, setProfitData] = useState<ProfitData>({});
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountPage, setAccountPage] = useState(1);
  const [accountTotal, setAccountTotal] = useState(0);
  const [searchName, setSearchName] = useState('');
  const [tradingStats, setTradingStats] = useState<TradingStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const fetchAccounts = async (page: number = 1, name?: string) => {
    try {
      setAccountLoading(true);
      const result = await request('/api/accountInfo/list', {
        params: {
          current: page,
          pageSize: PAGE_SIZE,
          name: name,
        },
      });
      if (result.success) {
        if (page === 1) {
          setAccounts(result.data || []);
        } else {
          setAccounts((prev) => [...prev, ...(result.data || [])]);
        }
        setAccountTotal(result.total || 0);
      }
    } catch (error) {
      console.error('获取账户列表失败:', error);
      message.error(intl.formatMessage({ id: 'component.message.fetchAccountListFailed' }, { defaultMessage: '获取账户列表失败' }));
    } finally {
      setAccountLoading(false);
    }
  };

  const handleAccountPopupScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { target } = e;
    const div = target as HTMLDivElement;
    if (div.scrollHeight - div.scrollTop - div.clientHeight < 50) {
      const nextPage = accountPage + 1;
      const totalPages = Math.ceil(accountTotal / PAGE_SIZE);
      if (nextPage <= totalPages && !accountLoading) {
        setAccountPage(nextPage);
        fetchAccounts(nextPage, searchName);
      }
    }
  };

  const handleSearch = (value: string) => {
    setSearchName(value);
    setAccountPage(1);
    fetchAccounts(1, value);
  };

  const fetchData = async () => {
    try {
      const result = await request('/api/accountInfo/profit', {
        params: {
          ...(dateRange ? {
            startTime: dateRange[0].format('YYYY-MM-DD'),
            endTime: dateRange[1].format('YYYY-MM-DD'),
          } : {}),
          accounts: selectedAccounts.join(','),
        },
      });
      if (result.success) {
        setProfitData(result.data || {});
      }
    } catch (error) {
      console.error('获取数据失败:', error);
      message.error(intl.formatMessage({ id: 'component.message.fetchDataFailed' }, { defaultMessage: '获取数据失败' }));
    }
  };

  const fetchTradingStats = async (account?: string) => {
    try {
      setStatsLoading(true);
      const result = await request('/api/accountInfo/tradingStats', {
        params: {
          account: account,
        },
      });
      if (result.success) {
        setTradingStats(result.data || null);
      }
    } catch (error) {
      console.error('获取交易统计数据失败:', error);
      message.error(intl.formatMessage({ id: 'component.message.fetchTradingStatsFailed' }, { defaultMessage: '获取交易统计数据失败' }));
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts(1);
    fetchData(); // 初始加载数据
  }, []);

  useEffect(() => {
    fetchData();
  }, [dateRange, selectedAccounts]);

  useEffect(() => {
    if (selectedAccounts.length === 1) {
      fetchTradingStats(selectedAccounts[0]);
    } else if (selectedAccounts.length === 0) {
      fetchTradingStats(); // 获取所有账户统计
    }
  }, [selectedAccounts]);

  // 将数据转换为图表所需格式
  const transformData = () => {
    const data: any[] = [];
    Object.entries(profitData).forEach(([account, profits]) => {
      // 按日期排序
      const sortedProfits = [...profits].sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());
      sortedProfits.forEach((profit) => {
        data.push({
          account,
          date: profit.date,
          profitPercentage: profit.profitPercentage,
        });
      });
    });
    return data;
  };

  const profitConfig: LineConfig = {
    data: transformData(),
    xField: 'date',
    yField: 'profitPercentage',
    seriesField: 'account',
    xAxis: {
      type: 'time',
      label: {
        formatter: (text) => dayjs(text).format('MM-DD'),
      },
      tickCount: 10,
    },
    yAxis: {
      label: {
        formatter: (val: string) => `${Number(val).toFixed(2)}%`,
      },
    },
    tooltip: {
      formatter: (datum) => {
        return {
          name: datum.account,
          value: `${Number(datum.profitPercentage).toFixed(2)}%`,
          title: dayjs(datum.date).format('YYYY-MM-DD'),
        };
      },
    },
    legend: {
      position: 'top' as const,
    },
    smooth: true,
    connectNulls: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
  };

  // 禁用未来日期
  const disabledDate: RangePickerProps['disabledDate'] = (current) => {
    return current && current > dayjs().endOf('day');
  };

  const handleDateRangeChange = (dates: any, dateStrings: [string, string]) => {
    if (dates) {
      setDateRange([dates[0] as Dayjs, dates[1] as Dayjs]);
    } else {
      setDateRange(null);
    }
  };

  // 渲染统计卡片
  const renderStatsCard = () => {
    if (!tradingStats) {
      return <Spin tip={intl.formatMessage({ id: 'component.loading' }, { defaultMessage: '加载中...' })} />;
    }
    
    return (
      <Card title={intl.formatMessage({ id: 'dashboard.stats.title' })} bordered={false} loading={statsLoading}>
        <Row gutter={24}>
          <Col span={8}>
            <Card title={intl.formatMessage({ id: 'dashboard.stats.overall' })} bordered={false}>
              <Statistic
                title={intl.formatMessage({ id: 'dashboard.stats.total.buy.count' })}
                value={tradingStats.overallStats.totalBuyCount}
                prefix={<SlidersOutlined />}
              />
              <Divider />
              <Statistic
                title={intl.formatMessage({ id: 'dashboard.stats.total.profit' })}
                value={tradingStats.overallStats.totalProfit}
                precision={2}
                valueStyle={{ color: tradingStats.overallStats.totalProfit >= 0 ? '#3f8600' : '#cf1322' }}
                prefix={tradingStats.overallStats.totalProfit >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                suffix="$"
              />
              {tradingStats.unrealizedProfits && (
                <>
                  <Divider />
                  <Statistic
                    title={
                      <span>
                        {intl.formatMessage({ id: 'dashboard.stats.unrealized.profit' })}{' '}
                        <Tag color="blue">{tradingStats.unrealizedProfits.positionCount}{intl.formatMessage({ id: 'dashboard.stats.positions' })}</Tag>
                      </span>
                    }
                    value={tradingStats.unrealizedProfits.unrealizedProfit}
                    precision={2}
                    valueStyle={{ 
                      color: tradingStats.unrealizedProfits.unrealizedProfit >= 0 ? '#3f8600' : '#cf1322' 
                    }}
                    prefix={tradingStats.unrealizedProfits.unrealizedProfit >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                    suffix={
                      <span style={{ fontSize: '14px', marginLeft: '5px' }}>
                        {tradingStats.unrealizedProfits.unrealizedProfitRate.toFixed(2)}%
                      </span>
                    }
                  />
                </>
              )}
            </Card>
          </Col>
          
          <Col span={8}>
            <Card title={intl.formatMessage({ id: 'dashboard.stats.strategy' })} bordered={false}>
              <Statistic
                title={intl.formatMessage({ id: 'dashboard.stats.dingtou.total' })}
                value={tradingStats.dingtouStats.count}
                precision={0}
                prefix={<SlidersOutlined />}
                suffix={
                  <Space>
                    <span style={{ fontSize: '14px', marginLeft: '5px', color: tradingStats.dingtouStats.realizedProfit >= 0 ? '#3f8600' : '#cf1322' }}>
                      {intl.formatMessage({ id: 'dashboard.stats.realized.profit', defaultMessage: '已实现盈利' })}: {tradingStats.dingtouStats.realizedProfit >= 0 ? '+' : ''}{tradingStats.dingtouStats.realizedProfit.toFixed(2)}$
                    </span>
                    <span style={{ fontSize: '14px', marginLeft: '5px', color: tradingStats.dingtouStats.unrealizedProfit >= 0 ? '#3f8600' : '#cf1322' }}>
                      {intl.formatMessage({ id: 'dashboard.stats.unrealized.profit', defaultMessage: '持仓盈亏' })}: {tradingStats.dingtouStats.unrealizedProfit >= 0 ? '+' : ''}{tradingStats.dingtouStats.unrealizedProfit.toFixed(2)}$
                    </span>
                    <Tag color={tradingStats.dingtouStats.successRate > 50 ? 'green' : 'orange'}>
                      {intl.formatMessage({ id: 'dashboard.stats.success.rate' })} {tradingStats.dingtouStats.successRate.toFixed(1)}%
                    </Tag>
                  </Space>
                }
              />
              
              {tradingStats.regularDingtou && (
                <>
                  <Divider style={{ margin: '12px 0' }} />
                  <Statistic
                    title={intl.formatMessage({ id: 'dashboard.stats.regular.dingtou' })}
                    value={tradingStats.regularDingtou.count}
                    precision={0}
                    prefix={<SlidersOutlined />}
                    suffix={
                      <Space>
                        <span style={{ fontSize: '14px', marginLeft: '5px', color: tradingStats.regularDingtou.realizedProfit >= 0 ? '#3f8600' : '#cf1322' }}>
                          {intl.formatMessage({ id: 'dashboard.stats.realized.profit', defaultMessage: '已实现盈利' })}: {tradingStats.regularDingtou.realizedProfit >= 0 ? '+' : ''}{tradingStats.regularDingtou.realizedProfit.toFixed(2)}$
                        </span>
                        <span style={{ fontSize: '14px', marginLeft: '5px', color: tradingStats.regularDingtou.unrealizedProfit >= 0 ? '#3f8600' : '#cf1322' }}>
                          {intl.formatMessage({ id: 'dashboard.stats.unrealized.profit', defaultMessage: '持仓盈亏' })}: {tradingStats.regularDingtou.unrealizedProfit >= 0 ? '+' : ''}{tradingStats.regularDingtou.unrealizedProfit.toFixed(2)}$
                        </span>
                        <Tag color={tradingStats.regularDingtou.successRate > 50 ? 'green' : 'orange'}>
                          {intl.formatMessage({ id: 'dashboard.stats.success.rate' })} {tradingStats.regularDingtou.successRate.toFixed(1)}%
                        </Tag>
                      </Space>
                    }
                  />
                </>
              )}
              
              {tradingStats.callbackDingtou && (
                <>
                  <Divider style={{ margin: '12px 0' }} />
                  <Statistic
                    title={intl.formatMessage({ id: 'dashboard.stats.callback.dingtou' })}
                    value={tradingStats.callbackDingtou.count}
                    precision={0}
                    prefix={<SlidersOutlined />}
                    suffix={
                      <Space>
                        <span style={{ fontSize: '14px', marginLeft: '5px', color: tradingStats.callbackDingtou.realizedProfit >= 0 ? '#3f8600' : '#cf1322' }}>
                          {intl.formatMessage({ id: 'dashboard.stats.realized.profit', defaultMessage: '已实现盈利' })}: {tradingStats.callbackDingtou.realizedProfit >= 0 ? '+' : ''}{tradingStats.callbackDingtou.realizedProfit.toFixed(2)}$
                        </span>
                        <span style={{ fontSize: '14px', marginLeft: '5px', color: tradingStats.callbackDingtou.unrealizedProfit >= 0 ? '#3f8600' : '#cf1322' }}>
                          {intl.formatMessage({ id: 'dashboard.stats.unrealized.profit', defaultMessage: '持仓盈亏' })}: {tradingStats.callbackDingtou.unrealizedProfit >= 0 ? '+' : ''}{tradingStats.callbackDingtou.unrealizedProfit.toFixed(2)}$
                        </span>
                        <Tag color={tradingStats.callbackDingtou.successRate > 50 ? 'green' : 'orange'}>
                          {intl.formatMessage({ id: 'dashboard.stats.success.rate' })} {tradingStats.callbackDingtou.successRate.toFixed(1)}%
                        </Tag>
                      </Space>
                    }
                  />
                </>
              )}
              
              <Divider />
              <Statistic
                title={intl.formatMessage({ id: 'dashboard.stats.avg.strategy' })}
                value={tradingStats.avgStrategyStats.count}
                precision={0}
                prefix={<SlidersOutlined />}
                suffix={
                  <Space>
                    <span style={{ fontSize: '14px', marginLeft: '5px', color: tradingStats.avgStrategyStats.realizedProfit >= 0 ? '#3f8600' : '#cf1322' }}>
                      {intl.formatMessage({ id: 'dashboard.stats.realized.profit', defaultMessage: '已实现盈利' })}: {tradingStats.avgStrategyStats.realizedProfit >= 0 ? '+' : ''}{tradingStats.avgStrategyStats.realizedProfit.toFixed(2)}$
                    </span>
                    <span style={{ fontSize: '14px', marginLeft: '5px', color: tradingStats.avgStrategyStats.unrealizedProfit >= 0 ? '#3f8600' : '#cf1322' }}>
                      {intl.formatMessage({ id: 'dashboard.stats.unrealized.profit', defaultMessage: '持仓盈亏' })}: {tradingStats.avgStrategyStats.unrealizedProfit >= 0 ? '+' : ''}{tradingStats.avgStrategyStats.unrealizedProfit.toFixed(2)}$
                    </span>
                    <Tag color={tradingStats.avgStrategyStats.successRate > 50 ? 'green' : 'orange'}>
                      {intl.formatMessage({ id: 'dashboard.stats.success.rate' })} {tradingStats.avgStrategyStats.successRate.toFixed(1)}%
                    </Tag>
                  </Space>
                }
              />
              {tradingStats.highVolatilityStats && (
                <>
                  <Divider style={{ margin: '12px 0' }} />
                  <Statistic
                    title={intl.formatMessage({ id: 'dashboard.stats.high.volatility.strategy', defaultMessage: '高位震荡策略' })}
                    value={tradingStats.highVolatilityStats.count}
                    precision={0}
                    prefix={<SlidersOutlined />}
                    suffix={
                      <Space>
                        <span style={{ fontSize: '14px', marginLeft: '5px', color: tradingStats.highVolatilityStats.realizedProfit >= 0 ? '#3f8600' : '#cf1322' }}>
                          {intl.formatMessage({ id: 'dashboard.stats.realized.profit', defaultMessage: '已实现盈利' })}: {tradingStats.highVolatilityStats.realizedProfit >= 0 ? '+' : ''}{tradingStats.highVolatilityStats.realizedProfit.toFixed(2)}$
                        </span>
                        <span style={{ fontSize: '14px', marginLeft: '5px', color: tradingStats.highVolatilityStats.unrealizedProfit >= 0 ? '#3f8600' : '#cf1322' }}>
                          {intl.formatMessage({ id: 'dashboard.stats.unrealized.profit', defaultMessage: '持仓盈亏' })}: {tradingStats.highVolatilityStats.unrealizedProfit >= 0 ? '+' : ''}{tradingStats.highVolatilityStats.unrealizedProfit.toFixed(2)}$
                        </span>
                        <Tag color={tradingStats.highVolatilityStats.successRate > 50 ? 'green' : 'orange'}>
                          {intl.formatMessage({ id: 'dashboard.stats.success.rate' })} {tradingStats.highVolatilityStats.successRate.toFixed(1)}%
                        </Tag>
                      </Space>
                    }
                  />
                </>
              )}
            </Card>
          </Col>
          
          <Col span={8}>
            <Card title={intl.formatMessage({ id: 'dashboard.stats.manual' })} bordered={false}>
              <Statistic
                title={intl.formatMessage({ id: 'dashboard.stats.trade.count' })}
                value={tradingStats.manualStats.count}
                precision={0}
                prefix={<SlidersOutlined />}
                suffix={
                  <Space>
                    <span style={{ fontSize: '14px', marginLeft: '5px', color: tradingStats.manualStats.realizedProfit >= 0 ? '#3f8600' : '#cf1322' }}>
                      {intl.formatMessage({ id: 'dashboard.stats.realized.profit', defaultMessage: '已实现盈利' })}: {tradingStats.manualStats.realizedProfit >= 0 ? '+' : ''}{tradingStats.manualStats.realizedProfit.toFixed(2)}$
                    </span>
                    <span style={{ fontSize: '14px', marginLeft: '5px', color: tradingStats.manualStats.unrealizedProfit >= 0 ? '#3f8600' : '#cf1322' }}>
                      {intl.formatMessage({ id: 'dashboard.stats.unrealized.profit', defaultMessage: '持仓盈亏' })}: {tradingStats.manualStats.unrealizedProfit >= 0 ? '+' : ''}{tradingStats.manualStats.unrealizedProfit.toFixed(2)}$
                    </span>
                    <Tag color={tradingStats.manualStats.successRate > 50 ? 'green' : 'orange'}>
                      {intl.formatMessage({ id: 'dashboard.stats.success.rate' })} {tradingStats.manualStats.successRate.toFixed(1)}%
                    </Tag>
                  </Space>
                }
              />
              <Divider />
              <Statistic
                title={intl.formatMessage({ id: 'dashboard.stats.trade.profit' })}
                value={tradingStats.manualStats.profit}
                precision={2}
                valueStyle={{ color: tradingStats.manualStats.profit >= 0 ? '#3f8600' : '#cf1322' }}
                prefix={tradingStats.manualStats.profit >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                suffix="$"
              />
              <Divider />
              <Statistic
                title={intl.formatMessage({ id: 'dashboard.stats.success.rate' })}
                value={tradingStats.manualStats.successRate}
                precision={1}
                valueStyle={{ color: tradingStats.manualStats.successRate > 50 ? '#3f8600' : '#cf1322' }}
                prefix={tradingStats.manualStats.successRate >= 0 ? <RiseOutlined /> : <FallOutlined />}
                suffix="%"
              />
            </Card>
          </Col>
        </Row>
      </Card>
    );
  };

  return (
    <PageContainer>
      <div 
        style={{ 
          marginBottom: 16, 
          padding: '24px', 
          borderRadius: '4px',
          backgroundImage: 'url(/images/dashboard-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: '#fff',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.6)',
          minHeight: '350px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}
      >
        <div style={{ maxWidth: '60%', paddingLeft: '20px' }}>
          <h1 style={{ color: '#fff', fontSize: '28px', marginBottom: '12px', fontWeight: 'bold' }}>
            {intl.formatMessage({ id: 'dashboard.banner.title' })}
          </h1>
          <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '24px', opacity: 0.9 }}>
            {intl.formatMessage({ id: 'dashboard.banner.subtitle' })}
          </h3>
          
          <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4caf50', marginRight: '12px' }}></div>
            <span style={{ fontSize: '16px' }}>{intl.formatMessage({ id: 'dashboard.banner.feature.1' })}</span>
          </div>
          
          <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2196f3', marginRight: '12px' }}></div>
            <span style={{ fontSize: '16px' }}>{intl.formatMessage({ id: 'dashboard.banner.feature.2' })}</span>
          </div>
          
          <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ff9800', marginRight: '12px' }}></div>
            <span style={{ fontSize: '16px' }}>{intl.formatMessage({ id: 'dashboard.banner.feature.3' })}</span>
          </div>
          
          <button 
            style={{ 
              background: 'rgba(255, 255, 255, 0.2)', 
              border: '1px solid rgba(255, 255, 255, 0.4)', 
              color: 'white', 
              padding: '8px 20px', 
              borderRadius: '4px', 
              fontSize: '15px',
              cursor: 'pointer',
              backdropFilter: 'blur(5px)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            {intl.formatMessage({ id: 'dashboard.banner.action' })}
          </button>
        </div>
      </div>
      
      {renderStatsCard()}
      
      <div style={{ marginBottom: 16, padding: '16px 24px', background: '#f5f5f5', borderRadius: '4px' }}>
        <p style={{ marginBottom: 8, fontWeight: 'bold' }}>{intl.formatMessage({ id: 'dashboard.data.explanation' })}</p>
        <p style={{ marginBottom: 8, paddingLeft: 16 }}>{intl.formatMessage({ id: 'dashboard.data.explanation.1' })}</p>
        <p style={{ marginBottom: 8, paddingLeft: 16 }}>{intl.formatMessage({ id: 'dashboard.data.explanation.2' })}</p>
        <p style={{ marginBottom: 8, paddingLeft: 16 }}>{intl.formatMessage({ id: 'dashboard.data.explanation.3' })}</p>
      </div>
      
      <Card 
        title={intl.formatMessage({ id: 'dashboard.profit.trend' })}
        bordered={false}
        style={{ marginTop: 16 }}
        extra={
          <Space>
            <Select
              placeholder={intl.formatMessage({ id: 'dashboard.select.account' })}
              mode="multiple"
              allowClear
              showSearch
              style={{ width: 300 }}
              options={accounts.map(item => ({
                label: `${item.name} (${item.account})`,
                value: item.account,
              }))}
              value={selectedAccounts}
              onChange={setSelectedAccounts}
              loading={accountLoading}
              onPopupScroll={handleAccountPopupScroll}
              maxTagCount="responsive"
              onSearch={handleSearch}
              filterOption={false}
            />
            <RangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              disabledDate={disabledDate}
              allowClear
              placeholder={[
                intl.formatMessage({ id: 'dashboard.date.start' }), 
                intl.formatMessage({ id: 'dashboard.date.end' })
              ]}
            />
          </Space>
        }
      >
        <Line {...profitConfig} height={400} />
      </Card>
    </PageContainer>
  );
};

export default DashboardList;
