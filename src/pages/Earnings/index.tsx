import React, { useState, useEffect, useRef } from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { Card, Table, Typography, Tag, Button, Spin, Tooltip, Row, Col, Statistic, Collapse, Space, Grid } from 'antd';
import { DownOutlined, RightOutlined, InfoCircleOutlined, CalendarOutlined, DollarOutlined, LineChartOutlined } from '@ant-design/icons';
import { request } from 'umi';
import useMediaQuery from 'react-responsive';
import moment from 'moment';
import styles from './index.less';

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;
const { Panel } = Collapse;

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
  const [loading, setLoading] = useState<boolean>(true);
  const [earningsData, setEarningsData] = useState<Record<string, EarningsData[]>>({});
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  
  // 使用响应式布局钩子
  const screens = useBreakpoint();
  const isMobile = !screens.md; // md断点以下视为移动设备

  // 获取财报数据
  const fetchEarningsData = async () => {
    setLoading(true);
    try {
      const result = await request('/api/earnings/calendar');
      if (result.success) {
        setEarningsData(result.data);
      }
    } catch (error) {
      console.error('获取财报数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarningsData();
  }, []);

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
    if (value >= 10000) {
      // 超过万亿，转换为万亿单位
      return {
        value: (value / 10000).toFixed(2),
        suffix: '万亿'
      };
    } else {
      // 保持亿单位
      return {
        value: value.toFixed(2),
        suffix: '亿'
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
      return <div className={styles.noData}>没有历史财报数据</div>;
    }

    const columns = [
      {
        title: '财报日期',
        dataIndex: 'reportDate',
        key: 'reportDate',
        render: (text: string, item: PreviousReport) => (
          <span>
            {text} ({item.releasePeriod})
          </span>
        ),
      },
      {
        title: '预测EPS',
        dataIndex: 'estimateEps',
        key: 'estimateEps',
        render: (value?: number) => formatNumber(value),
      },
      {
        title: '实际EPS',
        dataIndex: 'actualEps',
        key: 'actualEps',
        render: (value: number | undefined, item: PreviousReport) => (
          <span className={getCompareClassName(item.actualEps, item.estimateEps)}>
            {formatNumber(value)}
          </span>
        ),
      },
      {
        title: 'EPS差异',
        dataIndex: 'epsDiffPercent',
        key: 'epsDiffPercent',
        render: (value?: number) => (
          <span className={getPercentClassName(value)}>
            {formatPercent(value)}
          </span>
        ),
      },
      {
        title: '预测收入(亿)',
        dataIndex: 'estimateRevenueInBillion',
        key: 'estimateRevenueInBillion',
        render: (value?: number) => formatNumber(value),
      },
      {
        title: '实际收入(亿)',
        dataIndex: 'actualRevenueInBillion',
        key: 'actualRevenueInBillion',
        render: (value: number | undefined, item: PreviousReport) => (
          <span className={getCompareClassName(item.actualRevenueInBillion, item.estimateRevenueInBillion)}>
            {formatNumber(value)}
          </span>
        ),
      },
      {
        title: '收入差异',
        dataIndex: 'revenueDiffPercent',
        key: 'revenueDiffPercent',
        render: (value?: number) => (
          <span className={getPercentClassName(value)}>
            {formatPercent(value)}
          </span>
        ),
      },
      {
        title: '财报后股价',
        dataIndex: 'changePercent',
        key: 'changePercent',
        render: (value?: number) => (
          <span className={getPercentClassName(value)}>
            {formatPercent(value)}
          </span>
        ),
      },
      {
        title: '同期QQQ',
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
        <Title level={5} className={styles.historyTitle}>历史财报数据（最近{record.previousReports?.length}次）</Title>
        <Table
          columns={columns}
          dataSource={record.previousReports}
          pagination={false}
          size="small"
          rowKey="reportDate"
        />
      </div>
    );
  };

  // 主表格列定义
  const mainColumns = [
    {
      title: '股票代码',
      dataIndex: 'stockSymbol',
      key: 'stockSymbol',
      width: 120,
      render: (text: string, record: EarningsData) => (
        <>
          <div className={styles.stockSymbol}>{text}</div>
          {record.companyName && <div className={styles.companyName}>{record.companyName}</div>}
        </>
      ),
    },
    {
      title: '财报信息',
      key: 'reportInfo',
      width: 200,
      render: (_: any, record: EarningsData) => (
        <div>
          <div className={styles.reportDate}>
            <Text strong>财报日期：</Text>{record.reportDate}
          </div>
          <div className={styles.releasePeriod}>
            <Text strong>发布时段：</Text>
            <Tag color={
              record.releasePeriod.includes('盘前') || record.releasePeriod.includes('BMO') ? 'blue' : 
              record.releasePeriod.includes('盘后') || record.releasePeriod.includes('AMC') ? 'purple' : 'green'
            }>
              {record.releasePeriod}
            </Tag>
          </div>
        </div>
      ),
    },
    {
      title: '市值信息',
      key: 'marketCapInfo',
      width: 150,
      render: (_: any, record: EarningsData) => {
        const marketCap = formatMarketCap(record.marketCapInBillion);
        return (
          <Statistic 
            title="市值" 
            value={marketCap.value} 
            suffix={marketCap.suffix} 
            precision={2}
            groupSeparator=","
          />
        );
      },
    },
    {
      title: '财务预测',
      key: 'forecast',
      width: 200,
      render: (_: any, record: EarningsData) => (
        <Row gutter={16}>
          <Col span={12}>
            <Statistic
              title={<>EPS <Tooltip title="每股收益预测"><InfoCircleOutlined /></Tooltip></>}
              value={record.estimateEps || '-'}
              precision={2}
              valueStyle={{ fontSize: '16px' }}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title={<>收入 <Tooltip title="预测收入（亿）"><InfoCircleOutlined /></Tooltip></>}
              value={record.estimateRevenueInBillion || '-'}
              precision={2}
              suffix="亿"
              valueStyle={{ fontSize: '16px' }}
              groupSeparator=","
            />
          </Col>
        </Row>
      ),
    },
    {
      title: '股价表现',
      key: 'performance',
      width: 200,
      render: (_: any, record: EarningsData) => (
        <div className={styles.performanceContainer}>
          <div className={styles.performanceItem}>
            <Text strong>近1月：</Text>
            <span className={getPercentClassName(record.oneMonthChangePercent)}>
              {formatPercent(record.oneMonthChangePercent)}
            </span>
          </div>
          <div className={styles.performanceItem}>
            <Text strong>近3月：</Text>
            <span className={getPercentClassName(record.threeMonthChangePercent)}>
              {formatPercent(record.threeMonthChangePercent)}
            </span>
          </div>
          <div className={styles.performanceItem}>
            <Text strong>今年以来：</Text>
            <span className={getPercentClassName(record.yearToDateChangePercent)}>
              {formatPercent(record.yearToDateChangePercent)}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: '历史对比',
      key: 'action',
      width: 120,
      render: (_: any, record: EarningsData) => {
        const key = `${record.stockSymbol}-${record.reportDate}`;
        const expanded = expandedRowKeys.includes(key);
        return (
          <Button 
            type="link" 
            onClick={() => handleExpand(!expanded, record)}
            icon={expanded ? <DownOutlined /> : <RightOutlined />}
          >
            {expanded ? '收起历史' : '查看历史'}
          </Button>
        );
      },
    },
  ];

  // 移动端显示的卡片视图
  const renderMobileView = () => {
    return Object.keys(earningsData)
      .sort()
      .map((date) => {
        const dayData = earningsData[date];
        return (
          <Card 
            key={date} 
            title={
              <div className={styles.dateTitle}>
                <span className={styles.date}>{date}</span>
                <span className={styles.count}>({dayData.length}家公司)</span>
              </div>
            }
            className={styles.dateCard}
            bordered={false}
          >
            <Collapse accordion className={styles.mobileCollapse}>
              {dayData.map((record) => {
                const marketCap = formatMarketCap(record.marketCapInBillion);
                const hasHistory = record.previousReports && record.previousReports.length > 0;
                
                return (
                  <Panel 
                    key={`${record.stockSymbol}-${record.reportDate}`} 
                    header={
                      <div className={styles.mobilePanelHeader}>
                        <div className={styles.stockSymbol}>{record.stockSymbol}</div>
                        {record.companyName && <div className={styles.companyName}>{record.companyName}</div>}
                      </div>
                    }
                    className={styles.mobilePanel}
                  >
                    <div className={styles.mobileCardContent}>
                      <div className={styles.mobileSection}>
                        <div className={styles.mobileSectionTitle}>
                          <CalendarOutlined /> 财报信息
                        </div>
                        <div className={styles.mobileSectionContent}>
                          <div className={styles.infoItem}>
                            <Text strong>日期：</Text>{record.reportDate}
                          </div>
                          <div className={styles.infoItem}>
                            <Text strong>时段：</Text>
                            <Tag color={
                              record.releasePeriod.includes('盘前') || record.releasePeriod.includes('BMO') ? 'blue' : 
                              record.releasePeriod.includes('盘后') || record.releasePeriod.includes('AMC') ? 'purple' : 'green'
                            }>
                              {record.releasePeriod}
                            </Tag>
                          </div>
                          <div className={styles.infoItem}>
                            <Text strong>市值：</Text>
                            <Text>{marketCap.value} {marketCap.suffix}</Text>
                          </div>
                        </div>
                      </div>
                      
                      <div className={styles.mobileSection}>
                        <div className={styles.mobileSectionTitle}>
                          <DollarOutlined /> 财务预测
                        </div>
                        <div className={styles.mobileSectionContent}>
                          <Row gutter={16}>
                            <Col span={12}>
                              <div className={styles.infoItem}>
                                <Text strong>EPS：</Text>
                                <Text>{record.estimateEps ? formatNumber(record.estimateEps) : '-'}</Text>
                              </div>
                            </Col>
                            <Col span={12}>
                              <div className={styles.infoItem}>
                                <Text strong>收入(亿)：</Text>
                                <Text>{record.estimateRevenueInBillion ? formatNumber(record.estimateRevenueInBillion) : '-'}</Text>
                              </div>
                            </Col>
                          </Row>
                        </div>
                      </div>
                      
                      <div className={styles.mobileSection}>
                        <div className={styles.mobileSectionTitle}>
                          <LineChartOutlined /> 股价表现
                        </div>
                        <div className={styles.mobileSectionContent}>
                          <Row gutter={16}>
                            <Col span={8}>
                              <div className={styles.infoItem}>
                                <Text strong>近1月：</Text>
                                <span className={getPercentClassName(record.oneMonthChangePercent)}>
                                  {formatPercent(record.oneMonthChangePercent)}
                                </span>
                              </div>
                            </Col>
                            <Col span={8}>
                              <div className={styles.infoItem}>
                                <Text strong>近3月：</Text>
                                <span className={getPercentClassName(record.threeMonthChangePercent)}>
                                  {formatPercent(record.threeMonthChangePercent)}
                                </span>
                              </div>
                            </Col>
                            <Col span={8}>
                              <div className={styles.infoItem}>
                                <Text strong>今年：</Text>
                                <span className={getPercentClassName(record.yearToDateChangePercent)}>
                                  {formatPercent(record.yearToDateChangePercent)}
                                </span>
                              </div>
                            </Col>
                          </Row>
                        </div>
                      </div>
                      
                      {hasHistory && (
                        <div className={styles.mobileSection}>
                          <div className={styles.mobileSectionTitle}>
                            <Text strong>历史财报数据</Text>
                          </div>
                          <div className={styles.mobileSectionContent}>
                            {record.previousReports?.map((prevReport, index) => (
                              <div key={prevReport.reportDate} className={styles.historyItem}>
                                <div className={styles.historyHeader}>
                                  <Text strong>{`#${index + 1} ${prevReport.reportDate} (${prevReport.releasePeriod})`}</Text>
                                </div>
                                <div className={styles.historyDetails}>
                                  <div className={styles.historyDetail}>
                                    <Text>EPS: </Text>
                                    <Space>
                                      <Text>预测 {formatNumber(prevReport.estimateEps)}</Text>
                                      <Text>实际 </Text>
                                      <span className={getCompareClassName(prevReport.actualEps, prevReport.estimateEps)}>
                                        {formatNumber(prevReport.actualEps)}
                                      </span>
                                      <span className={getPercentClassName(prevReport.epsDiffPercent)}>
                                        {formatPercent(prevReport.epsDiffPercent)}
                                      </span>
                                    </Space>
                                  </div>
                                  <div className={styles.historyDetail}>
                                    <Text>收入(亿): </Text>
                                    <Space>
                                      <Text>预测 {formatNumber(prevReport.estimateRevenueInBillion)}</Text>
                                      <Text>实际 </Text>
                                      <span className={getCompareClassName(prevReport.actualRevenueInBillion, prevReport.estimateRevenueInBillion)}>
                                        {formatNumber(prevReport.actualRevenueInBillion)}
                                      </span>
                                      <span className={getPercentClassName(prevReport.revenueDiffPercent)}>
                                        {formatPercent(prevReport.revenueDiffPercent)}
                                      </span>
                                    </Space>
                                  </div>
                                  <div className={styles.historyDetail}>
                                    <Text>股价变动: </Text>
                                    <Space>
                                      <span className={getPercentClassName(prevReport.changePercent)}>
                                        {formatPercent(prevReport.changePercent)}
                                      </span>
                                      <Text>(大盘: </Text>
                                      <span className={getPercentClassName(prevReport.qqqChangePercent)}>
                                        {formatPercent(prevReport.qqqChangePercent)}
                                      </span>
                                      <Text>)</Text>
                                    </Space>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Panel>
                );
              })}
            </Collapse>
          </Card>
        );
      });
  };

  // 桌面端表格视图
  const renderDateGroup = () => {
    return Object.keys(earningsData)
      .sort() // 按日期升序排序
      .map((date) => {
        const dayData = earningsData[date];
        return (
          <Card 
            key={date} 
            title={
              <div className={styles.dateTitle}>
                <span className={styles.date}>{date}</span>
                <span className={styles.count}>({dayData.length}家公司)</span>
              </div>
            }
            className={styles.dateCard}
            bordered={false}
          >
            <Table
              columns={mainColumns}
              dataSource={dayData}
              rowKey={(record) => `${record.stockSymbol}-${record.reportDate}`}
              expandable={{
                expandedRowRender,
                expandedRowKeys,
                onExpand: handleExpand,
                expandIcon: () => null, // 不显示默认展开图标，使用自定义按钮
              }}
              pagination={false}
              scroll={{ x: 'max-content' }}
            />
          </Card>
        );
      });
  };

  return (
    <PageContainer title="财报数据站">
      <Spin spinning={loading} tip="加载中...">
        <div className={styles.container}>
          {Object.keys(earningsData).length > 0 ? (
            isMobile ? renderMobileView() : renderDateGroup()
          ) : (
            <Card>
              <div className={styles.noData}>
                {loading ? '正在加载数据...' : '暂无财报数据'}
              </div>
            </Card>
          )}
        </div>
      </Spin>
    </PageContainer>
  );
};

export default EarningsCalendar; 