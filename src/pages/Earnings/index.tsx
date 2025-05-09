import React, { useState, useEffect, useRef } from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { Card, Table, Typography, Tag, Button, Spin, Tooltip, Row, Col, Statistic, Collapse, Space, Grid, InputNumber, Form, Select } from 'antd';
import { DownOutlined, RightOutlined, InfoCircleOutlined, CalendarOutlined, DollarOutlined, LineChartOutlined, FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import { request } from 'umi';
import { useIntl, FormattedMessage } from '@umijs/max';
import useMediaQuery from 'react-responsive';
import moment from 'moment';
import 'moment/locale/zh-cn'; // 添加中文支持
import styles from './index.less';

// 动态设置 moment 语言
const getMomentLocale = () => {
  const locale = localStorage.getItem('umi_locale') || 'zh-CN';
  return locale === 'zh-CN' ? 'zh-cn' : 'en';
};

// 设置 moment 语言
moment.locale(getMomentLocale());

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;
const { Panel } = Collapse;
const { Option } = Select;

interface PreviousReport {
  reportDate: string;
  releasePeriod: string;
  estimateEps?: number;
  actualEps?: number;
  epsDiffPercent?: number;
  estimateRevenueInBillion?: number;
  actualRevenueInBillion?: number;
  revenueDiffPercent?: number;
  tradingDate: string;
  changePercent?: number;
  qqqChangePercent?: number;
}

interface EarningsData {
  stockSymbol: string;
  companyName?: string;
  reportDate: string;
  releasePeriod: string;
  marketCapInBillion: number;
  estimateEps?: number;
  estimateRevenueInBillion?: number;
  oneMonthChangePercent?: number;
  threeMonthChangePercent?: number;
  yearToDateChangePercent?: number;
  previousReports?: PreviousReport[];
}

const EarningsCalendar: React.FC = () => {
  const intl = useIntl();
  const [loading, setLoading] = useState<boolean>(true);
  const [earningsData, setEarningsData] = useState<Record<string, EarningsData[]>>({});
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const [previousTradingDayEarnings, setPreviousTradingDayEarnings] = useState<EarningsData[]>([]);
  const [showPreviousDay, setShowPreviousDay] = useState<boolean>(true);
  const [marketCapThreshold, setMarketCapThreshold] = useState<number>(500);
  
  // 使用响应式布局钩子
  const screens = useBreakpoint();
  const isMobile = !screens.md; // md断点以下视为移动设备

  // 获取财报数据
  const fetchEarningsData = async (threshold: number = 500) => {
    setLoading(true);
    try {
      const result = await request('/api/earnings/calendar', {
        params: {
          marketCapThreshold: threshold
        }
      });
      if (result.success) {
        setEarningsData(result.data);
        
        // 查找是否有上一个交易日的数据 
        // 服务端已经处理了上一个交易日的盘后财报数据并包含在返回数据中
        // 前端只需将其提取出来单独显示
        
        // 找出最早的日期(应该是上一个交易日)
        // const dates = Object.keys(result.data).sort();
        // if (dates.length > 0) {
        //   const earliestDate = dates[0];
          
        //   // 判断这个日期是否是当天之前的日期
        //   const today = moment().format('YYYY-MM-DD');
        //   if (moment(earliestDate).isBefore(today)) {
        //     const previousDayData = result.data[earliestDate] || [];
            
        //     // 只筛选出盘后财报
        //     const afterMarketData = previousDayData.filter((item: EarningsData) => {
        //       return item.releasePeriod.includes('盘后') || 
        //              item.releasePeriod.includes('AMC') || 
        //              item.releasePeriod.includes('After Market Close');
        //     });
            
        //     if (afterMarketData.length > 0) {
        //       setPreviousTradingDayEarnings(afterMarketData);
        //     } else {
        //       setPreviousTradingDayEarnings([]);
        //     }
        //   } else {
        //     setPreviousTradingDayEarnings([]);
        //   }
        // }
      }
    } catch (error) {
      console.error(intl.formatMessage({ id: 'pages.earnings.fetchError', defaultMessage: '获取财报数据失败:' }), error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarningsData(marketCapThreshold);
  }, []);

  // 处理市值筛选变更
  const handleMarketCapThresholdChange = (value: number | null) => {
    if (value !== null && value !== undefined) {
      setMarketCapThreshold(value);
    }
  };

  // 处理刷新数据
  const handleRefresh = () => {
    fetchEarningsData(marketCapThreshold);
  };

  // 市值筛选器控件
  const renderMarketCapFilter = () => {
    return (
      <div className={styles.filterContainer} style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>
        <Form layout="inline">
          <Form.Item label={intl.formatMessage({ id: 'pages.earnings.marketCapFilter', defaultMessage: '市值筛选' })}>
            <InputNumber
              min={10}
              max={5000}
              step={50}
              value={marketCapThreshold}
              onChange={handleMarketCapThresholdChange}
              addonAfter={intl.formatMessage({ id: 'pages.earnings.billion', defaultMessage: '亿' })}
              style={{ width: 150 }}
            />
          </Form.Item>
          <Form.Item>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleRefresh}
              type="primary"
            >
              <FormattedMessage id="pages.earnings.refresh" defaultMessage="刷新" />
            </Button>
          </Form.Item>
        </Form>
      </div>
    );
  };

  // 处理展开/收起行
  const handleExpand = (expanded: boolean, record: EarningsData) => {
    const key = `${record.stockSymbol}-${record.reportDate}`;
    if (expanded) {
      setExpandedRowKeys([...expandedRowKeys, key]);
    } else {
      setExpandedRowKeys(expandedRowKeys.filter((k) => k !== key));
    }
  };

  // 格式化数字为带正负号的百分比
  const formatPercent = (value?: number) => {
    if (value === undefined || value === null) return '-';
    const formattedValue = value.toFixed(2);
    return value > 0 ? `+${formattedValue}%` : `${formattedValue}%`;
  };

  // 格式化财务数字（EPS和收入）
  const formatNumber = (value?: number) => {
    if (value === undefined || value === null) return '-';
    return value.toFixed(2);
  };

  // 格式化市值，超过万亿显示为万亿单位
  const formatMarketCap = (value: number) => {
    const isZhCN = intl.locale === 'zh-CN';
    if (value >= 10000 && isZhCN) {
      // 超过万亿，转换为万亿单位
      return {
        value: (value / 10000).toFixed(2),
        suffix: intl.formatMessage({ id: 'pages.earnings.trillion', defaultMessage: '万亿' })
      };
    } else {
      // 保持亿单位
      return {
        value: value.toFixed(2),
        suffix: intl.formatMessage({ id: 'pages.earnings.billion', defaultMessage: '亿' })
      };
    }
  };

  // 获取百分比数值的样式类名
  const getPercentClassName = (value?: number) => {
    if (value === undefined || value === null) return '';
    return value > 0 ? styles.positive : value < 0 ? styles.negative : '';
  };

  // 获取财报对比的样式类名
  const getCompareClassName = (actual?: number, estimate?: number) => {
    if (actual === undefined || actual === null || estimate === undefined || estimate === null) return '';
    return actual > estimate ? styles.beat : actual < estimate ? styles.miss : '';
  };

  // 历史报告展开内容
  const expandedRowRender = (record: EarningsData) => {
    const hasHistory = record.previousReports && record.previousReports.length > 0;
    
    if (!hasHistory) {
      return <div className={styles.noData}>
        <FormattedMessage id="pages.earnings.noHistoricalData" defaultMessage="没有历史财报数据" />
      </div>;
    }

    const columns = [
      {
        title: <FormattedMessage id="pages.earnings.reportDate" defaultMessage="财报日期" />,
        dataIndex: 'reportDate',
        key: 'reportDate',
        render: (text: string, item: PreviousReport) => (
          <div>
            <div>{text}</div>
            <div style={{ color: '#888' }}>
              {moment(text).format('dddd')} ({item.releasePeriod})
            </div>
          </div>
        ),
      },
      {
        title: <FormattedMessage id="pages.earnings.tradingDate" defaultMessage="交易日期" />,
        dataIndex: 'tradingDate',
        key: 'tradingDate',
        render: (text: string) => (
          <div>
            <div>{text}</div>
            <div style={{ color: '#888' }}>{moment(text).format('dddd')}</div>
          </div>
        ),
      },
      {
        title: <FormattedMessage id="pages.earnings.estimateEps" defaultMessage="预测EPS" />,
        dataIndex: 'estimateEps',
        key: 'estimateEps',
        render: (value?: number) => formatNumber(value),
      },
      {
        title: <FormattedMessage id="pages.earnings.actualEps" defaultMessage="实际EPS" />,
        dataIndex: 'actualEps',
        key: 'actualEps',
        render: (value: number | undefined, item: PreviousReport) => (
          <span className={getCompareClassName(item.actualEps, item.estimateEps)}>
            {formatNumber(value)}
          </span>
        ),
      },
      {
        title: <FormattedMessage id="pages.earnings.epsDifference" defaultMessage="EPS差异" />,
        dataIndex: 'epsDiffPercent',
        key: 'epsDiffPercent',
        render: (value?: number) => (
          <span className={getPercentClassName(value)}>
            {formatPercent(value)}
          </span>
        ),
      },
      {
        title: <FormattedMessage id="pages.earnings.estimateRevenue" defaultMessage="预测营收" />,
        dataIndex: 'estimateRevenueInBillion',
        key: 'estimateRevenueInBillion',
        render: (value?: number) => value ? `${formatNumber(value)}${intl.formatMessage({ id: 'pages.earnings.billion', defaultMessage: '亿' })}` : '-',
      },
      {
        title: <FormattedMessage id="pages.earnings.actualRevenue" defaultMessage="实际营收" />,
        dataIndex: 'actualRevenueInBillion',
        key: 'actualRevenueInBillion',
        render: (value: number | undefined, item: PreviousReport) => (
          <span className={getCompareClassName(item.actualRevenueInBillion, item.estimateRevenueInBillion)}>
            {value ? `${formatNumber(value)}${intl.formatMessage({ id: 'pages.earnings.billion', defaultMessage: '亿' })}` : '-'}
          </span>
        ),
      },
      {
        title: <FormattedMessage id="pages.earnings.revenueDifference" defaultMessage="营收差异" />,
        dataIndex: 'revenueDiffPercent',
        key: 'revenueDiffPercent',
        render: (value?: number) => (
          <span className={getPercentClassName(value)}>
            {formatPercent(value)}
          </span>
        ),
      },
      {
        title: <FormattedMessage id="pages.earnings.stockPerformance" defaultMessage="股票表现" />,
        dataIndex: 'changePercent',
        key: 'changePercent',
        render: (value?: number) => (
          <span className={getPercentClassName(value)}>
            {formatPercent(value)}
          </span>
        ),
      },
      {
        title: <FormattedMessage id="pages.earnings.qqqPerformance" defaultMessage="QQQ表现" />,
        dataIndex: 'qqqChangePercent',
        key: 'qqqChangePercent',
        render: (value?: number) => (
          <span className={getPercentClassName(value)}>
            {formatPercent(value)}
          </span>
        ),
      },
    ];

    return (
      <div className={styles.expandedContent}>
        <Title level={5} className={styles.historyTitle}>
          <FormattedMessage 
            id="pages.earnings.historicalDataTitle" 
            defaultMessage="历史财报数据（最近{count}次）" 
            values={{ count: record.previousReports?.length }}
          />
        </Title>
        <Table
          columns={columns}
          dataSource={record.previousReports}
          rowKey="reportDate"
          pagination={false}
          size="small"
          scroll={{ x: 'max-content' }}
        />
      </div>
    );
  };

  // 定义主表格列
  const getMainColumns = () => {
    return [
      {
        title: <FormattedMessage id="pages.earnings.stockCode" defaultMessage="股票代码" />,
        dataIndex: 'stockSymbol',
        key: 'stockSymbol',
        fixed: 'left' as 'left',
        width: 120,
        render: (text: string, record: EarningsData) => (
          <div>
            <div className={styles.symbolCell}>
              <Text strong>{text}</Text>
            </div>
            <div className={styles.companyNameCell}>
              <Text type="secondary">{record.companyName || ''}</Text>
            </div>
          </div>
        ),
      },
      {
        title: <FormattedMessage id="pages.earnings.marketCap" defaultMessage="市值" />,
        dataIndex: 'marketCapInBillion',
        key: 'marketCapInBillion',
        width: 120,
        render: (value: number) => {
          const { value: formattedValue, suffix } = formatMarketCap(value);
          return <Text>{formattedValue} {suffix}</Text>;
        },
      },
      {
        title: <FormattedMessage id="pages.earnings.releasePeriod" defaultMessage="财报时间" />,
        dataIndex: 'releasePeriod',
        key: 'releasePeriod',
        width: 100,
        render: (value: string) => (
          <Tag color={value.includes('盘后') || value.includes('After Market Close') || value.includes('AMC') ? 'blue' : 'green'}>
            {value}
          </Tag>
        ),
      },
      {
        title: <FormattedMessage id="pages.earnings.estimateEps" defaultMessage="预测EPS" />,
        dataIndex: 'estimateEps',
        key: 'estimateEps',
        width: 90,
        render: (value?: number) => formatNumber(value),
      },
      {
        title: <FormattedMessage id="pages.earnings.estimateRevenue" defaultMessage="预测营收" />,
        dataIndex: 'estimateRevenueInBillion',
        key: 'estimateRevenueInBillion',
        width: 100,
        render: (value?: number) => value ? `${formatNumber(value)}${intl.formatMessage({ id: 'pages.earnings.billion', defaultMessage: '亿' })}` : '-',
      },
      {
        title: <FormattedMessage id="pages.earnings.oneMonthChange" defaultMessage="一个月涨幅" />,
        dataIndex: 'oneMonthChangePercent',
        key: 'oneMonthChangePercent',
        width: 120,
        render: (value?: number) => (
          <span className={getPercentClassName(value)}>
            {formatPercent(value)}
          </span>
        ),
      },
      {
        title: <FormattedMessage id="pages.earnings.threeMonthChange" defaultMessage="三个月涨幅" />,
        dataIndex: 'threeMonthChangePercent',
        key: 'threeMonthChangePercent',
        width: 120,
        render: (value?: number) => (
          <span className={getPercentClassName(value)}>
            {formatPercent(value)}
          </span>
        ),
      },
      {
        title: <FormattedMessage id="pages.earnings.ytdChange" defaultMessage="今年以来涨幅" />,
        dataIndex: 'yearToDateChangePercent',
        key: 'yearToDateChangePercent',
        width: 120,
        render: (value?: number) => (
          <span className={getPercentClassName(value)}>
            {formatPercent(value)}
          </span>
        ),
      },
    ];
  };

  // 渲染日期分组视图
  const renderDateGroup = () => {
    if (loading) {
      return (
        <div className={styles.loadingContainer}>
          <Spin size="large" />
          <p><FormattedMessage id="pages.earnings.loading" defaultMessage="加载财报数据中..." /></p>
        </div>
      );
    }

    const sortedDates = Object.keys(earningsData).sort();
    
    // 如果没有数据
    if (sortedDates.length === 0) {
      return (
        <div className={styles.noDataContainer}>
          <InfoCircleOutlined style={{ fontSize: 48, marginBottom: 16 }} />
          <p><FormattedMessage id="pages.earnings.noEarningsData" defaultMessage="没有符合条件的财报数据" /></p>
        </div>
      );
    }

    // 渲染日期组内容
    return (
      <div className={styles.dateGroupContainer}>
        {/* 渲染每个日期组 */}
        {sortedDates.map((date) => {
          const dateData = earningsData[date] || [];
          // 跳过空数据
          if (dateData.length === 0) return null;
          
          return (
            <Card 
              key={date}
              className={styles.dateCard}
              title={
                <div className={styles.dateCardTitle}>
                  <CalendarOutlined style={{ marginRight: 8 }} />
                  <span>{date} {moment(date).format('dddd')}</span>
                  <Tag style={{ marginLeft: 12 }} color="blue">
                    <FormattedMessage id="pages.earnings.companyCount" defaultMessage="公司数量：{count}" values={{ count: dateData.length }} />
                  </Tag>
                </div>
              }
              style={{ marginBottom: 16 }}
            >
              <Table
                rowKey={(record) => `${record.stockSymbol}-${record.reportDate}`}
                columns={getMainColumns()}
                dataSource={dateData}
                pagination={false}
                expandable={{
                  expandedRowRender,
                  expandRowByClick: true,
                  expandedRowKeys,
                  onExpand: handleExpand,
                  expandIcon: ({ expanded, onExpand, record }) =>
                    expanded ? (
                      <DownOutlined onClick={e => onExpand(record, e!)} />
                    ) : (
                      <RightOutlined onClick={e => onExpand(record, e!)} />
                    ),
                }}
                scroll={{ x: 'max-content' }}
                className={styles.earningsTable}
              />
            </Card>
          );
        })}
        
        {/* 如果有上一个交易日的财报数据，进行显示 */}
        {previousTradingDayEarnings.length > 0 && showPreviousDay && (
          <Card 
            className={styles.dateCard}
            title={
              <div className={styles.dateCardTitle}>
                <CalendarOutlined style={{ marginRight: 8 }} />
                <span>
                  <FormattedMessage id="pages.earnings.previousTradingDay" defaultMessage="上一个交易日盘后财报" />
                </span>
                <Tag style={{ marginLeft: 12 }} color="blue">
                  <FormattedMessage id="pages.earnings.companyCount" defaultMessage="公司数量：{count}" values={{ count: previousTradingDayEarnings.length }} />
                </Tag>
              </div>
            }
            style={{ marginBottom: 16 }}
            extra={
              <Button 
                type="text" 
                onClick={(e) => { e.stopPropagation(); setShowPreviousDay(false); }}
                size="small"
              >
                <FormattedMessage id="pages.earnings.hide" defaultMessage="隐藏" />
              </Button>
            }
          >
            <Table
              rowKey={(record) => `${record.stockSymbol}-${record.reportDate}-previous`}
              columns={getMainColumns()}
              dataSource={previousTradingDayEarnings}
              pagination={false}
              expandable={{
                expandedRowRender,
                expandRowByClick: true,
                expandedRowKeys,
                onExpand: handleExpand,
                expandIcon: ({ expanded, onExpand, record }) =>
                  expanded ? (
                    <DownOutlined onClick={e => onExpand(record, e!)} />
                  ) : (
                    <RightOutlined onClick={e => onExpand(record, e!)} />
                  ),
              }}
              scroll={{ x: 'max-content' }}
              className={styles.earningsTable}
            />
          </Card>
        )}
      </div>
    );
  };

  // 移动端视图
  const renderMobileView = () => {
    // 移动端显示简化版本
    if (loading) {
      return (
        <div className={styles.loadingContainer}>
          <Spin size="large" />
          <p><FormattedMessage id="pages.earnings.loading" defaultMessage="加载财报数据中..." /></p>
        </div>
      );
    }

    const sortedDates = Object.keys(earningsData).sort();
    
    // 如果没有数据
    if (sortedDates.length === 0) {
      return (
        <div className={styles.noDataContainer}>
          <InfoCircleOutlined style={{ fontSize: 48, marginBottom: 16 }} />
          <p><FormattedMessage id="pages.earnings.noEarningsData" defaultMessage="没有符合条件的财报数据" /></p>
        </div>
      );
    }

    // 渲染折叠面板
    return (
      <div className={styles.mobileContainer}>
        <Collapse defaultActiveKey={[sortedDates[0]]} accordion>
          {sortedDates.map((date) => {
            const dateData = earningsData[date] || [];
            if (dateData.length === 0) return null;
            
            return (
              <Panel 
                key={date}
                header={
                  <div className={styles.mobilePanelHeader}>
                    <div>{date} {moment(date).format('dddd')}</div>
                    <div className={styles.mobilePanelCount}>
                      <FormattedMessage id="pages.earnings.companyCount" defaultMessage="公司数量：{count}" values={{ count: dateData.length }} />
                    </div>
                  </div>
                }
              >
                {dateData.map((item) => (
                  <Card key={`${item.stockSymbol}-${item.reportDate}`} className={styles.mobileCard}>
                    <div className={styles.mobileCardHeader}>
                      <div className={styles.mobileStockSymbol}>
                        <strong>{item.stockSymbol}</strong>
                        <span className={styles.mobileCompanyName}>{item.companyName}</span>
                      </div>
                      <Tag color={item.releasePeriod.includes('盘后') || item.releasePeriod.includes('After Market Close') || item.releasePeriod.includes('AMC') ? 'blue' : 'green'}>
                        {item.releasePeriod}
                      </Tag>
                    </div>
                    
                    <div className={styles.mobileCardBody}>
                      <div className={styles.mobileInfoRow}>
                        <span><FormattedMessage id="pages.earnings.marketCap" defaultMessage="市值" />: </span>
                        <span>{formatMarketCap(item.marketCapInBillion).value} {formatMarketCap(item.marketCapInBillion).suffix}</span>
                      </div>
                      <div className={styles.mobileInfoRow}>
                        <span><FormattedMessage id="pages.earnings.estimateEps" defaultMessage="预测EPS" />: </span>
                        <span>{formatNumber(item.estimateEps)}</span>
                      </div>
                      <div className={styles.mobileInfoRow}>
                        <span><FormattedMessage id="pages.earnings.estimateRevenue" defaultMessage="预测营收" />: </span>
                        <span>{item.estimateRevenueInBillion ? `${formatNumber(item.estimateRevenueInBillion)}${intl.formatMessage({ id: 'pages.earnings.billion', defaultMessage: '亿' })}` : '-'}</span>
                      </div>
                      <div className={styles.mobileInfoRow}>
                        <span><FormattedMessage id="pages.earnings.oneMonthChange" defaultMessage="一个月涨幅" />: </span>
                        <span className={getPercentClassName(item.oneMonthChangePercent)}>
                          {formatPercent(item.oneMonthChangePercent)}
                        </span>
                      </div>
                      <div className={styles.mobileInfoRow}>
                        <span><FormattedMessage id="pages.earnings.threeMonthChange" defaultMessage="三个月涨幅" />: </span>
                        <span className={getPercentClassName(item.threeMonthChangePercent)}>
                          {formatPercent(item.threeMonthChangePercent)}
                        </span>
                      </div>
                      <div className={styles.mobileInfoRow}>
                        <span><FormattedMessage id="pages.earnings.ytdChange" defaultMessage="今年以来涨幅" />: </span>
                        <span className={getPercentClassName(item.yearToDateChangePercent)}>
                          {formatPercent(item.yearToDateChangePercent)}
                        </span>
                      </div>
                    </div>
                    
                    {/* 历史数据按钮 */}
                    {item.previousReports && item.previousReports.length > 0 && (
                      <div className={styles.mobileCardFooter}>
                        <Collapse accordion>
                          <Panel 
                            header={
                              <FormattedMessage id="pages.earnings.viewHistoricalData" defaultMessage="查看历史财报数据" />
                            } 
                            key="1"
                          >
                            {item.previousReports.map((report) => (
                              <div key={report.reportDate} className={styles.mobileHistoryItem}>
                                <div className={styles.mobileHistoryHeader}>
                                  <div>
                                    {report.reportDate} ({report.releasePeriod})
                                  </div>
                                  <div>
                                    <FormattedMessage id="pages.earnings.stockChange" defaultMessage="股价变动" />: 
                                    <span className={getPercentClassName(report.changePercent)}>
                                      {formatPercent(report.changePercent)}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className={styles.mobileHistoryDetails}>
                                  <div className={styles.mobileHistoryRow}>
                                    <div>
                                      <div><FormattedMessage id="pages.earnings.estimateEps" defaultMessage="预测EPS" /></div>
                                      <div>{formatNumber(report.estimateEps)}</div>
                                    </div>
                                    <div>
                                      <div><FormattedMessage id="pages.earnings.actualEps" defaultMessage="实际EPS" /></div>
                                      <div className={getCompareClassName(report.actualEps, report.estimateEps)}>
                                        {formatNumber(report.actualEps)}
                                      </div>
                                    </div>
                                    <div>
                                      <div><FormattedMessage id="pages.earnings.epsDifference" defaultMessage="EPS差异" /></div>
                                      <div className={getPercentClassName(report.epsDiffPercent)}>
                                        {formatPercent(report.epsDiffPercent)}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className={styles.mobileHistoryRow}>
                                    <div>
                                      <div><FormattedMessage id="pages.earnings.estimateRevenue" defaultMessage="预测营收" /></div>
                                      <div>
                                        {report.estimateRevenueInBillion 
                                          ? `${formatNumber(report.estimateRevenueInBillion)}${intl.formatMessage({ id: 'pages.earnings.billion', defaultMessage: '亿' })}` 
                                          : '-'
                                        }
                                      </div>
                                    </div>
                                    <div>
                                      <div><FormattedMessage id="pages.earnings.actualRevenue" defaultMessage="实际营收" /></div>
                                      <div className={getCompareClassName(report.actualRevenueInBillion, report.estimateRevenueInBillion)}>
                                        {report.actualRevenueInBillion 
                                          ? `${formatNumber(report.actualRevenueInBillion)}${intl.formatMessage({ id: 'pages.earnings.billion', defaultMessage: '亿' })}` 
                                          : '-'
                                        }
                                      </div>
                                    </div>
                                    <div>
                                      <div><FormattedMessage id="pages.earnings.revenueDifference" defaultMessage="营收差异" /></div>
                                      <div className={getPercentClassName(report.revenueDiffPercent)}>
                                        {formatPercent(report.revenueDiffPercent)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </Panel>
                        </Collapse>
                      </div>
                    )}
                  </Card>
                ))}
              </Panel>
            );
          })}
          
          {/* 上一个交易日的财报数据 */}
          {previousTradingDayEarnings.length > 0 && showPreviousDay && (
            <Panel 
              key="previous-trading-day"
              header={
                <div className={styles.mobilePanelHeader}>
                  <div>
                    <FormattedMessage id="pages.earnings.previousTradingDay" defaultMessage="上一个交易日盘后财报" />
                  </div>
                  <div className={styles.mobilePanelCount}>
                    <FormattedMessage id="pages.earnings.companyCount" defaultMessage="公司数量：{count}" values={{ count: previousTradingDayEarnings.length }} />
                  </div>
                </div>
              }
              extra={
                <Button 
                  type="text" 
                  onClick={(e) => { e.stopPropagation(); setShowPreviousDay(false); }}
                  size="small"
                >
                  <FormattedMessage id="pages.earnings.hide" defaultMessage="隐藏" />
                </Button>
              }
            >
              {/* 此处内容类似于上面的渲染方式 */}
            </Panel>
          )}
        </Collapse>
      </div>
    );
  };

  return (
    <PageContainer>
      <Card>
        <Title level={4}>
          <FormattedMessage id="pages.earnings.pageTitle" defaultMessage="财报日历" />
        </Title>
        <Paragraph>
          <FormattedMessage id="pages.earnings.pageDescription" defaultMessage="美股上市公司财报发布日历与历史财报数据" />
        </Paragraph>
        
        {renderMarketCapFilter()}
        
        {isMobile ? renderMobileView() : renderDateGroup()}
      </Card>
    </PageContainer>
  );
};

export default EarningsCalendar; 